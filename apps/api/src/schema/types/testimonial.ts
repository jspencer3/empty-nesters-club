import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { User } from './user.js'
import { NestRef } from './nest.js'

// --- Enums ---

const TestimonialVisibilityEnum = builder.enumType('TestimonialVisibilityEnum', {
  values: ['USER_PRIVATE', 'FAMILY_PRIVATE', 'NEST_PRIVATE', 'PUBLIC'] as const,
})

builder.enumType('ApprovalStatusEnum', {
  values: ['PENDING', 'APPROVED', 'REJECTED'] as const,
})

// --- Object Types ---

const Testimonial = builder.objectRef<{
  id: string
  body: string
  visibility: string
  nestId: string | null
  approvalStatus: string
  authorId: string
  approvedById: string | null
  createdAt: Date
  updatedAt: Date
}>('Testimonial')

builder.objectType(Testimonial, {
  fields: (t) => ({
    id: t.exposeID('id'),
    body: t.exposeString('body'),
    visibility: t.exposeString('visibility'),
    nestId: t.exposeString('nestId', { nullable: true }),
    approvalStatus: t.exposeString('approvalStatus'),
    createdAt: t.string({ resolve: (testimonial) => testimonial.createdAt.toISOString() }),
    updatedAt: t.string({ resolve: (testimonial) => testimonial.updatedAt.toISOString() }),
    nest: t.field({
      type: NestRef,
      nullable: true,
      resolve: async (testimonial) => {
        if (!testimonial.nestId) return null
        return prisma.nest.findUnique({ where: { id: testimonial.nestId } })
      },
    }),
    author: t.field({
      type: User,
      resolve: async (testimonial) => {
        const user = await prisma.user.findUnique({ where: { id: testimonial.authorId } })
        if (!user) throw new Error('Author not found')
        return user
      },
    }),
    approvedBy: t.field({
      type: User,
      nullable: true,
      resolve: async (testimonial) => {
        if (!testimonial.approvedById) return null
        return prisma.user.findUnique({ where: { id: testimonial.approvedById } })
      },
    }),
  }),
})

// --- Helper ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

// --- Queries ---

builder.queryField('myTestimonials', (t) =>
  t.field({
    type: [Testimonial],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.testimonial.findMany({
        where: { authorId: user.id },
      })
    },
  }),
)

builder.queryField('nestTestimonials', (t) =>
  t.field({
    type: [Testimonial],
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Must be a member of the nest
      const membership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
      })
      if (!membership) {
        throw new Error('You are not a member of this nest')
      }

      return prisma.testimonial.findMany({
        where: {
          nestId: args.nestId,
          approvalStatus: 'APPROVED',
          visibility: { in: ['NEST_PRIVATE', 'PUBLIC'] },
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

builder.queryField('publicTestimonials', (t) =>
  t.field({
    type: [Testimonial],
    args: {
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args) => {
      const limit = args.limit ?? 10
      return prisma.testimonial.findMany({
        where: {
          visibility: 'PUBLIC',
          approvalStatus: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    },
  }),
)

// --- Mutations ---

const CreateTestimonialInput = builder.inputType('CreateTestimonialInput', {
  fields: (t) => ({
    body: t.string({ required: true }),
    visibility: t.field({ type: TestimonialVisibilityEnum, required: true }),
    nestId: t.string(),
  }),
})

builder.mutationField('createTestimonial', (t) =>
  t.field({
    type: Testimonial,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateTestimonialInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      const { body, visibility, nestId } = args.input

      // NEST_PRIVATE requires nestId and membership
      if (visibility === 'NEST_PRIVATE') {
        if (!nestId) {
          throw new Error('nestId is required for NEST_PRIVATE visibility')
        }
        const membership = await prisma.nestMembership.findUnique({
          where: { nestId_userId: { nestId, userId: user.id } },
        })
        if (!membership) {
          throw new Error('You are not a member of this nest')
        }
      }

      // NEST_PRIVATE and USER_PRIVATE and FAMILY_PRIVATE are auto-approved
      const autoApprove =
        visibility === 'USER_PRIVATE' ||
        visibility === 'FAMILY_PRIVATE' ||
        visibility === 'NEST_PRIVATE'

      return prisma.testimonial.create({
        data: {
          authorId: user.id,
          body,
          visibility,
          nestId: nestId ?? undefined,
          approvalStatus: autoApprove ? 'APPROVED' : 'PENDING',
          approvedById: autoApprove ? user.id : undefined,
        },
      })
    },
  }),
)

const UpdateTestimonialInput = builder.inputType('UpdateTestimonialInput', {
  fields: (t) => ({
    body: t.string(),
    visibility: t.field({ type: TestimonialVisibilityEnum }),
  }),
})

builder.mutationField('updateTestimonial', (t) =>
  t.field({
    type: Testimonial,
    authScopes: { authenticated: true },
    args: {
      testimonialId: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateTestimonialInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const testimonial = await prisma.testimonial.findUnique({
        where: { id: args.testimonialId },
      })
      if (!testimonial) throw new Error('Testimonial not found')
      if (testimonial.authorId !== user.id) {
        throw new Error('Only the author can update this testimonial')
      }

      const { body, visibility } = args.input

      // If visibility changes to one requiring approval, reset status
      const requiresApproval =
        visibility && (visibility === 'NEST_PRIVATE' || visibility === 'PUBLIC')
      const visibilityChanged = visibility && visibility !== testimonial.visibility

      return prisma.testimonial.update({
        where: { id: args.testimonialId },
        data: {
          ...(body && { body }),
          ...(visibility && { visibility }),
          ...(requiresApproval &&
            visibilityChanged && {
              approvalStatus: 'PENDING',
              approvedById: null,
            }),
        },
      })
    },
  }),
)

builder.mutationField('deleteTestimonial', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      testimonialId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const testimonial = await prisma.testimonial.findUnique({
        where: { id: args.testimonialId },
      })
      if (!testimonial) throw new Error('Testimonial not found')
      if (testimonial.authorId !== user.id) {
        throw new Error('Only the author can delete this testimonial')
      }

      await prisma.testimonial.delete({ where: { id: args.testimonialId } })
      return true
    },
  }),
)

export { Testimonial }

import { builder } from '../builder.js'
import { prisma } from '@enc/db'

const ProfileVisibility = builder.enumType('ProfileVisibility', {
  values: ['PUBLIC', 'NEST_MEMBERS', 'PARTNER_GROUP', 'PRIVATE'] as const,
})

const User = builder.objectRef<{
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  yearsEmpty: number | null
  numberOfKids: number | null
  interests: string[]
  role: string
  profileVisibility: string
  createdAt: Date
  updatedAt: Date
}>('User')

builder.objectType(User, {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    displayName: t.exposeString('displayName'),
    avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    yearsEmpty: t.exposeInt('yearsEmpty', { nullable: true }),
    numberOfKids: t.exposeInt('numberOfKids', { nullable: true }),
    interests: t.exposeStringList('interests'),
    role: t.exposeString('role'),
    profileVisibility: t.exposeString('profileVisibility'),
    createdAt: t.string({ resolve: (user) => user.createdAt.toISOString() }),
    updatedAt: t.string({ resolve: (user) => user.updatedAt.toISOString() }),
  }),
})

// Query: get current user profile
builder.queryField('me', (t) =>
  t.field({
    type: User,
    nullable: true,
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.currentUser) return null
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser.id },
      })
      return user
    },
  }),
)

// Query: get user by ID (respects visibility)
builder.queryField('user', (t) =>
  t.field({
    type: User,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const user = await prisma.user.findUnique({
        where: { id: args.id },
      })
      return user
    },
  }),
)

// Mutation: ensure user exists (called by frontend after auth state change)
// Upserts a User record using JWT claims — idempotent
builder.mutationField('ensureUser', (t) =>
  t.field({
    type: User,
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const { id: supabaseId, email } = ctx.currentUser!
      const displayName = email.split('@')[0] ?? 'New User'

      return prisma.user.upsert({
        where: { supabaseId },
        update: {}, // Don't overwrite existing data
        create: {
          supabaseId,
          email,
          displayName,
        },
      })
    },
  }),
)

// Mutation: create profile (called after Supabase signup)
const CreateProfileInput = builder.inputType('CreateProfileInput', {
  fields: (t) => ({
    displayName: t.string({ required: true }),
    bio: t.string(),
    yearsEmpty: t.int(),
    numberOfKids: t.int(),
    interests: t.stringList(),
  }),
})

builder.mutationField('createProfile', (t) =>
  t.field({
    type: User,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateProfileInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const existing = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (existing) {
        throw new Error('Profile already exists')
      }

      return prisma.user.create({
        data: {
          email: ctx.currentUser!.email,
          supabaseId: ctx.currentUser!.id,
          displayName: args.input.displayName,
          bio: args.input.bio ?? undefined,
          yearsEmpty: args.input.yearsEmpty ?? undefined,
          numberOfKids: args.input.numberOfKids ?? undefined,
          interests: args.input.interests ?? [],
        },
      })
    },
  }),
)

// Mutation: update profile
const UpdateProfileInput = builder.inputType('UpdateProfileInput', {
  fields: (t) => ({
    displayName: t.string(),
    bio: t.string(),
    yearsEmpty: t.int(),
    numberOfKids: t.int(),
    interests: t.stringList(),
    profileVisibility: t.field({ type: ProfileVisibility }),
  }),
})

builder.mutationField('updateProfile', (t) =>
  t.field({
    type: User,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: UpdateProfileInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) {
        throw new Error('Profile not found')
      }

      return prisma.user.update({
        where: { id: user.id },
        data: {
          ...(args.input.displayName && { displayName: args.input.displayName }),
          ...(args.input.bio !== undefined && { bio: args.input.bio }),
          ...(args.input.yearsEmpty !== undefined && { yearsEmpty: args.input.yearsEmpty }),
          ...(args.input.numberOfKids !== undefined && { numberOfKids: args.input.numberOfKids }),
          ...(args.input.interests && { interests: args.input.interests }),
          ...(args.input.profileVisibility && { profileVisibility: args.input.profileVisibility }),
        },
      })
    },
  }),
)

export { User }

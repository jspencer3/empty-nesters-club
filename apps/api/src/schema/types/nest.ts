import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { User } from './user.js'

// --- Enums ---

builder.enumType('NestRole', {
  values: ['MEMBER', 'ADMIN'] as const,
})

builder.enumType('NestInviteStatus', {
  values: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'] as const,
})

builder.enumType('NestVisibility', {
  values: ['PUBLIC', 'PRIVATE'] as const,
})

builder.enumType('NestJoinRequestStatus', {
  values: ['PENDING', 'APPROVED', 'DENIED'] as const,
})

builder.enumType('AdminVoteStatus', {
  values: ['OPEN', 'PASSED', 'FAILED', 'CANCELLED'] as const,
})

// --- Object Types ---

const NestMembershipRef = builder.objectRef<{
  id: string
  nestId: string
  userId: string
  partnerGroupId: string | null
  role: string
  lastActiveAt: Date
  joinedAt: Date
}>('NestMembership')

builder.objectType(NestMembershipRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    nestId: t.exposeString('nestId'),
    userId: t.exposeString('userId'),
    partnerGroupId: t.exposeString('partnerGroupId', { nullable: true }),
    role: t.exposeString('role'),
    lastActiveAt: t.string({ resolve: (m) => m.lastActiveAt.toISOString() }),
    joinedAt: t.string({ resolve: (m) => m.joinedAt.toISOString() }),
    user: t.field({
      type: User,
      nullable: true,
      resolve: async (membership) => {
        return prisma.user.findUnique({ where: { id: membership.userId } })
      },
    }),
    nest: t.field({
      type: NestRef,
      resolve: async (membership) => {
        const nest = await prisma.nest.findUnique({ where: { id: membership.nestId } })
        if (!nest) throw new Error('Nest not found')
        return nest
      },
    }),
  }),
})

const NestInviteRef = builder.objectRef<{
  id: string
  nestId: string
  inviterId: string
  inviteeId: string | null
  inviteeEmail: string
  status: string
  createdAt: Date
  respondedAt: Date | null
}>('NestInvite')

builder.objectType(NestInviteRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    nestId: t.exposeString('nestId'),
    inviterId: t.exposeString('inviterId'),
    inviteeEmail: t.exposeString('inviteeEmail'),
    status: t.exposeString('status'),
    createdAt: t.string({ resolve: (i) => i.createdAt.toISOString() }),
    nest: t.field({
      type: NestRef,
      resolve: async (invite) => {
        const nest = await prisma.nest.findUnique({ where: { id: invite.nestId } })
        if (!nest) throw new Error('Nest not found')
        return nest
      },
    }),
    inviter: t.field({
      type: User,
      resolve: async (invite) => {
        const user = await prisma.user.findUnique({ where: { id: invite.inviterId } })
        if (!user) throw new Error('Inviter not found')
        return user
      },
    }),
  }),
})

const AdminVoteBallotRef = builder.objectRef<{
  id: string
  voteId: string
  voterId: string
  inFavor: boolean
  createdAt: Date
}>('AdminVoteBallot')

builder.objectType(AdminVoteBallotRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    voteId: t.exposeString('voteId'),
    voterId: t.exposeString('voterId'),
    inFavor: t.exposeBoolean('inFavor'),
    createdAt: t.string({ resolve: (b) => b.createdAt.toISOString() }),
  }),
})

const AdminVoteRef = builder.objectRef<{
  id: string
  nestId: string
  nomineeId: string
  initiatedBy: string
  status: string
  createdAt: Date
  closedAt: Date | null
}>('AdminVote')

builder.objectType(AdminVoteRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    nestId: t.exposeString('nestId'),
    nomineeId: t.exposeString('nomineeId'),
    initiatedBy: t.exposeString('initiatedBy'),
    status: t.exposeString('status'),
    createdAt: t.string({ resolve: (v) => v.createdAt.toISOString() }),
    closedAt: t.string({
      nullable: true,
      resolve: (v) => v.closedAt?.toISOString() ?? null,
    }),
    ballots: t.field({
      type: [AdminVoteBallotRef],
      resolve: async (vote) => {
        return prisma.adminVoteBallot.findMany({ where: { voteId: vote.id } })
      },
    }),
    nominee: t.field({
      type: User,
      nullable: true,
      resolve: async (vote) => {
        return prisma.user.findUnique({ where: { id: vote.nomineeId } })
      },
    }),
  }),
})

const NestJoinRequestRef = builder.objectRef<{
  id: string
  nestId: string
  userId: string
  status: string
  message: string | null
  createdAt: Date
  reviewedAt: Date | null
  reviewedById: string | null
}>('NestJoinRequest')

builder.objectType(NestJoinRequestRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    nestId: t.exposeString('nestId'),
    userId: t.exposeString('userId'),
    status: t.exposeString('status'),
    message: t.exposeString('message', { nullable: true }),
    createdAt: t.string({ resolve: (r) => r.createdAt.toISOString() }),
    reviewedAt: t.string({
      nullable: true,
      resolve: (r) => r.reviewedAt?.toISOString() ?? null,
    }),
    user: t.field({
      type: User,
      resolve: async (request) => {
        const user = await prisma.user.findUnique({ where: { id: request.userId } })
        if (!user) throw new Error('User not found')
        return user
      },
    }),
    nest: t.field({
      type: NestRef,
      resolve: async (request) => {
        const nest = await prisma.nest.findUnique({ where: { id: request.nestId } })
        if (!nest) throw new Error('Nest not found')
        return nest
      },
    }),
  }),
})

const NestRef = builder.objectRef<{
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  visibility: string
  city: string | null
  state: string | null
  zipcode: string | null
  maxMembers: number
  adminIdleThresholdDays: number
  createdAt: Date
  updatedAt: Date
}>('Nest')

builder.objectType(NestRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
    visibility: t.exposeString('visibility'),
    city: t.exposeString('city', { nullable: true }),
    state: t.exposeString('state', { nullable: true }),
    zipcode: t.exposeString('zipcode', { nullable: true }),
    maxMembers: t.exposeInt('maxMembers'),
    adminIdleThresholdDays: t.exposeInt('adminIdleThresholdDays'),
    createdAt: t.string({ resolve: (n) => n.createdAt.toISOString() }),
    updatedAt: t.string({ resolve: (n) => n.updatedAt.toISOString() }),
    members: t.field({
      type: [NestMembershipRef],
      resolve: async (nest) => {
        return prisma.nestMembership.findMany({ where: { nestId: nest.id } })
      },
    }),
    memberCount: t.int({
      resolve: async (nest) => {
        return prisma.nestMembership.count({ where: { nestId: nest.id } })
      },
    }),
    invites: t.field({
      type: [NestInviteRef],
      resolve: async (nest) => {
        return prisma.nestInvite.findMany({
          where: { nestId: nest.id, status: 'PENDING' },
        })
      },
    }),
    activeVote: t.field({
      type: AdminVoteRef,
      nullable: true,
      resolve: async (nest) => {
        return prisma.adminVote.findFirst({
          where: { nestId: nest.id, status: 'OPEN' },
        })
      },
    }),
    pendingJoinRequests: t.field({
      type: [NestJoinRequestRef],
      resolve: async (nest) => {
        return prisma.nestJoinRequest.findMany({
          where: { nestId: nest.id, status: 'PENDING' },
        })
      },
    }),
  }),
})

// --- Helper: resolve current user from context ---

async function resolveUser(supabaseId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId } })
  if (!user) throw new Error('User not found')
  return user
}

async function requireNestAdmin(userId: string, nestId: string) {
  const membership = await prisma.nestMembership.findUnique({
    where: { nestId_userId: { nestId, userId } },
  })
  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Only nest admins can perform this action')
  }
  return membership
}

async function requireNestMember(userId: string, nestId: string) {
  const membership = await prisma.nestMembership.findUnique({
    where: { nestId_userId: { nestId, userId } },
  })
  if (!membership) {
    throw new Error('You are not a member of this nest')
  }
  return membership
}

// --- Queries ---

builder.queryField('myNests', (t) =>
  t.field({
    type: [NestMembershipRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.nestMembership.findMany({
        where: { userId: user.id },
      })
    },
  }),
)

builder.queryField('nest', (t) =>
  t.field({
    type: NestRef,
    nullable: true,
    authScopes: { authenticated: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      // Any authenticated user can view a nest by ID
      // Field-level access (members vs activity feeds) is handled on the frontend
      return prisma.nest.findUnique({ where: { id: args.id } })
    },
  }),
)

builder.queryField('searchNests', (t) =>
  t.field({
    type: [NestRef],
    authScopes: { authenticated: true },
    args: {
      name: t.arg.string(),
      city: t.arg.string(),
      state: t.arg.string(),
      zipcode: t.arg.string(),
    },
    resolve: async (_root, args) => {
      const where: Record<string, unknown> = {
        visibility: 'PUBLIC',
      }

      if (args.name) {
        where.name = { contains: args.name, mode: 'insensitive' }
      }
      if (args.city) {
        where.city = { contains: args.city, mode: 'insensitive' }
      }
      if (args.state) {
        where.state = { contains: args.state, mode: 'insensitive' }
      }
      if (args.zipcode) {
        where.zipcode = args.zipcode
      }

      return prisma.nest.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 50,
      })
    },
  }),
)

builder.queryField('myNestInvites', (t) =>
  t.field({
    type: [NestInviteRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.nestInvite.findMany({
        where: {
          OR: [
            { inviteeId: user.id, status: 'PENDING' },
            { inviteeEmail: user.email, status: 'PENDING' },
          ],
        },
      })
    },
  }),
)

// --- Mutations: Nest CRUD ---

const CreateNestInput = builder.inputType('CreateNestInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string(),
    avatarUrl: t.string(),
    visibility: t.string(),
    city: t.string(),
    state: t.string(),
    zipcode: t.string(),
  }),
})

builder.mutationField('createNest', (t) =>
  t.field({
    type: NestRef,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateNestInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Check name uniqueness (Prisma will enforce too, but give a nicer error)
      const existing = await prisma.nest.findUnique({ where: { name: args.input.name } })
      if (existing) {
        throw new Error('A nest with this name already exists. Please choose a unique name.')
      }

      const nest = await prisma.nest.create({
        data: {
          name: args.input.name,
          description: args.input.description ?? undefined,
          avatarUrl: args.input.avatarUrl ?? undefined,
          visibility: (args.input.visibility as 'PUBLIC' | 'PRIVATE') ?? 'PUBLIC',
          city: args.input.city ?? undefined,
          state: args.input.state ?? undefined,
          zipcode: args.input.zipcode ?? undefined,
          memberships: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
      })

      return nest
    },
  }),
)

const UpdateNestInput = builder.inputType('UpdateNestInput', {
  fields: (t) => ({
    name: t.string(),
    description: t.string(),
    avatarUrl: t.string(),
    visibility: t.string(),
    city: t.string(),
    state: t.string(),
    zipcode: t.string(),
    maxMembers: t.int(),
    adminIdleThresholdDays: t.int(),
  }),
})

builder.mutationField('updateNest', (t) =>
  t.field({
    type: NestRef,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateNestInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      await requireNestAdmin(user.id, args.nestId)

      // If changing name, check uniqueness
      if (args.input.name) {
        const existing = await prisma.nest.findUnique({ where: { name: args.input.name } })
        if (existing && existing.id !== args.nestId) {
          throw new Error('A nest with this name already exists. Please choose a unique name.')
        }
      }

      return prisma.nest.update({
        where: { id: args.nestId },
        data: {
          ...(args.input.name && { name: args.input.name }),
          ...(args.input.description !== undefined && { description: args.input.description }),
          ...(args.input.avatarUrl !== undefined && { avatarUrl: args.input.avatarUrl }),
          ...(args.input.visibility && {
            visibility: args.input.visibility as 'PUBLIC' | 'PRIVATE',
          }),
          ...(args.input.city !== undefined && { city: args.input.city }),
          ...(args.input.state !== undefined && { state: args.input.state }),
          ...(args.input.zipcode !== undefined && { zipcode: args.input.zipcode }),
          ...(args.input.maxMembers != null && { maxMembers: args.input.maxMembers }),
          ...(args.input.adminIdleThresholdDays != null && {
            adminIdleThresholdDays: args.input.adminIdleThresholdDays,
          }),
        },
      })
    },
  }),
)

// --- Mutations: Nest Invites ---

builder.mutationField('inviteToNest', (t) =>
  t.field({
    type: NestInviteRef,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      await requireNestMember(user.id, args.nestId)

      // Check nest capacity
      const nest = await prisma.nest.findUnique({ where: { id: args.nestId } })
      if (!nest) throw new Error('Nest not found')

      const memberCount = await prisma.nestMembership.count({
        where: { nestId: args.nestId },
      })
      if (memberCount >= nest.maxMembers) {
        throw new Error('Nest has reached maximum capacity')
      }

      // Check for existing pending invite
      const existing = await prisma.nestInvite.findFirst({
        where: {
          nestId: args.nestId,
          inviteeEmail: args.email,
          status: 'PENDING',
        },
      })
      if (existing) throw new Error('Invite already sent to this email')

      // Check if already a member
      const invitee = await prisma.user.findUnique({ where: { email: args.email } })
      if (invitee) {
        const alreadyMember = await prisma.nestMembership.findUnique({
          where: { nestId_userId: { nestId: args.nestId, userId: invitee.id } },
        })
        if (alreadyMember) throw new Error('User is already a member of this nest')
      }

      return prisma.nestInvite.create({
        data: {
          nestId: args.nestId,
          inviterId: user.id,
          inviteeId: invitee?.id,
          inviteeEmail: args.email,
        },
      })
    },
  }),
)

builder.mutationField('respondToNestInvite', (t) =>
  t.field({
    type: NestInviteRef,
    authScopes: { authenticated: true },
    args: {
      inviteId: t.arg.string({ required: true }),
      accept: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const invite = await prisma.nestInvite.findUnique({
        where: { id: args.inviteId },
      })
      if (!invite) throw new Error('Invite not found')
      if (invite.status !== 'PENDING') throw new Error('Invite is no longer pending')

      // Verify invite is for current user
      if (invite.inviteeId !== user.id && invite.inviteeEmail !== user.email) {
        throw new Error('This invite is not for you')
      }

      const newStatus = args.accept ? 'ACCEPTED' : 'DECLINED'

      if (args.accept) {
        // Check nest capacity before accepting
        const nest = await prisma.nest.findUnique({ where: { id: invite.nestId } })
        if (!nest) throw new Error('Nest not found')

        const memberCount = await prisma.nestMembership.count({
          where: { nestId: invite.nestId },
        })
        if (memberCount >= nest.maxMembers) {
          throw new Error('Nest has reached maximum capacity')
        }

        await prisma.nestMembership.create({
          data: {
            nestId: invite.nestId,
            userId: user.id,
            role: 'MEMBER',
          },
        })
      }

      return prisma.nestInvite.update({
        where: { id: invite.id },
        data: {
          status: newStatus,
          inviteeId: user.id,
          respondedAt: new Date(),
        },
      })
    },
  }),
)

builder.mutationField('cancelNestInvite', (t) =>
  t.field({
    type: NestInviteRef,
    authScopes: { authenticated: true },
    args: {
      inviteId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const invite = await prisma.nestInvite.findUnique({
        where: { id: args.inviteId },
      })
      if (!invite) throw new Error('Invite not found')
      if (invite.status !== 'PENDING') throw new Error('Invite is no longer pending')
      if (invite.inviterId !== user.id) throw new Error('Only the inviter can cancel')

      return prisma.nestInvite.update({
        where: { id: invite.id },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      })
    },
  }),
)

// --- Mutations: Membership Management ---

builder.mutationField('leaveNest', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      const membership = await requireNestMember(user.id, args.nestId)

      if (membership.role === 'ADMIN') {
        const otherMembers = await prisma.nestMembership.count({
          where: { nestId: args.nestId, userId: { not: user.id } },
        })

        // If they're the only member, delete the nest entirely
        if (otherMembers === 0) {
          await prisma.nest.delete({ where: { id: args.nestId } })
          return true
        }

        // If there are other members, ensure at least one other admin exists
        const otherAdmins = await prisma.nestMembership.count({
          where: { nestId: args.nestId, userId: { not: user.id }, role: 'ADMIN' },
        })
        if (otherAdmins === 0) {
          throw new Error(
            'You are the only admin. Transfer admin role to another member before leaving.',
          )
        }
      }

      await prisma.nestMembership.delete({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
      })
      return true
    },
  }),
)

builder.mutationField('removeMember', (t) =>
  t.field({
    type: 'Boolean',
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const admin = await resolveUser(ctx.currentUser!.id)
      await requireNestAdmin(admin.id, args.nestId)

      // Can't remove yourself (use leaveNest)
      if (args.userId === admin.id) {
        throw new Error('Use leaveNest to leave. Admins must transfer role first.')
      }

      // Can't remove another admin
      const targetMembership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: args.userId } },
      })
      if (!targetMembership) throw new Error('User is not a member of this nest')
      if (targetMembership.role === 'ADMIN') {
        throw new Error('Cannot remove another admin')
      }

      await prisma.nestMembership.delete({
        where: { nestId_userId: { nestId: args.nestId, userId: args.userId } },
      })
      return true
    },
  }),
)

// --- Mutations: Admin Succession ---

builder.mutationField('nominateAdmin', (t) =>
  t.field({
    type: AdminVoteRef,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      nomineeId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      await requireNestMember(user.id, args.nestId)

      // Nominee must be a member
      const nomineeMembership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: args.nomineeId } },
      })
      if (!nomineeMembership) {
        throw new Error('Nominee must be a member of this nest')
      }
      if (nomineeMembership.role === 'ADMIN') {
        throw new Error('Nominee is already an admin')
      }

      // Check no open vote already exists
      const existingVote = await prisma.adminVote.findFirst({
        where: { nestId: args.nestId, status: 'OPEN' },
      })
      if (existingVote) {
        throw new Error('An admin succession vote is already in progress')
      }

      return prisma.adminVote.create({
        data: {
          nestId: args.nestId,
          nomineeId: args.nomineeId,
          initiatedBy: user.id,
        },
      })
    },
  }),
)

builder.mutationField('castAdminVote', (t) =>
  t.field({
    type: AdminVoteRef,
    authScopes: { authenticated: true },
    args: {
      voteId: t.arg.string({ required: true }),
      inFavor: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const vote = await prisma.adminVote.findUnique({ where: { id: args.voteId } })
      if (!vote) throw new Error('Vote not found')
      if (vote.status !== 'OPEN') throw new Error('Vote is no longer open')

      // Voter must be a member
      await requireNestMember(user.id, vote.nestId)

      // Check if already voted
      const existingBallot = await prisma.adminVoteBallot.findUnique({
        where: { voteId_voterId: { voteId: vote.id, voterId: user.id } },
      })
      if (existingBallot) throw new Error('You have already voted')

      // Cast ballot
      await prisma.adminVoteBallot.create({
        data: {
          voteId: vote.id,
          voterId: user.id,
          inFavor: args.inFavor,
        },
      })

      // Check if vote should be resolved (majority of members have voted)
      const totalMembers = await prisma.nestMembership.count({
        where: { nestId: vote.nestId },
      })
      const totalBallots = await prisma.adminVoteBallot.count({
        where: { voteId: vote.id },
      })

      // Resolve when majority has voted
      if (totalBallots >= Math.ceil(totalMembers / 2)) {
        const inFavorCount = await prisma.adminVoteBallot.count({
          where: { voteId: vote.id, inFavor: true },
        })
        const passed = inFavorCount > totalBallots / 2

        if (passed) {
          // Transfer admin role
          await prisma.nestMembership.updateMany({
            where: { nestId: vote.nestId, role: 'ADMIN' },
            data: { role: 'MEMBER' },
          })
          await prisma.nestMembership.update({
            where: { nestId_userId: { nestId: vote.nestId, userId: vote.nomineeId } },
            data: { role: 'ADMIN' },
          })
        }

        return prisma.adminVote.update({
          where: { id: vote.id },
          data: {
            status: passed ? 'PASSED' : 'FAILED',
            closedAt: new Date(),
          },
        })
      }

      return vote
    },
  }),
)

builder.mutationField('cancelAdminVote', (t) =>
  t.field({
    type: AdminVoteRef,
    authScopes: { authenticated: true },
    args: {
      voteId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      const vote = await prisma.adminVote.findUnique({ where: { id: args.voteId } })
      if (!vote) throw new Error('Vote not found')
      if (vote.status !== 'OPEN') throw new Error('Vote is no longer open')

      // Only admin or initiator can cancel
      const membership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: vote.nestId, userId: user.id } },
      })
      if (!membership) throw new Error('You are not a member of this nest')

      if (vote.initiatedBy !== user.id && membership.role !== 'ADMIN') {
        throw new Error('Only the initiator or a nest admin can cancel a vote')
      }

      return prisma.adminVote.update({
        where: { id: vote.id },
        data: { status: 'CANCELLED', closedAt: new Date() },
      })
    },
  }),
)

// --- Mutation: Direct admin transfer (admin-only) ---

builder.mutationField('transferAdmin', (t) =>
  t.field({
    type: NestMembershipRef,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      newAdminId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      await requireNestAdmin(user.id, args.nestId)

      // New admin must be a member
      const targetMembership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: args.newAdminId } },
      })
      if (!targetMembership) throw new Error('Target user is not a member of this nest')

      // Demote current admin, promote new one
      await prisma.nestMembership.update({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
        data: { role: 'MEMBER' },
      })

      return prisma.nestMembership.update({
        where: { nestId_userId: { nestId: args.nestId, userId: args.newAdminId } },
        data: { role: 'ADMIN' },
      })
    },
  }),
)

// --- Mutations: Join Requests ---

builder.mutationField('requestToJoinNest', (t) =>
  t.field({
    type: NestJoinRequestRef,
    authScopes: { authenticated: true },
    args: {
      nestId: t.arg.string({ required: true }),
      message: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)

      // Nest must exist and be public
      const nest = await prisma.nest.findUnique({ where: { id: args.nestId } })
      if (!nest) throw new Error('Nest not found')
      if (nest.visibility !== 'PUBLIC') {
        throw new Error('This nest is not accepting join requests')
      }

      // Check if already a member
      const existing = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
      })
      if (existing) throw new Error('You are already a member of this nest')

      // Check for existing pending request
      const pendingRequest = await prisma.nestJoinRequest.findUnique({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
      })
      if (pendingRequest && pendingRequest.status === 'PENDING') {
        throw new Error('You already have a pending join request for this nest')
      }

      // Check nest capacity
      const memberCount = await prisma.nestMembership.count({
        where: { nestId: args.nestId },
      })
      if (memberCount >= nest.maxMembers) {
        throw new Error('Nest has reached maximum capacity')
      }

      // Upsert (in case they were previously denied and are re-requesting)
      return prisma.nestJoinRequest.upsert({
        where: { nestId_userId: { nestId: args.nestId, userId: user.id } },
        create: {
          nestId: args.nestId,
          userId: user.id,
          message: args.message ?? undefined,
        },
        update: {
          status: 'PENDING',
          message: args.message ?? undefined,
          reviewedAt: null,
          reviewedById: null,
        },
      })
    },
  }),
)

builder.mutationField('approveJoinRequest', (t) =>
  t.field({
    type: NestJoinRequestRef,
    authScopes: { authenticated: true },
    args: {
      requestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const admin = await resolveUser(ctx.currentUser!.id)

      const request = await prisma.nestJoinRequest.findUnique({
        where: { id: args.requestId },
      })
      if (!request) throw new Error('Join request not found')
      if (request.status !== 'PENDING') throw new Error('Request is no longer pending')

      // Must be an admin of the nest
      await requireNestAdmin(admin.id, request.nestId)

      // Check capacity
      const nest = await prisma.nest.findUnique({ where: { id: request.nestId } })
      if (!nest) throw new Error('Nest not found')
      const memberCount = await prisma.nestMembership.count({
        where: { nestId: request.nestId },
      })
      if (memberCount >= nest.maxMembers) {
        throw new Error('Nest has reached maximum capacity')
      }

      // Add user as member
      await prisma.nestMembership.create({
        data: {
          nestId: request.nestId,
          userId: request.userId,
          role: 'MEMBER',
        },
      })

      return prisma.nestJoinRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      })
    },
  }),
)

builder.mutationField('denyJoinRequest', (t) =>
  t.field({
    type: NestJoinRequestRef,
    authScopes: { authenticated: true },
    args: {
      requestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const admin = await resolveUser(ctx.currentUser!.id)

      const request = await prisma.nestJoinRequest.findUnique({
        where: { id: args.requestId },
      })
      if (!request) throw new Error('Join request not found')
      if (request.status !== 'PENDING') throw new Error('Request is no longer pending')

      // Must be an admin of the nest
      await requireNestAdmin(admin.id, request.nestId)

      return prisma.nestJoinRequest.update({
        where: { id: request.id },
        data: {
          status: 'DENIED',
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      })
    },
  }),
)

builder.queryField('myJoinRequests', (t) =>
  t.field({
    type: [NestJoinRequestRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      return prisma.nestJoinRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
)

export { NestRef, NestMembershipRef, NestInviteRef, AdminVoteRef, NestJoinRequestRef }

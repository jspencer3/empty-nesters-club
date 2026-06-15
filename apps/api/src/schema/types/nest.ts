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

const NestRef = builder.objectRef<{
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
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
    type: [NestRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      const memberships = await prisma.nestMembership.findMany({
        where: { userId: user.id },
        include: { nest: true },
      })
      return memberships.map((m) => m.nest)
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
    resolve: async (_root, args, ctx) => {
      const user = await resolveUser(ctx.currentUser!.id)
      // Only visible to members
      const membership = await prisma.nestMembership.findUnique({
        where: { nestId_userId: { nestId: args.id, userId: user.id } },
      })
      if (!membership) return null

      return prisma.nest.findUnique({ where: { id: args.id } })
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

      const nest = await prisma.nest.create({
        data: {
          name: args.input.name,
          description: args.input.description ?? undefined,
          avatarUrl: args.input.avatarUrl ?? undefined,
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

      return prisma.nest.update({
        where: { id: args.nestId },
        data: {
          ...(args.input.name && { name: args.input.name }),
          ...(args.input.description !== undefined && { description: args.input.description }),
          ...(args.input.avatarUrl !== undefined && { avatarUrl: args.input.avatarUrl }),
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

      // Admins can't leave without transferring first
      if (membership.role === 'ADMIN') {
        const otherMembers = await prisma.nestMembership.count({
          where: { nestId: args.nestId, userId: { not: user.id } },
        })
        if (otherMembers > 0) {
          throw new Error(
            'Admins must transfer admin role before leaving. Use nominateAdmin to start succession.',
          )
        }
        // If they're the only member, just delete the nest
        await prisma.nest.delete({ where: { id: args.nestId } })
        return true
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

export { NestRef, NestMembershipRef, NestInviteRef, AdminVoteRef }

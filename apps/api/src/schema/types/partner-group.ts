import { builder } from '../builder.js'
import { prisma } from '@enc/db'
import { User } from './user.js'

// Registered for schema introspection; used in invite status fields
builder.enumType('InviteStatus', {
  values: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'] as const,
})

const PartnerGroupMemberRef = builder.objectRef<{
  id: string
  userId: string
  partnerGroupId: string
  role: string
  joinedAt: Date
}>('PartnerGroupMember')

builder.objectType(PartnerGroupMemberRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId'),
    role: t.exposeString('role'),
    joinedAt: t.field({ type: 'String', resolve: (m) => m.joinedAt.toISOString() }),
    user: t.field({
      type: User,
      nullable: true,
      resolve: async (member) => {
        return prisma.user.findUnique({ where: { id: member.userId } })
      },
    }),
  }),
})

const PartnerGroupInviteRef = builder.objectRef<{
  id: string
  partnerGroupId: string
  inviterId: string
  inviteeId: string | null
  inviteeEmail: string
  status: string
  createdAt: Date
  respondedAt: Date | null
}>('PartnerGroupInvite')

builder.objectType(PartnerGroupInviteRef, {
  fields: (t) => ({
    id: t.exposeID('id'),
    partnerGroupId: t.exposeString('partnerGroupId'),
    inviterId: t.exposeString('inviterId'),
    inviteeEmail: t.exposeString('inviteeEmail'),
    status: t.exposeString('status'),
    createdAt: t.field({ type: 'String', resolve: (i) => i.createdAt.toISOString() }),
    partnerGroup: t.field({
      type: PartnerGroup,
      resolve: async (invite) => {
        const group = await prisma.partnerGroup.findUnique({
          where: { id: invite.partnerGroupId },
        })
        if (!group) throw new Error('Partner group not found')
        return group
      },
    }),
    inviter: t.field({
      type: User,
      resolve: async (invite) => {
        const user = await prisma.user.findUnique({
          where: { id: invite.inviterId },
        })
        if (!user) throw new Error('Inviter not found')
        return user
      },
    }),
  }),
})

const PartnerGroup = builder.objectRef<{
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}>('PartnerGroup')

builder.objectType(PartnerGroup, {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.field({ type: 'String', resolve: (g) => g.createdAt.toISOString() }),
    members: t.field({
      type: [PartnerGroupMemberRef],
      resolve: async (group) => {
        return prisma.partnerGroupMember.findMany({
          where: { partnerGroupId: group.id },
        })
      },
    }),
    invites: t.field({
      type: [PartnerGroupInviteRef],
      resolve: async (group) => {
        return prisma.partnerGroupInvite.findMany({
          where: { partnerGroupId: group.id },
        })
      },
    }),
  }),
})

// Query: get current user's partner groups
builder.queryField('myPartnerGroups', (t) =>
  t.field({
    type: [PartnerGroup],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) return []

      const memberships = await prisma.partnerGroupMember.findMany({
        where: { userId: user.id },
        include: { partnerGroup: true },
      })
      return memberships.map((m) => m.partnerGroup)
    },
  }),
)

// Query: get pending invites for current user
builder.queryField('myPendingInvites', (t) =>
  t.field({
    type: [PartnerGroupInviteRef],
    authScopes: { authenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) return []

      return prisma.partnerGroupInvite.findMany({
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

// Mutation: create partner group
builder.mutationField('createPartnerGroup', (t) =>
  t.field({
    type: PartnerGroup,
    authScopes: { authenticated: true },
    args: {
      name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) throw new Error('User not found')

      const group = await prisma.partnerGroup.create({
        data: {
          name: args.name,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      })

      return group
    },
  }),
)

// Mutation: invite partner
builder.mutationField('invitePartner', (t) =>
  t.field({
    type: PartnerGroupInviteRef,
    authScopes: { authenticated: true },
    args: {
      partnerGroupId: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) throw new Error('User not found')

      // Verify user is owner of the group
      const membership = await prisma.partnerGroupMember.findUnique({
        where: {
          userId_partnerGroupId: {
            userId: user.id,
            partnerGroupId: args.partnerGroupId,
          },
        },
      })
      if (!membership || membership.role !== 'OWNER') {
        throw new Error('Only group owners can invite members')
      }

      // Check for existing pending invite
      const existingInvite = await prisma.partnerGroupInvite.findFirst({
        where: {
          partnerGroupId: args.partnerGroupId,
          inviteeEmail: args.email,
          status: 'PENDING',
        },
      })
      if (existingInvite) {
        throw new Error('Invite already sent to this email')
      }

      // Look up invitee by email (may not exist yet)
      const invitee = await prisma.user.findUnique({
        where: { email: args.email },
      })

      return prisma.partnerGroupInvite.create({
        data: {
          partnerGroupId: args.partnerGroupId,
          inviterId: user.id,
          inviteeId: invitee?.id,
          inviteeEmail: args.email,
        },
      })
    },
  }),
)

// Mutation: respond to invite
builder.mutationField('respondToInvite', (t) =>
  t.field({
    type: PartnerGroupInviteRef,
    authScopes: { authenticated: true },
    args: {
      inviteId: t.arg.string({ required: true }),
      accept: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) throw new Error('User not found')

      const invite = await prisma.partnerGroupInvite.findUnique({
        where: { id: args.inviteId },
      })
      if (!invite) throw new Error('Invite not found')
      if (invite.status !== 'PENDING') throw new Error('Invite is no longer pending')

      // Verify this invite belongs to the current user
      if (invite.inviteeId !== user.id && invite.inviteeEmail !== user.email) {
        throw new Error('This invite is not for you')
      }

      const newStatus = args.accept ? 'ACCEPTED' : 'DECLINED'

      // If accepting, add to group
      if (args.accept) {
        await prisma.partnerGroupMember.create({
          data: {
            userId: user.id,
            partnerGroupId: invite.partnerGroupId,
            role: 'MEMBER',
          },
        })
      }

      return prisma.partnerGroupInvite.update({
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

// Mutation: cancel invite (by owner)
builder.mutationField('cancelInvite', (t) =>
  t.field({
    type: PartnerGroupInviteRef,
    authScopes: { authenticated: true },
    args: {
      inviteId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: ctx.currentUser!.id },
      })
      if (!user) throw new Error('User not found')

      const invite = await prisma.partnerGroupInvite.findUnique({
        where: { id: args.inviteId },
      })
      if (!invite) throw new Error('Invite not found')
      if (invite.status !== 'PENDING') throw new Error('Invite is no longer pending')
      if (invite.inviterId !== user.id) throw new Error('Only the inviter can cancel')

      return prisma.partnerGroupInvite.update({
        where: { id: invite.id },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date(),
        },
      })
    },
  }),
)

export { PartnerGroup, PartnerGroupInviteRef }

import { useState } from 'react'
import { useQuery, useMutation, gql } from 'urql'

const MY_PARTNER_GROUPS = gql`
  query MyPartnerGroups {
    myPartnerGroups {
      id
      name
      createdAt
      members {
        id
        role
        user {
          id
          displayName
          email
          avatarUrl
        }
      }
    }
  }
`

const MY_PENDING_INVITES = gql`
  query MyPendingInvites {
    myPendingInvites {
      id
      partnerGroup {
        id
        name
      }
      inviter {
        id
        displayName
        email
      }
      createdAt
    }
  }
`

const CREATE_PARTNER_GROUP = gql`
  mutation CreatePartnerGroup($name: String!) {
    createPartnerGroup(name: $name) {
      id
      name
    }
  }
`

const INVITE_PARTNER = gql`
  mutation InvitePartner($partnerGroupId: String!, $email: String!) {
    invitePartner(partnerGroupId: $partnerGroupId, email: $email) {
      id
      status
    }
  }
`

const RESPOND_TO_INVITE = gql`
  mutation RespondToInvite($inviteId: String!, $accept: Boolean!) {
    respondToInvite(inviteId: $inviteId, accept: $accept) {
      id
      status
    }
  }
`

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '2rem',
  },
  sectionHeading: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#2d6a4f',
  },
  section: {
    marginBottom: '2.5rem',
  },
  card: {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    marginBottom: '1rem',
  },
  inviteCard: {
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    background: '#e8f5e9',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
  },
  inviteMeta: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  inviteActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  acceptBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  declineBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    border: '1px solid #c0392b',
    background: '#fff',
    color: '#c0392b',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
  },
  cardMeta: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0 0 0.75rem',
  },
  memberList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  memberChip: {
    padding: '0.25rem 0.75rem',
    borderRadius: '16px',
    background: '#e8f5e9',
    fontSize: '0.8rem',
    color: '#2d6a4f',
    fontWeight: 500,
  },
  inlineForm: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    flex: 1,
    minWidth: '180px',
  },
  primaryBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '0.95rem',
  },
  error: {
    padding: '1rem',
    borderRadius: '6px',
    background: '#fdecea',
    color: '#c0392b',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '0.95rem',
  },
}

export function PartnerGroups() {
  const [groupsResult, reexecuteGroups] = useQuery({ query: MY_PARTNER_GROUPS })
  const [invitesResult, reexecuteInvites] = useQuery({ query: MY_PENDING_INVITES })

  const [, createGroup] = useMutation(CREATE_PARTNER_GROUP)
  const [, invitePartner] = useMutation(INVITE_PARTNER)
  const [, respondToInvite] = useMutation(RESPOND_TO_INVITE)

  const [newGroupName, setNewGroupName] = useState('')
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({})

  const refetchAll = () => {
    reexecuteGroups({ requestPolicy: 'network-only' })
    reexecuteInvites({ requestPolicy: 'network-only' })
  }

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name) return
    await createGroup({ name })
    setNewGroupName('')
    refetchAll()
  }

  const handleInvite = async (partnerGroupId: string) => {
    const email = (inviteEmails[partnerGroupId] || '').trim()
    if (!email) return
    await invitePartner({ partnerGroupId, email })
    setInviteEmails((prev) => ({ ...prev, [partnerGroupId]: '' }))
    refetchAll()
  }

  const handleRespondToInvite = async (inviteId: string, accept: boolean) => {
    await respondToInvite({ inviteId, accept })
    refetchAll()
  }

  if (groupsResult.fetching && invitesResult.fetching) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading partner groups...</p>
      </div>
    )
  }

  if (groupsResult.error || invitesResult.error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Partner Groups</h1>
        <div style={styles.error}>
          {groupsResult.error?.message || invitesResult.error?.message || 'An error occurred.'}
        </div>
      </div>
    )
  }

  const groups = groupsResult.data?.myPartnerGroups ?? []
  const invites = invitesResult.data?.myPendingInvites ?? []

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Partner Groups</h1>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>Pending Invites</h2>
          {invites.map((invite: any) => (
            <div key={invite.id} style={styles.inviteCard}>
              <div style={styles.inviteInfo}>
                <p style={styles.inviteTitle}>{invite.partnerGroup.name}</p>
                <p style={styles.inviteMeta}>
                  Invited by {invite.inviter.displayName || invite.inviter.email}
                </p>
              </div>
              <div style={styles.inviteActions}>
                <button
                  style={styles.acceptBtn}
                  onClick={() => handleRespondToInvite(invite.id, true)}
                >
                  Accept
                </button>
                <button
                  style={styles.declineBtn}
                  onClick={() => handleRespondToInvite(invite.id, false)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Groups List */}
      <div style={styles.section}>
        <h2 style={styles.sectionHeading}>My Groups</h2>
        {groups.length === 0 ? (
          <p style={styles.emptyState}>
            You don't belong to any partner groups yet. Create one below!
          </p>
        ) : (
          groups.map((group: any) => (
            <div key={group.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{group.name}</h3>
              <p style={styles.cardMeta}>
                Created {new Date(group.createdAt).toLocaleDateString()}
              </p>
              <div style={styles.memberList}>
                {group.members.map((member: any) => (
                  <span key={member.id} style={styles.memberChip}>
                    {member.user.displayName || member.user.email}
                    {member.role === 'OWNER' ? ' (owner)' : ''}
                  </span>
                ))}
              </div>
              <div style={styles.inlineForm}>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Partner's email"
                  value={inviteEmails[group.id] || ''}
                  onChange={(e) =>
                    setInviteEmails((prev) => ({ ...prev, [group.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite(group.id)
                  }}
                />
                <button style={styles.primaryBtn} onClick={() => handleInvite(group.id)}>
                  Invite Partner
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Partner Group */}
      <div style={styles.section}>
        <h2 style={styles.sectionHeading}>Create Partner Group</h2>
        <div style={styles.inlineForm}>
          <input
            style={styles.input}
            type="text"
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateGroup()
            }}
          />
          <button style={styles.primaryBtn} onClick={handleCreateGroup}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}

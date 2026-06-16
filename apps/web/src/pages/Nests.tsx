import { useState } from 'react'
import { useQuery, useMutation, gql } from 'urql'
import { Link } from 'react-router'

const MY_NESTS_QUERY = gql`
  query MyNests {
    myNests {
      id
      nest {
        id
        name
        description
        avatarUrl
        visibility
        city
        state
        zipcode
        maxMembers
        memberCount
        members {
          id
          role
          user {
            id
            displayName
            avatarUrl
          }
        }
        pendingJoinRequests {
          id
          message
          createdAt
          user {
            id
            displayName
            email
          }
        }
      }
      role
      joinedAt
    }
  }
`

const MY_NEST_INVITES_QUERY = gql`
  query MyNestInvites {
    myNestInvites {
      id
      nest {
        id
        name
      }
      inviter {
        id
        displayName
      }
      createdAt
    }
  }
`

const CREATE_NEST_MUTATION = gql`
  mutation CreateNest($input: CreateNestInput!) {
    createNest(input: $input) {
      id
      name
      description
      visibility
      city
      state
      zipcode
    }
  }
`

const INVITE_TO_NEST_MUTATION = gql`
  mutation InviteToNest($nestId: String!, $email: String!) {
    inviteToNest(nestId: $nestId, email: $email) {
      id
      status
    }
  }
`

const UPDATE_NEST_MUTATION = gql`
  mutation UpdateNest($nestId: String!, $input: UpdateNestInput!) {
    updateNest(nestId: $nestId, input: $input) {
      id
      name
      description
      visibility
      city
      state
      zipcode
    }
  }
`

const RESPOND_TO_NEST_INVITE_MUTATION = gql`
  mutation RespondToNestInvite($inviteId: String!, $accept: Boolean!) {
    respondToNestInvite(inviteId: $inviteId, accept: $accept) {
      id
      status
    }
  }
`

const LEAVE_NEST_MUTATION = gql`
  mutation LeaveNest($nestId: String!) {
    leaveNest(nestId: $nestId)
  }
`

const APPROVE_JOIN_REQUEST_MUTATION = gql`
  mutation ApproveJoinRequest($requestId: String!) {
    approveJoinRequest(requestId: $requestId) {
      id
      status
    }
  }
`

const DENY_JOIN_REQUEST_MUTATION = gql`
  mutation DenyJoinRequest($requestId: String!) {
    denyJoinRequest(requestId: $requestId) {
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
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#2d6a4f',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#555',
    margin: '0 0 0.75rem',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.85rem',
    color: '#666',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  adminBadge: {
    background: '#2d6a4f',
    color: '#fff',
  },
  memberBadge: {
    background: '#e8f5e9',
    color: '#2d6a4f',
  },
  memberAvatars: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    marginTop: '0.75rem',
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#2d6a4f',
    border: '1px solid #c8e6c9',
  },
  inviteCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #c8e6c9',
    background: '#e8f5e9',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  button: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  primaryButton: {
    background: '#2d6a4f',
    color: '#fff',
  },
  dangerButton: {
    background: '#d32f2f',
    color: '#fff',
  },
  secondaryButton: {
    background: '#e0e0e0',
    color: '#333',
  },
  form: {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    marginBottom: '2rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    minWidth: '200px',
  },
  inviteSection: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e0e0e0',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#666',
  },
  error: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#d32f2f',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#999',
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Nests() {
  const [nestsResult, reexecuteNests] = useQuery({ query: MY_NESTS_QUERY })
  const [invitesResult, reexecuteInvites] = useQuery({ query: MY_NEST_INVITES_QUERY })

  const [, createNest] = useMutation(CREATE_NEST_MUTATION)
  const [, inviteToNest] = useMutation(INVITE_TO_NEST_MUTATION)
  const [, updateNest] = useMutation(UPDATE_NEST_MUTATION)
  const [, respondToInvite] = useMutation(RESPOND_TO_NEST_INVITE_MUTATION)
  const [, leaveNest] = useMutation(LEAVE_NEST_MUTATION)
  const [, approveJoinRequest] = useMutation(APPROVE_JOIN_REQUEST_MUTATION)
  const [, denyJoinRequest] = useMutation(DENY_JOIN_REQUEST_MUTATION)

  const [newNestName, setNewNestName] = useState('')
  const [newNestDescription, setNewNestDescription] = useState('')
  const [newNestVisibility, setNewNestVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [newNestCity, setNewNestCity] = useState('')
  const [newNestState, setNewNestState] = useState('')
  const [newNestZipcode, setNewNestZipcode] = useState('')
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({})
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null)
  const [editingNest, setEditingNest] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{
    city: string
    state: string
    zipcode: string
    visibility: string
  }>({ city: '', state: '', zipcode: '', visibility: 'PUBLIC' })

  const refetchAll = () => {
    reexecuteNests({ requestPolicy: 'network-only' })
    reexecuteInvites({ requestPolicy: 'network-only' })
  }

  const handleCreateNest = async () => {
    if (!newNestName.trim()) return
    const input: {
      name: string
      description?: string
      visibility?: string
      city?: string
      state?: string
      zipcode?: string
    } = {
      name: newNestName.trim(),
      visibility: newNestVisibility,
    }
    if (newNestDescription.trim()) input.description = newNestDescription.trim()
    if (newNestCity.trim()) input.city = newNestCity.trim()
    if (newNestState.trim()) input.state = newNestState.trim()
    if (newNestZipcode.trim()) input.zipcode = newNestZipcode.trim()

    await createNest({ input })
    setNewNestName('')
    setNewNestDescription('')
    setNewNestVisibility('PUBLIC')
    setNewNestCity('')
    setNewNestState('')
    setNewNestZipcode('')
    refetchAll()
  }

  const handleRespondToInvite = async (inviteId: string, accept: boolean) => {
    await respondToInvite({ inviteId, accept })
    refetchAll()
  }

  const handleLeaveNest = async (nestId: string) => {
    await leaveNest({ nestId })
    setConfirmLeave(null)
    refetchAll()
  }

  const handleInvite = async (nestId: string) => {
    const email = inviteEmails[nestId]?.trim()
    if (!email) return
    await inviteToNest({ nestId, email })
    setInviteEmails((prev) => ({ ...prev, [nestId]: '' }))
    refetchAll()
  }

  const handleApproveJoinRequest = async (requestId: string) => {
    await approveJoinRequest({ requestId })
    refetchAll()
  }

  const handleDenyJoinRequest = async (requestId: string) => {
    await denyJoinRequest({ requestId })
    refetchAll()
  }

  const handleStartEdit = (nest: any) => {
    setEditingNest(nest.id)
    setEditFields({
      city: nest.city || '',
      state: nest.state || '',
      zipcode: nest.zipcode || '',
      visibility: nest.visibility || 'PUBLIC',
    })
  }

  const handleSaveEdit = async (nestId: string) => {
    await updateNest({
      nestId,
      input: {
        city: editFields.city || null,
        state: editFields.state || null,
        zipcode: editFields.zipcode || null,
        visibility: editFields.visibility,
      },
    })
    setEditingNest(null)
    refetchAll()
  }

  const isLoading = nestsResult.fetching || invitesResult.fetching
  const hasError = nestsResult.error || invitesResult.error

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>My Nests</h1>
        <p style={styles.loading}>Loading...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>My Nests</h1>
        <p style={styles.error}>
          {nestsResult.error?.message || invitesResult.error?.message || 'Failed to load data.'}
        </p>
      </div>
    )
  }

  const nests = nestsResult.data?.myNests ?? []
  const invites = invitesResult.data?.myNestInvites ?? []

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>My Nests</h1>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={styles.sectionTitle}>Pending Invites</h2>
          <div style={styles.list}>
            {invites.map((invite: any) => (
              <div key={invite.id} style={styles.inviteCard}>
                <div style={styles.inviteInfo}>
                  <strong>{invite.nest.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#555', marginLeft: '0.5rem' }}>
                    invited by {invite.inviter.displayName}
                  </span>
                </div>
                <div style={styles.inviteActions}>
                  <button
                    style={{ ...styles.button, ...styles.primaryButton }}
                    onClick={() => handleRespondToInvite(invite.id, true)}
                  >
                    Accept
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.secondaryButton }}
                    onClick={() => handleRespondToInvite(invite.id, false)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Nest Form */}
      <div style={styles.form}>
        <h2 style={{ ...styles.sectionTitle, marginBottom: '0.75rem' }}>Create a Nest</h2>
        <div style={{ ...styles.formRow, marginBottom: '0.75rem' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name *</label>
            <input
              style={styles.input}
              type="text"
              value={newNestName}
              onChange={(e) => setNewNestName(e.target.value)}
              placeholder="Globally unique nest name"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <input
              style={styles.input}
              type="text"
              value={newNestDescription}
              onChange={(e) => setNewNestDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Visibility</label>
            <select
              style={{ ...styles.input, minWidth: '120px' }}
              value={newNestVisibility}
              onChange={(e) => setNewNestVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>
        <div style={{ ...styles.formRow, marginBottom: '0.75rem' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <input
              style={styles.input}
              type="text"
              value={newNestCity}
              onChange={(e) => setNewNestCity(e.target.value)}
              placeholder="City"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>State</label>
            <input
              style={{ ...styles.input, minWidth: '100px' }}
              type="text"
              value={newNestState}
              onChange={(e) => setNewNestState(e.target.value)}
              placeholder="State"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Zip Code</label>
            <input
              style={{ ...styles.input, minWidth: '100px' }}
              type="text"
              value={newNestZipcode}
              onChange={(e) => setNewNestZipcode(e.target.value)}
              placeholder="Zip code"
            />
          </div>
        </div>
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={handleCreateNest}
          disabled={!newNestName.trim()}
        >
          Create Nest
        </button>
      </div>

      {/* Discover Nests Link */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/nests/discover" style={{ color: '#2d6a4f', fontWeight: 500 }}>
          Discover public nests to join
        </Link>
      </div>

      {/* Nests List */}
      {nests.length === 0 ? (
        <p style={styles.empty}>You haven't joined any nests yet.</p>
      ) : (
        <div style={styles.list}>
          {nests.map((membership: any) => {
            const nest = membership.nest
            const isAdmin = membership.role === 'ADMIN'
            const pendingRequests = nest.pendingJoinRequests ?? []
            const location = [nest.city, nest.state, nest.zipcode].filter(Boolean).join(', ')

            return (
              <div key={membership.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    <Link
                      to={`/nests/${nest.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {nest.name}
                    </Link>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        ...styles.roleBadge,
                        ...(isAdmin ? styles.adminBadge : styles.memberBadge),
                      }}
                    >
                      {membership.role}
                    </span>
                    <span
                      style={{
                        ...styles.roleBadge,
                        background: nest.visibility === 'PUBLIC' ? '#e3f2fd' : '#fce4ec',
                        color: nest.visibility === 'PUBLIC' ? '#1565c0' : '#c62828',
                      }}
                    >
                      {nest.visibility}
                    </span>
                    {confirmLeave === nest.id ? (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          style={{ ...styles.button, ...styles.dangerButton, fontSize: '0.75rem' }}
                          onClick={() => handleLeaveNest(nest.id)}
                        >
                          Confirm
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            ...styles.secondaryButton,
                            fontSize: '0.75rem',
                          }}
                          onClick={() => setConfirmLeave(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{ ...styles.button, ...styles.dangerButton }}
                        onClick={() => setConfirmLeave(nest.id)}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>

                {nest.description && <p style={styles.cardDescription}>{nest.description}</p>}
                {location && (
                  <p style={{ ...styles.cardDescription, fontSize: '0.85rem', color: '#777' }}>
                    {location}
                  </p>
                )}

                <div style={styles.cardMeta}>
                  <span>
                    {nest.memberCount}
                    {nest.maxMembers ? ` / ${nest.maxMembers}` : ''} members
                  </span>
                </div>

                {/* Member Avatars */}
                {nest.members && nest.members.length > 0 && (
                  <div style={styles.memberAvatars}>
                    {nest.members.map((member: any) => (
                      <div
                        key={member.id}
                        style={styles.memberAvatar}
                        title={`${member.user.displayName} (${member.role})`}
                      >
                        {getInitials(member.user.displayName)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin: Pending Join Requests */}
                {isAdmin && pendingRequests.length > 0 && (
                  <div style={styles.inviteSection}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Pending Join Requests ({pendingRequests.length})
                    </h4>
                    {pendingRequests.map((request: any) => (
                      <div
                        key={request.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>
                            {request.user.displayName}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#777', marginLeft: '0.5rem' }}>
                            {request.user.email}
                          </span>
                          {request.message && (
                            <p style={{ fontSize: '0.8rem', color: '#555', margin: '0.25rem 0 0' }}>
                              "{request.message}"
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            style={{
                              ...styles.button,
                              ...styles.primaryButton,
                              fontSize: '0.75rem',
                            }}
                            onClick={() => handleApproveJoinRequest(request.id)}
                          >
                            Approve
                          </button>
                          <button
                            style={{
                              ...styles.button,
                              ...styles.secondaryButton,
                              fontSize: '0.75rem',
                            }}
                            onClick={() => handleDenyJoinRequest(request.id)}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin Invite Section */}
                {isAdmin && (
                  <div style={styles.inviteSection}>
                    <div style={{ ...styles.formRow, alignItems: 'center' }}>
                      <input
                        style={{ ...styles.input, minWidth: '180px' }}
                        type="email"
                        placeholder="Invite by email"
                        value={inviteEmails[nest.id] ?? ''}
                        onChange={(e) =>
                          setInviteEmails((prev) => ({ ...prev, [nest.id]: e.target.value }))
                        }
                      />
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => handleInvite(nest.id)}
                        disabled={!inviteEmails[nest.id]?.trim()}
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Edit Location/Visibility */}
                {isAdmin && (
                  <div style={styles.inviteSection}>
                    {editingNest === nest.id ? (
                      <div>
                        <h4
                          style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}
                        >
                          Edit Nest Settings
                        </h4>
                        <div style={{ ...styles.formRow, marginBottom: '0.5rem' }}>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>City</label>
                            <input
                              style={{ ...styles.input, minWidth: '120px' }}
                              type="text"
                              value={editFields.city}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, city: e.target.value }))
                              }
                              placeholder="City"
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>State</label>
                            <input
                              style={{ ...styles.input, minWidth: '80px' }}
                              type="text"
                              value={editFields.state}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, state: e.target.value }))
                              }
                              placeholder="State"
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Zip</label>
                            <input
                              style={{ ...styles.input, minWidth: '80px' }}
                              type="text"
                              value={editFields.zipcode}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, zipcode: e.target.value }))
                              }
                              placeholder="Zip"
                            />
                          </div>
                          <div style={styles.formGroup}>
                            <label style={styles.label}>Visibility</label>
                            <select
                              style={{ ...styles.input, minWidth: '100px' }}
                              value={editFields.visibility}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, visibility: e.target.value }))
                              }
                            >
                              <option value="PUBLIC">Public</option>
                              <option value="PRIVATE">Private</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            style={{
                              ...styles.button,
                              ...styles.primaryButton,
                              fontSize: '0.8rem',
                            }}
                            onClick={() => handleSaveEdit(nest.id)}
                          >
                            Save
                          </button>
                          <button
                            style={{
                              ...styles.button,
                              ...styles.secondaryButton,
                              fontSize: '0.8rem',
                            }}
                            onClick={() => setEditingNest(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton, fontSize: '0.8rem' }}
                        onClick={() => handleStartEdit(nest)}
                      >
                        Edit Location & Visibility
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

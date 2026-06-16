import { useParams, Link } from 'react-router'
import { useQuery, useMutation, gql } from 'urql'
import { useState } from 'react'

const NEST_QUERY = gql`
  query Nest($id: String!) {
    nest(id: $id) {
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
        joinedAt
        user {
          id
          displayName
          avatarUrl
          bio
        }
      }
    }
  }
`

const MY_NESTS_QUERY = gql`
  query MyNestsForProfile {
    myNests {
      id
      nest {
        id
      }
      role
    }
  }
`

const NEST_ACTIVITY_FEED_QUERY = gql`
  query NestActivityFeed($nestId: String!, $limit: Int) {
    nestActivityInstances(nestId: $nestId, limit: $limit) {
      id
      status
      startedAt
      completedAt
      notes
      createdAt
      activity {
        id
        title
        category
        difficulty
      }
      ratings {
        id
        score
        user {
          id
          displayName
        }
      }
    }
  }
`

const NEST_TESTIMONIALS_QUERY = gql`
  query NestTestimonials($nestId: String!) {
    nestTestimonials(nestId: $nestId) {
      id
      body
      visibility
      approvalStatus
      createdAt
      author {
        id
        displayName
        avatarUrl
      }
    }
  }
`

const REQUEST_TO_JOIN_MUTATION = gql`
  mutation RequestToJoinNest($nestId: String!, $message: String) {
    requestToJoinNest(nestId: $nestId, message: $message) {
      id
      status
    }
  }
`

const MY_JOIN_REQUESTS_QUERY = gql`
  query MyJoinRequestsForProfile {
    myJoinRequests {
      id
      nestId
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
  backLink: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#2d6a4f',
    fontWeight: 500,
    textDecoration: 'none',
  },
  header: {
    marginBottom: '2rem',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  meta: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  description: {
    fontSize: '1rem',
    color: '#333',
    marginTop: '1rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#2d6a4f',
  },
  memberGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  memberCard: {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d6a4f',
    border: '1px solid #c8e6c9',
    flexShrink: 0,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: 0,
  },
  memberRole: {
    fontSize: '0.75rem',
    color: '#666',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginLeft: '0.5rem',
  },
  adminBadge: {
    background: '#2d6a4f',
    color: '#fff',
  },
  visibilityBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
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
  pendingBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: '#fff3e0',
    color: '#e65100',
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
  messageInput: {
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.85rem',
    width: '250px',
    marginRight: '0.5rem',
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

export function NestProfile() {
  const { id } = useParams<{ id: string }>()
  const [joinMessage, setJoinMessage] = useState('')

  const [nestResult] = useQuery({
    query: NEST_QUERY,
    variables: { id },
    pause: !id,
  })

  const [myNestsResult] = useQuery({ query: MY_NESTS_QUERY })
  const [joinRequestsResult, reexecuteJoinRequests] = useQuery({
    query: MY_JOIN_REQUESTS_QUERY,
  })

  // Determine membership early so we can conditionally pause feed queries
  const myNests = myNestsResult.data?.myNests ?? []
  const myMembership = myNests.find((m: any) => m.nest.id === id)
  const isMember = !!myMembership

  const [activityFeedResult] = useQuery({
    query: NEST_ACTIVITY_FEED_QUERY,
    variables: { nestId: id, limit: 20 },
    pause: !id || !isMember,
  })

  const [testimonialFeedResult] = useQuery({
    query: NEST_TESTIMONIALS_QUERY,
    variables: { nestId: id },
    pause: !id || !isMember,
  })

  const [, requestToJoin] = useMutation(REQUEST_TO_JOIN_MUTATION)

  if (nestResult.fetching) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading nest...</p>
      </div>
    )
  }

  if (nestResult.error || !nestResult.data?.nest) {
    return (
      <div style={styles.container}>
        <Link to="/nests" style={styles.backLink}>
          &larr; Back to Nests
        </Link>
        <p style={styles.error}>{nestResult.error?.message || 'Nest not found.'}</p>
      </div>
    )
  }

  const nest = nestResult.data.nest
  const myRequests = joinRequestsResult.data?.myJoinRequests ?? []
  const hasPendingRequest = myRequests.some((r: any) => r.nestId === id && r.status === 'PENDING')

  const location = [nest.city, nest.state, nest.zipcode].filter(Boolean).join(', ')

  const handleRequestToJoin = async () => {
    if (!id) return
    const message = joinMessage.trim() || undefined
    await requestToJoin({ nestId: id, message })
    setJoinMessage('')
    reexecuteJoinRequests({ requestPolicy: 'network-only' })
  }

  return (
    <div style={styles.container}>
      <Link to="/nests" style={styles.backLink}>
        &larr; Back to Nests
      </Link>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.heading}>{nest.name}</h1>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
        >
          <span
            style={{
              ...styles.visibilityBadge,
              background: nest.visibility === 'PUBLIC' ? '#e3f2fd' : '#fce4ec',
              color: nest.visibility === 'PUBLIC' ? '#1565c0' : '#c62828',
            }}
          >
            {nest.visibility}
          </span>
          <span style={styles.meta}>
            {nest.memberCount}
            {nest.maxMembers ? ` / ${nest.maxMembers}` : ''} members
          </span>
        </div>
        {location && <p style={styles.meta}>{location}</p>}
        {nest.description && <p style={styles.description}>{nest.description}</p>}

        {/* Join action for non-members */}
        {!isMember && nest.visibility === 'PUBLIC' && (
          <div style={{ marginTop: '1rem' }}>
            {hasPendingRequest ? (
              <span style={styles.pendingBadge}>Join Request Pending</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  style={styles.messageInput}
                  type="text"
                  placeholder="Optional message to admins"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                />
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleRequestToJoin}
                >
                  Request to Join
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Members Section - visible to all who can see the nest */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Members</h2>
        {isMember ? (
          <div style={styles.memberGrid}>
            {nest.members.map((member: any) => (
              <Link
                key={member.id}
                to={`/users/${member.user.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={styles.memberCard}>
                  <div style={styles.avatar}>{getInitials(member.user.displayName)}</div>
                  <div style={styles.memberInfo}>
                    <p style={styles.memberName}>
                      {member.user.displayName}
                      {member.role === 'ADMIN' && (
                        <span style={{ ...styles.badge, ...styles.adminBadge }}>Admin</span>
                      )}
                    </p>
                    {member.user.bio && (
                      <p style={{ fontSize: '0.8rem', color: '#777', margin: '0.25rem 0 0' }}>
                        {member.user.bio.slice(0, 60)}
                        {member.user.bio.length > 60 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#777' }}>Join this nest to see its members.</p>
        )}
      </div>

      {/* Activity Feed - members only */}
      {isMember && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          {activityFeedResult.fetching ? (
            <p style={{ fontSize: '0.9rem', color: '#777' }}>Loading activities...</p>
          ) : (activityFeedResult.data?.nestActivityInstances ?? []).length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#777' }}>
              No activities yet. Start one from the{' '}
              <Link to="/activities" style={{ color: '#2d6a4f' }}>
                Activities
              </Link>{' '}
              page.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(activityFeedResult.data?.nestActivityInstances ?? []).map((instance: any) => (
                <div
                  key={instance.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                      {instance.activity.title}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                      {instance.activity.category} &bull; {instance.activity.difficulty}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          instance.status === 'DONE'
                            ? '#e8f5e9'
                            : instance.status === 'IN_PROGRESS'
                              ? '#fff3e0'
                              : instance.status === 'ABANDONED'
                                ? '#fce4ec'
                                : '#f5f5f5',
                        color:
                          instance.status === 'DONE'
                            ? '#2d6a4f'
                            : instance.status === 'IN_PROGRESS'
                              ? '#e65100'
                              : instance.status === 'ABANDONED'
                                ? '#c62828'
                                : '#666',
                      }}
                    >
                      {instance.status.replace('_', ' ')}
                    </span>
                    {instance.ratings.length > 0 && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#999' }}>
                        {'★'.repeat(
                          Math.round(
                            instance.ratings.reduce((acc: number, r: any) => acc + r.score, 0) /
                              instance.ratings.length,
                          ),
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Testimonials - members only */}
      {isMember && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Testimonials</h2>
          {testimonialFeedResult.fetching ? (
            <p style={{ fontSize: '0.9rem', color: '#777' }}>Loading testimonials...</p>
          ) : (testimonialFeedResult.data?.nestTestimonials ?? []).length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#777' }}>
              No testimonials yet. Share your experience from the{' '}
              <Link to="/testimonials" style={{ color: '#2d6a4f' }}>
                Testimonials
              </Link>{' '}
              page.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(testimonialFeedResult.data?.nestTestimonials ?? []).map((testimonial: any) => (
                <div
                  key={testimonial.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    background: '#fafafa',
                  }}
                >
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#333' }}>
                    "{testimonial.body}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#e8f5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        color: '#2d6a4f',
                      }}
                    >
                      {getInitials(testimonial.author.displayName)}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {testimonial.author.displayName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>
                      &bull; {new Date(testimonial.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

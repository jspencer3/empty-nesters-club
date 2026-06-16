import { useQuery, useMutation, gql } from 'urql'

const ME_QUERY = gql`
  query AdminMe {
    me {
      id
      role
    }
  }
`

const SYSTEM_STATS_QUERY = gql`
  query AdminSystemStats {
    adminSystemStats {
      totalUsers
      totalNests
      totalActivities
      totalActiveInstances
      totalPendingActivities
      totalPendingTestimonials
    }
  }
`

const PENDING_TESTIMONIALS_QUERY = gql`
  query PendingTestimonials {
    pendingTestimonials {
      id
      body
      visibility
      createdAt
      author {
        id
        displayName
        email
      }
    }
  }
`

const PENDING_ACTIVITIES_QUERY = gql`
  query PendingActivities {
    pendingActivities {
      id
      title
      description
      category
      difficulty
      createdAt
      submittedBy {
        id
        displayName
        email
      }
    }
  }
`

const APPROVE_TESTIMONIAL = gql`
  mutation ApproveTestimonial($testimonialId: String!) {
    approveTestimonial(testimonialId: $testimonialId)
  }
`

const REJECT_TESTIMONIAL = gql`
  mutation RejectTestimonial($testimonialId: String!) {
    rejectTestimonial(testimonialId: $testimonialId)
  }
`

const APPROVE_ACTIVITY = gql`
  mutation ApproveActivity($activityId: String!) {
    approveActivity(activityId: $activityId) {
      id
      status
    }
  }
`

const REJECT_ACTIVITY = gql`
  mutation RejectActivity($activityId: String!) {
    rejectActivity(activityId: $activityId)
  }
`

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    color: '#c62828',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d6a4f',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '0.25rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '0.5rem',
  },
  card: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '0.95rem',
    marginBottom: '0.25rem',
  },
  cardMeta: {
    fontSize: '0.8rem',
    color: '#777',
    marginBottom: '0.5rem',
  },
  cardBody: {
    fontSize: '0.9rem',
    color: '#333',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  approveBtn: {
    padding: '0.4rem 1rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  rejectBtn: {
    padding: '0.4rem 1rem',
    background: '#c62828',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  badge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
    background: '#e8f5e9',
    color: '#2d6a4f',
    marginLeft: '0.5rem',
  },
  empty: {
    color: '#666',
    fontSize: '0.9rem',
    fontStyle: 'italic' as const,
  },
  forbidden: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#c62828',
    fontSize: '1.1rem',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function Admin() {
  const [meResult] = useQuery({ query: ME_QUERY })
  const [statsResult] = useQuery({
    query: SYSTEM_STATS_QUERY,
    pause: meResult.fetching || meResult.data?.me?.role !== 'SITE_ADMIN',
  })
  const [testimonialResult, refetchTestimonials] = useQuery({
    query: PENDING_TESTIMONIALS_QUERY,
    pause: meResult.fetching || meResult.data?.me?.role !== 'SITE_ADMIN',
  })
  const [activityResult, refetchActivities] = useQuery({
    query: PENDING_ACTIVITIES_QUERY,
    pause: meResult.fetching || meResult.data?.me?.role !== 'SITE_ADMIN',
  })

  const [, approveTestimonial] = useMutation(APPROVE_TESTIMONIAL)
  const [, rejectTestimonial] = useMutation(REJECT_TESTIMONIAL)
  const [, approveActivity] = useMutation(APPROVE_ACTIVITY)
  const [, rejectActivity] = useMutation(REJECT_ACTIVITY)

  if (meResult.fetching) {
    return <div style={styles.container}>Loading...</div>
  }

  if (meResult.data?.me?.role !== 'SITE_ADMIN') {
    return <div style={styles.forbidden}>Access denied. Site admin privileges required.</div>
  }

  const stats = statsResult.data?.adminSystemStats
  const pendingTestimonials = testimonialResult.data?.pendingTestimonials ?? []
  const pendingActivities = activityResult.data?.pendingActivities ?? []

  async function handleApproveTestimonial(id: string) {
    await approveTestimonial({ testimonialId: id })
    refetchTestimonials({ requestPolicy: 'network-only' })
  }

  async function handleRejectTestimonial(id: string) {
    await rejectTestimonial({ testimonialId: id })
    refetchTestimonials({ requestPolicy: 'network-only' })
  }

  async function handleApproveActivity(id: string) {
    await approveActivity({ activityId: id })
    refetchActivities({ requestPolicy: 'network-only' })
  }

  async function handleRejectActivity(id: string) {
    await rejectActivity({ activityId: id })
    refetchActivities({ requestPolicy: 'network-only' })
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Site Administration</h1>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalNests}</div>
            <div style={styles.statLabel}>Nests</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalActivities}</div>
            <div style={styles.statLabel}>Activities</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalActiveInstances}</div>
            <div style={styles.statLabel}>Active Instances</div>
          </div>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statValue,
                color: stats.totalPendingTestimonials > 0 ? '#c62828' : '#2d6a4f',
              }}
            >
              {stats.totalPendingTestimonials}
            </div>
            <div style={styles.statLabel}>Pending Testimonials</div>
          </div>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statValue,
                color: stats.totalPendingActivities > 0 ? '#c62828' : '#2d6a4f',
              }}
            >
              {stats.totalPendingActivities}
            </div>
            <div style={styles.statLabel}>Pending Activities</div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Pending Testimonials
          {pendingTestimonials.length > 0 && (
            <span style={styles.badge}>{pendingTestimonials.length}</span>
          )}
        </h2>
        {testimonialResult.fetching ? (
          <p style={styles.empty}>Loading...</p>
        ) : pendingTestimonials.length === 0 ? (
          <p style={styles.empty}>No pending testimonials.</p>
        ) : (
          pendingTestimonials.map(
            (t: {
              id: string
              body: string
              visibility: string
              createdAt: string
              author: { id: string; displayName: string; email: string }
            }) => (
              <div key={t.id} style={styles.card}>
                <div style={styles.cardTitle}>
                  {t.author.displayName}
                  <span style={{ fontWeight: 400, color: '#999', marginLeft: '0.5rem' }}>
                    ({t.author.email})
                  </span>
                </div>
                <div style={styles.cardMeta}>
                  {t.visibility} &bull; Submitted {formatDate(t.createdAt)}
                </div>
                <div style={styles.cardBody}>"{t.body}"</div>
                <div style={styles.actions}>
                  <button style={styles.approveBtn} onClick={() => handleApproveTestimonial(t.id)}>
                    Approve
                  </button>
                  <button style={styles.rejectBtn} onClick={() => handleRejectTestimonial(t.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Pending Activities
          {pendingActivities.length > 0 && (
            <span style={styles.badge}>{pendingActivities.length}</span>
          )}
        </h2>
        {activityResult.fetching ? (
          <p style={styles.empty}>Loading...</p>
        ) : pendingActivities.length === 0 ? (
          <p style={styles.empty}>No pending activities.</p>
        ) : (
          pendingActivities.map(
            (a: {
              id: string
              title: string
              description: string
              category: string
              difficulty: string
              createdAt: string
              submittedBy: { id: string; displayName: string; email: string } | null
            }) => (
              <div key={a.id} style={styles.card}>
                <div style={styles.cardTitle}>{a.title}</div>
                <div style={styles.cardMeta}>
                  {a.category} &bull; {a.difficulty} &bull; Submitted {formatDate(a.createdAt)}
                  {a.submittedBy && (
                    <span>
                      {' '}
                      by {a.submittedBy.displayName} ({a.submittedBy.email})
                    </span>
                  )}
                </div>
                <div style={styles.cardBody}>{a.description}</div>
                <div style={styles.actions}>
                  <button style={styles.approveBtn} onClick={() => handleApproveActivity(a.id)}>
                    Approve
                  </button>
                  <button style={styles.rejectBtn} onClick={() => handleRejectActivity(a.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  )
}

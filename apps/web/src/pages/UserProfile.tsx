import { gql, useQuery } from 'urql'
import { useParams, Link } from 'react-router'

const USER_QUERY = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      email
      displayName
      bio
      avatarUrl
      yearsEmpty
      numberOfKids
      interests
      profileVisibility
      createdAt
    }
  }
`

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '640px',
    margin: '0 auto',
  },
  card: {
    borderRadius: '12px',
    border: '1px solid #e8e8e8',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  avatar: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '3px solid rgba(255,255,255,0.8)',
  },
  avatarPlaceholder: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
    border: '3px solid rgba(255,255,255,0.8)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  name: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
  },
  email: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)',
  },
  body: {
    padding: '1.5rem 2rem',
  },
  bioSection: {
    marginBottom: '1.5rem',
  },
  bioText: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d6a4f',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.25rem',
  },
  interestsSection: {
    marginBottom: '1.5rem',
  },
  sectionLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#666',
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  interestTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  tag: {
    padding: '0.3rem 0.75rem',
    borderRadius: '999px',
    background: '#e8f5e9',
    color: '#2d6a4f',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  memberSince: {
    fontSize: '0.85rem',
    color: '#999',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  loading: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#666',
  },
  error: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#c62828',
  },
  notFound: {
    padding: '3rem',
    textAlign: 'center' as const,
  },
  notFoundText: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '1rem',
  },
  backLink: {
    color: '#2d6a4f',
    textDecoration: 'none',
    fontWeight: 500,
  },
  privateNotice: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#666',
    fontStyle: 'italic' as const,
  },
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>()
  const [{ data, fetching, error }] = useQuery({
    query: USER_QUERY,
    variables: { id: id || '' },
    pause: !id,
  })

  function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (fetching) {
    return <div style={styles.loading}>Loading profile...</div>
  }

  if (error) {
    return <div style={styles.error}>Failed to load profile: {error.message}</div>
  }

  if (!data?.user) {
    return (
      <div style={styles.notFound}>
        <p style={styles.notFoundText}>User not found.</p>
        <Link to="/dashboard" style={styles.backLink}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const user = data.user

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>{getInitials(user.displayName)}</div>
          )}
          <div style={styles.headerInfo}>
            <div style={styles.name}>{user.displayName || 'Anonymous'}</div>
            <div style={styles.email}>{user.email}</div>
          </div>
        </div>

        <div style={styles.body}>
          {user.bio && (
            <div style={styles.bioSection}>
              <p style={styles.bioText}>{user.bio}</p>
            </div>
          )}

          {(user.yearsEmpty != null || user.numberOfKids != null) && (
            <div style={styles.statsGrid}>
              {user.yearsEmpty != null && (
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{user.yearsEmpty}</div>
                  <div style={styles.statLabel}>Years Empty Nesting</div>
                </div>
              )}
              {user.numberOfKids != null && (
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{user.numberOfKids}</div>
                  <div style={styles.statLabel}>Kids</div>
                </div>
              )}
            </div>
          )}

          {user.interests && user.interests.length > 0 && (
            <div style={styles.interestsSection}>
              <div style={styles.sectionLabel}>Interests</div>
              <div style={styles.interestTags}>
                {user.interests.map((interest: string, i: number) => (
                  <span key={i} style={styles.tag}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.createdAt && (
            <div style={styles.memberSince}>
              Member since{' '}
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

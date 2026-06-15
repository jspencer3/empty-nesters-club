import { useQuery, gql } from 'urql'
import { Link } from 'react-router'

const USER_DASHBOARD_QUERY = gql`
  query UserDashboard {
    userDashboard {
      totalNests
      totalActivitiesCompleted
      totalActivitiesInProgress
      totalPartnerGroups
      averageRating
      recentInstances {
        id
        status
        startedAt
        completedAt
        title
      }
    }
  }
`

const ME_QUERY = gql`
  query DashboardMe {
    me {
      id
      displayName
      avatarUrl
    }
  }
`

const NOTIFICATIONS_QUERY = gql`
  query RecentNotifications {
    myNotifications(limit: 5, unreadOnly: true) {
      id
      type
      title
      body
      read
      createdAt
      actionUrl
    }
  }
`

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

function notificationIcon(type: string): string {
  switch (type) {
    case 'message':
      return '💬'
    case 'invite':
      return '✉️'
    case 'reminder':
      return '🔔'
    case 'achievement':
      return '🏆'
    default:
      return '📌'
  }
}

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
    color: '#2d6a4f',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center' as const,
    backgroundColor: '#fff',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#2d6a4f',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '0.25rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  activityList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  activityItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '0.95rem',
    color: '#444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor:
      status === 'completed' ? '#e8f5e9' : status === 'in_progress' ? '#fff3e0' : '#f5f5f5',
    color: status === 'completed' ? '#2d6a4f' : status === 'in_progress' ? '#e65100' : '#666',
  }),
  notificationItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  notificationIcon: {
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#333',
  },
  notificationTime: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: '0.2rem',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  navLink: {
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    background: '#e8f5e9',
    color: '#2d6a4f',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
  },
  ratingSection: {
    marginBottom: '2rem',
    fontSize: '1.1rem',
    color: '#2d6a4f',
  },
  skeleton: {
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonCard: {
    height: '80px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
  },
  skeletonLine: {
    height: '1rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '0.75rem',
  },
  emptyPrompt: {
    padding: '2rem',
    textAlign: 'center' as const,
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    color: '#2d6a4f',
  },
  emptyPromptText: {
    fontSize: '1rem',
    marginBottom: '1rem',
  },
}

export function Dashboard() {
  const [dashboardResult] = useQuery({ query: USER_DASHBOARD_QUERY })
  const [meResult] = useQuery({ query: ME_QUERY })
  const [notificationsResult] = useQuery({ query: NOTIFICATIONS_QUERY })

  const loading = dashboardResult.fetching || meResult.fetching || notificationsResult.fetching

  if (loading) {
    return (
      <div style={styles.container}>
        <div
          style={{ ...styles.skeletonLine, width: '60%', height: '2rem', marginBottom: '2rem' }}
        />
        <div style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={styles.skeletonCard} />
          ))}
        </div>
        <div style={styles.section}>
          <div style={{ ...styles.skeletonLine, width: '30%' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...styles.skeletonLine, width: '100%' }} />
          ))}
        </div>
        <div style={styles.section}>
          <div style={{ ...styles.skeletonLine, width: '30%' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...styles.skeletonLine, width: '90%' }} />
          ))}
        </div>
      </div>
    )
  }

  const dashboard = dashboardResult.data?.userDashboard
  const me = meResult.data?.me
  const notifications = notificationsResult.data?.myNotifications ?? []
  const displayName = me?.displayName || 'there'

  const hasActivity =
    dashboard &&
    (dashboard.totalNests > 0 ||
      dashboard.totalActivitiesCompleted > 0 ||
      dashboard.totalActivitiesInProgress > 0 ||
      dashboard.totalPartnerGroups > 0)

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome back, {displayName}</h1>

      {!hasActivity ? (
        <div style={styles.emptyPrompt}>
          <p style={styles.emptyPromptText}>
            You haven't started any activities yet. Let's get you going!
          </p>
          <Link to="/activities" style={styles.navLink}>
            Browse Activities
          </Link>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboard.totalNests}</div>
              <div style={styles.statLabel}>Nests</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboard.totalActivitiesCompleted}</div>
              <div style={styles.statLabel}>Activities Completed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboard.totalActivitiesInProgress}</div>
              <div style={styles.statLabel}>In Progress</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboard.totalPartnerGroups}</div>
              <div style={styles.statLabel}>Partner Groups</div>
            </div>
          </div>

          {dashboard.averageRating > 0 && (
            <div style={styles.ratingSection}>
              <span>Your average rating: </span>
              <span>{renderStars(dashboard.averageRating)}</span>
              <span> ({dashboard.averageRating.toFixed(1)})</span>
            </div>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
            {dashboard.recentInstances && dashboard.recentInstances.length > 0 ? (
              <ul style={styles.activityList}>
                {dashboard.recentInstances.map(
                  (instance: {
                    id: string
                    status: string
                    startedAt: string
                    completedAt: string | null
                    title: string
                  }) => (
                    <li key={instance.id} style={styles.activityItem}>
                      <span>{instance.title}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={styles.statusBadge(instance.status)}>
                          {instance.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>
                          {formatRelativeTime(instance.completedAt || instance.startedAt)}
                        </span>
                      </span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                No recent activity yet. Start an activity to see it here!
              </p>
            )}
          </div>
        </>
      )}

      {notifications.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notifications</h2>
          <div>
            {notifications.map(
              (notification: {
                id: string
                type: string
                title: string
                body: string
                read: boolean
                createdAt: string
                actionUrl: string | null
              }) => (
                <div key={notification.id} style={styles.notificationItem}>
                  <span style={styles.notificationIcon}>{notificationIcon(notification.type)}</span>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTitle}>{notification.title}</div>
                    <div style={styles.notificationTime}>
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Links</h2>
        <div style={styles.navLinks}>
          <Link to="/activities" style={styles.navLink}>
            Browse Activities
          </Link>
          <Link to="/nests" style={styles.navLink}>
            My Nests
          </Link>
          <Link to="/profile" style={styles.navLink}>
            My Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

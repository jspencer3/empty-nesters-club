import { Link } from 'react-router'

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
    padding: '0.75rem 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '0.95rem',
    color: '#444',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
  },
  navLink: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    background: '#f0f7f4',
    color: '#2d6a4f',
    textDecoration: 'none',
    fontWeight: 500,
  },
}

export function Dashboard() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome back, Explorer!</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>3</div>
          <div style={styles.statLabel}>My Nests</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>12</div>
          <div style={styles.statLabel}>Activities Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>5</div>
          <div style={styles.statLabel}>Upcoming Events</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>28</div>
          <div style={styles.statLabel}>Connections</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <ul style={styles.activityList}>
          <li style={styles.activityItem}>You joined the "Weekend Hikers" nest</li>
          <li style={styles.activityItem}>New discussion in "Cooking Adventures"</li>
          <li style={styles.activityItem}>Event reminder: Wine tasting Saturday at 7pm</li>
          <li style={styles.activityItem}>You bookmarked "Beginner Pottery Class"</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Links</h2>
        <div style={styles.navLinks}>
          <Link to="/nests" style={styles.navLink}>
            My Nests
          </Link>
          <Link to="/activities" style={styles.navLink}>
            Browse Activities
          </Link>
        </div>
      </div>
    </div>
  )
}

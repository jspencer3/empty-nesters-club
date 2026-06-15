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
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
  },
  cardMeta: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  memberCount: {
    fontSize: '0.8rem',
    color: '#2d6a4f',
    fontWeight: 500,
  },
}

const nests = [
  {
    icon: '🥾',
    name: 'Weekend Hikers',
    members: 8,
    desc: 'Saturday morning trail walks in the area.',
  },
  {
    icon: '🍳',
    name: 'Cooking Adventures',
    members: 12,
    desc: 'Try new recipes and share meals together.',
  },
  {
    icon: '📖',
    name: 'Page Turners',
    members: 6,
    desc: 'Monthly book club with lively discussions.',
  },
  { icon: '🚴', name: 'Cycling Crew', members: 5, desc: 'Casual rides on local bike paths.' },
]

export function Nests() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>My Nests</h1>

      <div style={styles.list}>
        {nests.map((nest) => (
          <div key={nest.name} style={styles.card}>
            <div style={styles.avatar}>{nest.icon}</div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{nest.name}</h3>
              <p style={styles.cardMeta}>{nest.desc}</p>
            </div>
            <span style={styles.memberCount}>{nest.members} members</span>
          </div>
        ))}
      </div>
    </div>
  )
}

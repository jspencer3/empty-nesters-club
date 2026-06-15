const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1px solid #2d6a4f',
    background: '#fff',
    color: '#2d6a4f',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  filterBtnActive: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1px solid #2d6a4f',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '140px',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  },
  cardBody: {
    padding: '1rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: '0 0 0.5rem',
  },
  cardMeta: {
    fontSize: '0.8rem',
    color: '#666',
    margin: '0 0 0.5rem',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#444',
    margin: 0,
  },
}

const categories = ['All', 'Outdoors', 'Food & Drink', 'Arts & Crafts', 'Fitness', 'Social']

const activities = [
  {
    icon: '🥾',
    title: 'Sunrise Hike',
    category: 'Outdoors',
    desc: 'Easy 5-mile trail with scenic overlooks.',
  },
  {
    icon: '🍷',
    title: 'Wine Tasting Evening',
    category: 'Food & Drink',
    desc: 'Sample local wines with fellow enthusiasts.',
  },
  {
    icon: '🎨',
    title: 'Watercolor Workshop',
    category: 'Arts & Crafts',
    desc: 'Learn watercolor basics in a relaxed setting.',
  },
  {
    icon: '🧘',
    title: 'Morning Yoga',
    category: 'Fitness',
    desc: 'Gentle yoga for all experience levels.',
  },
  {
    icon: '🍳',
    title: 'Italian Cooking Class',
    category: 'Food & Drink',
    desc: 'Make pasta from scratch with a local chef.',
  },
  {
    icon: '📚',
    title: 'Book Club Meetup',
    category: 'Social',
    desc: 'Monthly discussion of our current read.',
  },
]

export function Activities() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Activity Catalog</h1>

      <div style={styles.filters}>
        {categories.map((cat, i) => (
          <button key={cat} style={i === 0 ? styles.filterBtnActive : styles.filterBtn}>
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {activities.map((a) => (
          <div key={a.title} style={styles.card}>
            <div style={styles.cardImage}>{a.icon}</div>
            <div style={styles.cardBody}>
              <h3 style={styles.cardTitle}>{a.title}</h3>
              <p style={styles.cardMeta}>{a.category}</p>
              <p style={styles.cardDesc}>{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

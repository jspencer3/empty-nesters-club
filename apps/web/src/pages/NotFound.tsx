import { Link } from 'react-router'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
  },
  code: {
    fontSize: '4rem',
    fontWeight: 700,
    color: '#2d6a4f',
    margin: '0 0 0.5rem',
  },
  message: {
    fontSize: '1.2rem',
    color: '#444',
    marginBottom: '2rem',
  },
  link: {
    padding: '0.6rem 1.5rem',
    background: '#2d6a4f',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 500,
  },
}

export function NotFound() {
  return (
    <div style={styles.container}>
      <p style={styles.code}>404</p>
      <p style={styles.message}>This page doesn't exist. Maybe the nest moved?</p>
      <Link to="/" style={styles.link}>
        Back to Home
      </Link>
    </div>
  )
}

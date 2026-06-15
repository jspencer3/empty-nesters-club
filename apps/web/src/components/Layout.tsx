import { Link, Outlet } from 'react-router'

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
  },
  brand: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#2d6a4f',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    color: '#2d6a4f',
    fontWeight: 600,
  },
  main: {
    flex: 1,
  },
}

export function Layout() {
  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <Link to="/" style={styles.brand}>
          Empty Nesters Club
        </Link>
        <nav style={styles.nav}>
          <Link to="/dashboard" style={styles.navLink}>
            Dashboard
          </Link>
          <Link to="/activities" style={styles.navLink}>
            Activities
          </Link>
          <Link to="/nests" style={styles.navLink}>
            Nests
          </Link>
          <div style={styles.avatar}>EN</div>
        </nav>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

import { Link, Outlet, useNavigate } from 'react-router'
import { gql, useQuery, useMutation } from 'urql'
import { useAuth } from '../lib/auth-context'
import { useEffect } from 'react'

const ME_QUERY = gql`
  query LayoutMe {
    me {
      id
      displayName
      avatarUrl
    }
  }
`

const MARK_ALL_READ = gql`
  mutation MarkAllRead {
    markAllNotificationsRead
  }
`

const UNREAD_COUNT_QUERY = gql`
  query UnreadCount {
    unreadNotificationCount
  }
`

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
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#2d6a4f',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'center',
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  avatarImg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '2px solid #e8f5e9',
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    color: '#2d6a4f',
    fontWeight: 600,
  },
  signOut: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '0.8rem',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontWeight: 500,
  },
  main: {
    flex: 1,
  },
  badge: {
    position: 'relative' as const,
  },
  notifDot: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-6px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#e53935',
  },
}

export function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [{ data }] = useQuery({ query: ME_QUERY })
  const [{ data: unreadData }] = useQuery({ query: UNREAD_COUNT_QUERY })
  const [, markAllRead] = useMutation(MARK_ALL_READ)

  // Redirect to profile completion if user has no displayName
  useEffect(() => {
    if (data?.me && !data.me.displayName) {
      navigate('/profile', { replace: true })
    }
  }, [data, navigate])

  function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const unreadCount = unreadData?.unreadNotificationCount ?? 0

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  // Suppress unused variable warning — markAllRead is available for notification interactions
  void markAllRead

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <Link to="/dashboard" style={styles.brand}>
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
          <Link to="/partner-groups" style={styles.navLink}>
            Partners
          </Link>
          <Link to="/testimonials" style={styles.navLink}>
            Testimonials
          </Link>
          {unreadCount > 0 && (
            <span style={styles.badge}>
              <span style={styles.notifDot} title={`${unreadCount} unread`} />
            </span>
          )}
          <Link to="/profile" style={styles.navLink}>
            {data?.me?.avatarUrl ? (
              <img
                src={data.me.avatarUrl}
                alt={data.me.displayName || 'Profile'}
                style={styles.avatarImg}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>{getInitials(data?.me?.displayName)}</div>
            )}
          </Link>
          <button style={styles.signOut} onClick={handleSignOut}>
            Sign Out
          </button>
        </nav>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

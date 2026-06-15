import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth-context'

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  },
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d6a4f',
    marginBottom: '0.5rem',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: '0.25rem',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%',
    padding: '0.7rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  toggle: {
    marginTop: '1rem',
    textAlign: 'center' as const,
    fontSize: '0.85rem',
    color: '#666',
  },
  toggleLink: {
    color: '#2d6a4f',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '0.85rem',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  success: {
    background: '#ecfdf5',
    color: '#059669',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  forgotLink: {
    color: '#2d6a4f',
    fontSize: '0.8rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'right' as const,
    display: 'block',
    marginTop: '0.25rem',
  },
}

type Mode = 'sign-in' | 'sign-up' | 'forgot-password'

export function Login() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signUp, signIn, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot-password') {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a password reset link.')
      }
    } else if (mode === 'sign-up') {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/dashboard', { replace: true })
      }
    }

    setLoading(false)
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setMessage(null)
  }

  const getTitle = () => {
    if (mode === 'forgot-password') return 'Reset Password'
    if (mode === 'sign-up') return 'Create your account'
    return 'Sign in to your account'
  }

  const getButtonText = () => {
    if (loading) return 'Please wait...'
    if (mode === 'forgot-password') return 'Send Reset Link'
    if (mode === 'sign-up') return 'Sign Up'
    return 'Sign In'
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Empty Nesters Club</h1>
        <p style={styles.subtitle}>{getTitle()}</p>
        <form style={styles.form} onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}
          <div>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mode !== 'forgot-password' && (
            <div>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {mode === 'sign-in' && (
                <button
                  type="button"
                  style={styles.forgotLink}
                  onClick={() => switchMode('forgot-password')}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}
          <button type="submit" style={styles.button} disabled={loading}>
            {getButtonText()}
          </button>
        </form>
        <div style={styles.toggle}>
          {mode === 'forgot-password' ? (
            <>
              Remember your password?{' '}
              <button type="button" style={styles.toggleLink} onClick={() => switchMode('sign-in')}>
                Sign In
              </button>
            </>
          ) : mode === 'sign-up' ? (
            <>
              Already have an account?{' '}
              <button type="button" style={styles.toggleLink} onClick={() => switchMode('sign-in')}>
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button type="button" style={styles.toggleLink} onClick={() => switchMode('sign-up')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

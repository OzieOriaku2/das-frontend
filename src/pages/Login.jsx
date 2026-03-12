import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { FiLogIn } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useLoginMutation } from '../slices/authApiSlice'
import { setCredentials } from '../slices/authSlice'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Enter both fields')
      return
    }
    try {
      const data = await login({ username, password }).unwrap()
      dispatch(setCredentials(data))
      toast.success(`Welcome, ${data.user.name}`)
      navigate('/dashboard/archive')
    } catch (err) {
      toast.error(err?.data?.error || 'Login failed')
    }
  }

  const quickLogin = (u) => {
    setUsername(u)
    setPassword('password')
  }

  return (
    <div className="login-page">
      {/* Branding Panel */}
      <div className="login-branding">
        <div className="login-branding-content">
          <div style={{ width: 100, height: 100, borderRadius: 24, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', padding: 10 }}>
            <img src="/logo-80.png" alt="DAS Logo" width={80} height={80} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="login-title">Digital Archiving System for Land Titles</h1>
          <p className="login-subtitle">Ekiti State Geospatial Data Center </p>
      </div>
    </div>

      {/* Login Form */}
      <div className="login-form-container">
        <div className="login-form-header">
          <h2 className="login-form-title">Sign In</h2>
          <p className="login-form-subtitle">Enter your credentials to access the system</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-das">Username</label>
            <input
              type="text"
              className="form-control form-control-das"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label-das">Password</label>
            <input
              type="password"
              className="form-control form-control-das"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="btn btn-das-primary w-100 py-2" disabled={isLoading}>
            {isLoading ? (
              <><span className="spinner-das spinner-sm me-2" /> Signing in...</>
            ) : (
              <><FiLogIn className="me-2" /> Sign In</>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--das-gray-100)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Demo accounts — password: <strong style={{ color: 'var(--das-gray-700)' }}>password</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['admin', 'scanner', 'entry', 'qa', 'editor', 'viewer'].map(u => (
              <button key={u} onClick={() => quickLogin(u)} type="button"
                className="btn btn-sm" style={{ background: 'var(--das-white)', border: '1px solid var(--das-gray-200)', fontSize: '0.75rem', fontWeight: 600 }}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .login-page { min-height: 100vh; display: flex; }
        .login-branding {
          flex: 1;
          background: linear-gradient(135deg, var(--das-primary) 0%, var(--das-primary-dark) 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: var(--space-2xl);
          position: relative;
          overflow: hidden;
        }
        .login-branding::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .login-branding-content { position: relative; z-index: 1; text-align: center; color: white; max-width: 420px; }
        .login-title { font-family: var(--font-primary); font-size: 2rem; font-weight: 800; margin-bottom: var(--space-md); }
        .login-subtitle { font-size: 1rem; opacity: 0.85; line-height: 1.6; }
        .login-form-container { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: var(--space-2xl); max-width: 480px; }
        .login-form-title { font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-xs); }
        .login-form-subtitle { color: var(--das-gray-600); margin-bottom: var(--space-xl); }
        @media (max-width: 767.98px) { .login-branding { display: none; } .login-form-container { max-width: none; } }
      `}</style>
    </div>
  )
}

export default Login
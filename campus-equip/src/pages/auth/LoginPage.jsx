import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import seal from '../../assets/wmsu-seal.png'
import AuthBrand from './AuthBrand.jsx'
import './auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      })
      localStorage.setItem('user', JSON.stringify(user))
      navigate(user.role === 'admin' ? '/admin' : '/borrower')
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wa">
      <AuthBrand />

      <main className="wa__panel">
        <div className="wa__card">
          <img className="wa__seal-sm" src={seal} alt="" aria-hidden="true" />
          <h2 className="wa__title">Log in</h2>
          <p className="wa__subtitle">
            Enter your email and password to borrow and track equipment.
          </p>

          {location.state?.registered && (
            <div className="wa-alert wa-alert--ok">
              Account created! You can now log in.
            </div>
          )}
          {error && <div className="wa-alert" role="alert">{error}</div>}

          <form onSubmit={submit}>
            <div className="wa-field">
              <label htmlFor="email">Email (Gmail)</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <div className="wa-field">
              <label htmlFor="password">Password</label>
              <div className="wa-pw">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="wa-pw__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="wa-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="wa__footer">
            New here? <Link to="/register" className="wa-link">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
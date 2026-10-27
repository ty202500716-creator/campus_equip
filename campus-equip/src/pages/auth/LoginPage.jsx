import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      const user = await api('/api/auth/login', { method: 'POST', body: form })
      localStorage.setItem('user', JSON.stringify(user))
      navigate(user.role === 'admin' ? '/admin' : '/borrower')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-wrap">
      <section className="card">
        <h2>Login</h2>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="control" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="control" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="error">{error}</div>
          <button type="submit" className="submit">Login</button>
        </form>
        <p className="auth-link">No account? <Link to="/register">Register</Link></p>
      </section>
    </div>
  )
}

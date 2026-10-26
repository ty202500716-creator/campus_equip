import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api('/api/auth/register', { method: 'POST', body: form })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-wrap">
      <section className="card">
        <h2>Create account</h2>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" className="control" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="control" required value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" minLength="6" className="control" required value={form.password} onChange={set('password')} />
          </div>
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" className="control" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="error">{error}</div>
          <button type="submit" className="submit">Register</button>
        </form>
        <p className="auth-link">Already registered? <Link to="/login">Login</Link></p>
      </section>
    </div>
  )
}

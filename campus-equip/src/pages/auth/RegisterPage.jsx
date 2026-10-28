import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import seal from '../../assets/wmsu-seal.png'
import AuthBrand from './AuthBrand.jsx'
import './auth.css'

const COURSES = ['ACT AD', 'ACT NT', 'BSIT', 'BSSCS']
const YEARS = [1, 2, 3, 4]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: '',
    name: '',
    student_id: '',
    contact_number: '',
    course: '',
    year_level: '',
    password: '',
    confirmPassword: '',
  })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // Field names match POST /api/auth/register
    const payload = {
      name: form.name.trim(),
      student_id: form.student_id.trim(),
      email: form.email.trim(),
      contact_number: form.contact_number.trim(),
      course: form.course,
      year_level: Number(form.year_level),
      password: form.password,
      confirmPassword: form.confirmPassword,
    }

    setLoading(true)
    try {
      await api('/api/auth/register', { method: 'POST', body: payload })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.message || 'Registration failed.')
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
          <h2 className="wa__title">Create your account</h2>
          <p className="wa__subtitle">
            Register once to request equipment from the campus inventory.
          </p>

          {error && <div className="wa-alert" role="alert">{error}</div>}

          <form onSubmit={submit}>
            <div className="wa-field">
              <label htmlFor="email">Email (Gmail)</label>
              <input id="email" type="email" value={form.email} onChange={set('email')}
                autoComplete="email" required autoFocus />
            </div>

            <div className="wa-field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" value={form.name} onChange={set('name')}
                autoComplete="name" required />
            </div>

            <div className="wa-field">
              <label htmlFor="student_id">Student ID number</label>
              <input id="student_id" type="text" inputMode="numeric" value={form.student_id}
                onChange={set('student_id')} placeholder="202500000"
                pattern="[0-9]{9}" maxLength={9}
                title="Enter your 9-digit student ID number, e.g. 202500000" required />
            </div>

            <div className="wa-field">
              <label htmlFor="contact_number">
                Contact number <span className="wa-opt">(optional)</span>
              </label>
              <input id="contact_number" type="tel" value={form.contact_number}
                onChange={set('contact_number')} placeholder="09123456789" />
            </div>

            <div className="wa-grid2">
              <div className="wa-field">
                <label htmlFor="course">Course</label>
                <select id="course" value={form.course} onChange={set('course')} required>
                  <option value="" disabled>Select course</option>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="wa-field">
                <label htmlFor="year_level">Year level</label>
                <select id="year_level" value={form.year_level} onChange={set('year_level')} required>
                  <option value="" disabled>Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            <div className="wa-grid2">
              <div className="wa-field">
                <label htmlFor="regPassword">Create password</label>
                <div className="wa-pw">
                  <input id="regPassword" type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    minLength={6} autoComplete="new-password" required />
                  <button type="button" className="wa-pw__toggle"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="wa-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="wa-pw">
                  <input id="confirmPassword" type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={set('confirmPassword')}
                    autoComplete="new-password" required />
                  <button type="button" className="wa-pw__toggle"
                    onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="wa-btn" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="wa__footer">
            Already have an account? <Link to="/login" className="wa-link">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
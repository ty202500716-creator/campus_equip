import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'

const blank = {
  name: '', email: '', contact_number: '', password: '', role: 'student',
  student_number: '', course: '', year_level: 1,
  employee_number: '', department: '', position: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const field = (id, label, type = 'text', extra = {}) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} className="control" value={form[id]} onChange={set(id)} {...extra} />
    </div>
  )

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
          {field('name', 'Full name', 'text', { required: true })}
          {field('email', 'Email', 'email', { required: true })}
          {field('contact_number', 'Contact number', 'tel', { required: true })}
          {field('password', 'Password', 'password', { required: true, minLength: 6 })}
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" className="control" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          {form.role === 'student' ? (
            <>
              {field('student_number', 'Student number', 'text', { required: true })}
              {field('course', 'Course', 'text', { required: true })}
              {field('year_level', 'Year level', 'number', { min: 1, max: 6, required: true })}
            </>
          ) : (
            <>
              {field('employee_number', 'Employee number', 'text', { required: true })}
              {field('department', 'Department', 'text', { required: true })}
              {field('position', 'Position')}
            </>
          )}
          <div className="error">{error}</div>
          <button type="submit" className="submit">Register</button>
        </form>
        <p className="auth-link">Already registered? <Link to="/login">Login</Link></p>
      </section>
    </div>
  )
}

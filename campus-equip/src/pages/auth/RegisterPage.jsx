import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
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
      <input id={id} type={type} className="control"
        value={form[id]} onChange={set(id)} {...extra} />
    </div>
  )

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.contact_number.trim()) {
      setError('All fields including contact number are required.')
      return
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        contact_number: form.contact_number.trim(),
        ...(form.role === 'student' ? {
          student_number: form.student_number.trim(),
          course: form.course.trim(),
          year_level: Number(form.year_level),
        } : {
          employee_number: form.employee_number.trim(),
          department: form.department.trim(),
          position: form.position.trim(),
        }),
      }
      await api('/api/auth/register', { method: 'POST', body: payload })
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-wrap">
      <section className="card">
        <h2>Create account</h2>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          {field('name', 'Full name', 'text', { required: true, placeholder: 'e.g. Juan Dela Cruz' })}
          {field('email', 'Email', 'email', { required: true, placeholder: 'e.g. user@campus.edu' })}
          {field('contact_number', 'Contact number', 'tel', { required: true, placeholder: 'e.g. 09123456789' })}
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
              {field('year_level', 'Year level (1-6)', 'number', { min: 1, max: 6, required: true })}
            </>
          ) : (
            <>
              {field('employee_number', 'Employee number', 'text', { required: true })}
              {field('department', 'Department', 'text', { required: true })}
              {field('position', 'Position (optional)')}
            </>
          )}

          {error && <div className="error">{error}</div>}
          <button type="submit" className="submit">Register</button>
        </form>

        <p className="auth-link">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </div>
  )
}
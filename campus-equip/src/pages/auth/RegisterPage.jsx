import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'student',
    contact_number: '',
    student_number: '',
    course: '',
    year_level: '1',
    employee_number: '',
    department: '',
    position: ''
  })
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    // Debug: See what values are actually in the form state
    console.log("Current Form State:", form)

    // Check if any required base field is empty
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
          year_level: Number(form.year_level)
        } : {
          employee_number: form.employee_number.trim(),
          department: form.department.trim(),
          position: form.position.trim()
        })
      }

      console.log("Sending Payload:", payload)

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
          
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" className="control" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input 
              id="name" 
              className="control" 
              required 
              value={form.name} 
              onChange={set('name')} 
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              className="control" 
              required 
              value={form.email} 
              onChange={set('email')} 
              placeholder="e.g. user@campus.edu"
            />
          </div>

          <div className="field">
            <label htmlFor="contact_number">Contact Number</label>
            <input 
              id="contact_number" 
              className="control" 
              required 
              value={form.contact_number} 
              onChange={set('contact_number')} 
              placeholder="e.g. 09123456789"
            />
          </div>

          {form.role === 'student' ? (
            <>
              <div className="field">
                <label htmlFor="student_number">Student Number</label>
                <input 
                  id="student_number" 
                  className="control" 
                  required 
                  value={form.student_number} 
                  onChange={set('student_number')} 
                  placeholder="e.g. 2024-0001"
                />
              </div>
              <div className="field">
                <label htmlFor="course">Course</label>
                <input 
                  id="course" 
                  className="control" 
                  required 
                  value={form.course} 
                  onChange={set('course')} 
                  placeholder="e.g. BS Information Technology"
                />
              </div>
              <div className="field">
                <label htmlFor="year_level">Year Level (1-6)</label>
                <input 
                  id="year_level" 
                  type="number" 
                  min="1" 
                  max="6" 
                  className="control" 
                  required 
                  value={form.year_level} 
                  onChange={set('year_level')} 
                />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="employee_number">Employee Number</label>
                <input 
                  id="employee_number" 
                  className="control" 
                  required 
                  value={form.employee_number} 
                  onChange={set('employee_number')} 
                  placeholder="e.g. EMP-0102"
                />
              </div>
              <div className="field">
                <label htmlFor="department">Department</label>
                <input 
                  id="department" 
                  className="control" 
                  required 
                  value={form.department} 
                  onChange={set('department')} 
                  placeholder="e.g. IT Department"
                />
              </div>
              <div className="field">
                <label htmlFor="position">Position</label>
                <input 
                  id="position" 
                  className="control" 
                  value={form.position} 
                  onChange={set('position')} 
                  placeholder="e.g. IT Specialist (Optional)"
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              minLength="6" 
              className="control" 
              required 
              value={form.password} 
              onChange={set('password')} 
            />
          </div>

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
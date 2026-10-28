import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { getUser } from '../api.js'
import seal from '../assets/wmsu-seal.png'
import './layout.css'

export default function DashboardLayout({ role }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />

  // Students and staff both use the "borrower" pages; only admins use the admin pages
  const area = user.role === 'admin' ? 'admin' : 'borrower'
  if (area !== role) return <Navigate to={`/${area}`} replace />

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="dashboard-shell">
      <header className="site-header dashboard-header">
        <div className="brand-block">
          <img className="dash-seal" src={seal} alt="Western Mindanao State University seal" />
          <div>
            <h1>Campus Equipment Borrowing System</h1>
            <p>Western Mindanao State University</p>
          </div>
        </div>
      </header>
      <div className="app dashboard-app">
        <Sidebar role={role} />
        <main className="main">
          <div className="topbar">
            <div className="user">
              <div className="avatar" aria-hidden="true">{initials}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role === 'admin' ? 'Administrator' : user.role === 'staff' ? 'Staff' : 'Student'}</span>
              </div>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
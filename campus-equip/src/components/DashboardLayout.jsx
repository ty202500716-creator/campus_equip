import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { getUser } from '../api.js'

export default function DashboardLayout({ role }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/borrower'} replace />

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="dashboard-shell">
      <header className="site-header dashboard-header">
        <div className="brand-block">
          <div className="logo-badge">WMSU</div>
          <div>
            <h1>Western Mindanao State University</h1>
            <p>A Smart Research University by 2040</p>
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
                <span>{user.role === 'admin' ? 'Administrator' : 'Borrower'}</span>
              </div>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

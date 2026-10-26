import { NavLink, useNavigate } from 'react-router-dom'

const links = {
  borrower: [
    ['/borrower', 'Borrowing Request', true],
    ['/borrower/catalog', 'Browse Equipment'],
    ['/borrower/requests', 'My Requests'],
    ['/borrower/notifications', 'Notifications'],
  ],
  admin: [
    ['/admin', 'Dashboard', true],
    ['/admin/requests', 'Request Management'],
    ['/admin/equipment', 'Equipment Management'],
    ['/admin/loans', 'Loan Monitor'],
  ],
}

export default function Sidebar({ role }) {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">C</div>
        <span>CampusEquip</span>
      </div>
      <ul className="nav">
        <li><NavLink to="/">Landing Page</NavLink></li>
        {links[role].map(([to, label, end]) => (
          <li key={to}><NavLink to={to} end={end}>{label}</NavLink></li>
        ))}
      </ul>
      <button type="button" className="logout" onClick={logout}>Logout</button>
    </aside>
  )
}

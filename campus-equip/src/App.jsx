import { Link, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import BorrowerDashboard from './pages/borrower/BorrowerDashboard.jsx'
import EquipmentCatalog from './pages/borrower/EquipmentCatalog.jsx'
import EquipmentDetails from './pages/borrower/EquipmentDetails.jsx'
import MyRequests from './pages/borrower/MyRequests.jsx'
import Notifications from './pages/borrower/Notifications.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import RequestManagement from './pages/admin/RequestManagement.jsx'
import EquipmentManagement from './pages/admin/EquipmentManagement.jsx'
import LoanMonitor from './pages/admin/LoanMonitor.jsx'

const featureCards = [
  { title: 'Smart Request Flow', text: 'Track borrowing requests from approval to pickup with one clear student-friendly workflow.' },
  { title: 'Equipment Visibility', text: 'Browse available laptops, projectors, cameras, and lab gear before submitting a request.' },
  { title: 'Campus Ready', text: 'Built for WMSU students, faculty, and staff who need reliable equipment access on schedule.' },
]

const statCards = [
  { label: 'Available Units', value: '184', note: '+12 this week' },
  { label: 'Active Requests', value: '39', note: '8 pending review' },
  { label: 'On-time Return', value: '96%', note: 'Across all rooms' },
]

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand-block">
          <div className="logo-badge">WMSU</div>
          <div>
            <h1>Western Mindanao State University</h1>
            <p>A Smart Research University by 2040</p>
          </div>
        </div>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#impact">Impact</a>
          <Link to="/login" className="nav-cta" style={{ textDecoration: 'none' }}>Login</Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Campus Equipment Lending System</p>
            <h2>Borrow the tools you need to learn, create, and lead.</h2>
            <p className="subcopy">
              CampusEquip makes it easy for students, faculty, and staff to request resources quickly,
              track borrowing dates, and manage equipment use across the university.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="primary-btn" style={{ textDecoration: 'none' }}>Get started</Link>
              <Link to="/register" className="secondary-btn" style={{ textDecoration: 'none' }}>Create account</Link>
            </div>
            <ul className="hero-badges" aria-label="Highlights">
              <li>Fast approval</li>
              <li>Real-time availability</li>
              <li>Campus-wide access</li>
            </ul>
          </div>
          <div className="hero-panel" aria-label="System overview">
            <div className="panel-card primary-card">
              <span className="panel-label">Equipment status</span>
              <strong>184 devices</strong>
              <small>Available for student use</small>
            </div>
            <div className="mini-grid">
              <div className="panel-card"><span className="panel-label">Requests</span><strong>39</strong><small>Pending review</small></div>
              <div className="panel-card accent"><span className="panel-label">Returns</span><strong>96%</strong><small>On-time record</small></div>
            </div>
          </div>
        </section>

        <section id="services" className="feature-section">
          <div className="section-heading">
            <p className="eyebrow">Why CampusEquip</p>
            <h3>Everything your academic community needs in one place.</h3>
          </div>
          <div className="feature-grid">
            {featureCards.map((c) => (
              <article className="feature-card" key={c.title}>
                <div className="feature-icon" aria-hidden="true">▣</div>
                <h4>{c.title}</h4>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="impact" className="stats-section">
          {statCards.map((s) => (
            <div className="stat-card" key={s.label}>
              <span>{s.label}</span><strong>{s.value}</strong><small>{s.note}</small>
            </div>
          ))}
        </section>

        <section id="about" className="cta-section">
          <div>
            <p className="eyebrow">Built for WMSU</p>
            <h3>Supporter of learning, research, and digital access across campus.</h3>
          </div>
          <Link to="/login" className="primary-btn" style={{ textDecoration: 'none' }}>Get started</Link>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/borrower" element={<DashboardLayout role="borrower" />}>
        <Route index element={<BorrowerDashboard />} />
        <Route path="catalog" element={<EquipmentCatalog />} />
        <Route path="catalog/:id" element={<EquipmentDetails />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/admin" element={<DashboardLayout role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<RequestManagement />} />
        <Route path="equipment" element={<EquipmentManagement />} />
        <Route path="loans" element={<LoanMonitor />} />
      </Route>
    </Routes>
  )
}

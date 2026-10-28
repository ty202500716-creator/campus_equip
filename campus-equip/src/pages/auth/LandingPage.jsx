import { Link } from 'react-router-dom'
import { useApi } from '../../api.js'
import EquipmentImage from '../../components/EquipmentImage.jsx'
import seal from '../../assets/wmsu-seal.png'
import './landing.css'

const FEATURED_TAGS = ['AV-PRJ-001', 'CP-LAP-001', 'AV-MIC-001', 'SP-BAS-001']

const STEPS = [
  ['01', 'Browse Equipment', 'Find the equipment you need for school.'],
  ['02', 'Submit a Request', 'Select the equipment, quantity, and dates you need.'],
  ['03', 'Wait for Approval', 'The administrator reviews your request.'],
  ['04', 'Return Equipment', 'Return borrowed equipment on or before the due date.'],
]

export default function LandingPage() {
  const { data: list, error } = useApi('/api/equipment')

  const featured = FEATURED_TAGS.map((t) => list.find((i) => i.asset_tag === t)).filter(Boolean)
  const cards = featured.length ? featured : list.slice(0, 4)

  return (
    <div className="lp" id="top">
      <header className="lp-header">
        <div className="lp-brand">
          <img className="lp-seal" src={seal} alt="Western Mindanao State University seal" />
          <div>
            <h1>Campus Equipment Borrowing System</h1>
            <p>Western Mindanao State University</p>
          </div>
        </div>
        <nav className="lp-nav" aria-label="Main navigation">
          <a href="#top">Home</a>
          <a href="#equipment">Equipment</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
          <Link to="/login" className="lp-btn lp-btn--light-outline">Login</Link>
          <Link to="/register" className="lp-btn lp-btn--light">Register</Link>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero__content">
            <p className="lp-eyebrow lp-eyebrow--light">Campus equipment made simple</p>
            <h2>Campus Equipment Borrowing System</h2>
            <p className="lp-hero__text">
              Easily find and borrow campus equipment for your classes, projects, and school activities.
              Request equipment, track due dates, and return items on time, all in one place.
            </p>
            <div className="lp-hero__actions">
              <Link to="/register" className="lp-btn lp-btn--light">Get Started</Link>
              <Link to="/login" className="lp-btn lp-btn--light-outline">Log in</Link>
            </div>
          </div>
        </section>

        <section className="lp-section" id="equipment">
          <div className="lp-heading">
            <div>
              <p className="lp-eyebrow">Our inventory</p>
              <h3>Featured Equipment</h3>
              <p className="lp-muted">Check the equipment available for borrowing.</p>
            </div>
            <Link to="/login" className="lp-link">Log in to browse all equipment →</Link>
          </div>

          {error && (
            <p className="lp-note">The equipment list is unavailable right now. Please try again later.</p>
          )}
          <div className="lp-grid">
            {cards.map((i) => (
              <article className="lp-card" key={i.equipment_id}>
                <div className="lp-card__photo"><EquipmentImage item={i} /></div>
                <div className="lp-card__body">
                  <div className="lp-card__title">
                    <h4>{i.name}</h4>
                    <span className={`lp-status lp-status--${i.condition.toLowerCase()}`}>{i.condition}</span>
                  </div>
                  <p className="lp-muted">{i.category}{i.brand ? ` · ${i.brand}` : ''}</p>
                  <p className="lp-card__avail">
                    {i.available === 0 ? 'Unavailable' : `${i.available} available`}
                  </p>
                  <Link to="/login" className="lp-btn lp-btn--red lp-btn--block">Log in to borrow</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-section--tint" id="how">
          <div className="lp-heading">
            <div>
              <p className="lp-eyebrow">About the system</p>
              <h3>How It Works</h3>
            </div>
          </div>
          <div className="lp-steps">
            {STEPS.map(([n, title, text]) => (
              <article className="lp-step" key={n}>
                <span className="lp-step__n">{n}</span>
                <h4>{title}</h4>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-about" id="about">
          <div>
            <p className="lp-eyebrow">Campus Equipment Borrowing System</p>
            <h3>Equipment access made easier.</h3>
          </div>
          <p>
            This system helps WMSU students browse campus equipment, check its condition and location,
            see how many units are available, and submit borrowing requests for approval.
          </p>
        </section>
      </main>

      <footer className="lp-footer">
        <p>© 2026 Campus Equipment Borrowing System · Western Mindanao State University</p>
      </footer>
    </div>
  )
}
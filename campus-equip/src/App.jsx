import React, { use, useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:5000'
const MAX_QTY = 10

const iconMap = {
  cap: 'i-cap',
  home: 'i-home',
  search: 'i-search',
  clipboard: 'i-clipboard',
  box: 'i-box',
  bell: 'i-bell',
  user: 'i-user',
  logout: 'i-logout',
  phone: 'i-phone',
  mail: 'i-mail',
  chev: 'i-chev',
  up: 'i-up',
  down: 'i-down',
  globe: 'i-globe',
}

const featureCards = [
  {
    title: 'Smart Request Flow',
    text: 'Track borrowing requests from approval to pickup with one clear student-friendly workflow.',
  },
  {
    title: 'Equipment Visibility',
    text: 'Browse available laptops, projectors, cameras, and lab gear before submitting a request.',
  },
  {
    title: 'Campus Ready',
    text: 'Built for WMSU students, faculty, and staff who need reliable equipment access on schedule.',
  },
]

const statCards = [
  { label: 'Available Units', value: '184', note: '+12 this week' },
  { label: 'Active Requests', value: '39', note: '8 pending review' },
  { label: 'On-time Return', value: '96%', note: 'Across all rooms' },
]

// Local date (YYYY-MM-DD). toISOString() uses UTC, which gives the wrong day in Manila before 8am.
const getIsoDate = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

function App() {
  const today = new Date()
  const todayIso = getIsoDate(today)
  const plusTwo = new Date(today)
  plusTwo.setDate(plusTwo.getDate() + 2)

  const [equipmentList, setEquipmentList] = useState([])
  const [equipment, setEquipment] = useState('')
  const [qty, setQty] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [borrowDate, setBorrowDate] = useState(todayIso)
  const [returnDate, setReturnDate] = useState(getIsoDate(plusTwo))
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const loadEquipment = () =>
    fetch(`${API}/api/equipment`)
      .then((res) => res.json())
      .then(setEquipmentList)
      .catch(() => showToast('Cannot reach the server.'))

  useEffect(() => {
    loadEquipment()
  }, [])

  const selected = equipmentList.find((item) => String(item.equipment_id) === equipment)
  const maxQty = Math.min(MAX_QTY, selected ? selected.available : MAX_QTY)

  const handleQtyChange = (value) => {
    const next = Math.min(maxQty, Math.max(1, Number.isFinite(value) ? value : 1))
    setQty(next)
    if (errors.qty) {
      setErrors((prev) => ({ ...prev, qty: '' }))
    }
  }

  const handleBorrowDateChange = (value) => {
    setBorrowDate(value)
    if (returnDate < value) {
      setReturnDate(value)
    }
    setErrors((prev) => ({ ...prev, borrowDate: '', returnDate: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {
      equipment: equipment ? '' : 'Please select equipment.',
      qty: qty >= 1 ? '' : 'Enter a quantity of at least 1.',
      purpose: purpose.trim() ? '' : 'Tell us why you need this equipment.',
      borrowDate: borrowDate ? '' : 'Choose a borrowing date.',
      returnDate: !returnDate
        ? 'Choose a return date.'
        : returnDate < borrowDate
          ? 'Return date must be on or after the borrowing date.'
          : '',
    }

    if (!nextErrors.qty && selected && qty > selected.available) {
      nextErrors.qty = `Only ${selected.available} available.`
    }

    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/borrow-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // temporary until login exists
          equipment_id: Number(equipment),
          quantity: Number(qty),
          purpose: purpose.trim(),
          borrow_date: borrowDate,
          due_date: returnDate,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Request failed.')
        return
      }

      showToast(`Request submitted: ${qty} × ${selected ? selected.name : 'item'}.`)
      setEquipment('')
      setQty(1)
      setPurpose('')
      loadEquipment()
    } catch {
      showToast('Cannot reach the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {Object.entries(iconMap).map(([name, id]) => (
            <symbol id={id} viewBox="0 0 24 24" key={id}>
              {name === 'cap' && (
                <>
                  <path d="M2 9l10-5 10 5-10 5z" />
                  <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
                </>
              )}
              {name === 'home' && (
                <>
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h5v-6h4v6h5V10" />
                </>
              )}
              {name === 'search' && (
                <>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" />
                </>
              )}
              {name === 'clipboard' && (
                <>
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <path d="M9 4h6v3H9z" />
                  <path d="M9 12h6M9 16h6" />
                </>
              )}
              {name === 'box' && (
                <>
                  <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                  <path d="M3 7l9 4 9-4M12 11v10" />
                </>
              )}
              {name === 'bell' && (
                <>
                  <path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z" />
                  <path d="M10 21h4" />
                </>
              )}
              {name === 'user' && (
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </>
              )}
              {name === 'logout' && (
                <>
                  <path d="M9 4H5v16h4" />
                  <path d="M16 8l4 4-4 4M20 12H9" />
                </>
              )}
              {name === 'phone' && (
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
              )}
              {name === 'mail' && (
                <>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </>
              )}
              {name === 'chev' && <path d="M6 9l6 6 6-6" />}
              {name === 'up' && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14l4-4 4 4" />
                </>
              )}
              {name === 'down' && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 10l4 4 4-4" />
                </>
              )}
              {name === 'globe' && (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                </>
              )}
            </symbol>
          ))}
        </defs>
      </svg>

      {screen === 'landing' ? (
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
              <button type="button" className="nav-cta" onClick={() => setScreen('dashboard')}>
                Dashboards
              </button>
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
                  <button type="button" className="primary-btn" onClick={() => setScreen('dashboard')}>
                    Dashboards
                  </button>
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
                  <div className="panel-card">
                    <span className="panel-label">Requests</span>
                    <strong>39</strong>
                    <small>Pending review</small>
                  </div>
                  <div className="panel-card accent">
                    <span className="panel-label">Returns</span>
                    <strong>96%</strong>
                    <small>On-time record</small>
                  </div>
                </div>
              </div>
            </section>

            <section id="services" className="feature-section">
              <div className="section-heading">
                <p className="eyebrow">Why CampusEquip</p>
                <h3>Everything your academic community needs in one place.</h3>
              </div>

              <div className="feature-grid">
                {featureCards.map((card) => (
                  <article className="feature-card" key={card.title}>
                    <div className="feature-icon" aria-hidden="true">
                      <svg className="icon" aria-hidden="true"><use href="#i-box" /></svg>
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="impact" className="stats-section">
              {statCards.map((item) => (
                <div className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </div>
              ))}
            </section>

            <section id="about" className="cta-section">
              <div>
                <p className="eyebrow">Built for WMSU</p>
                <h3>Supporter of learning, research, and digital access across campus.</h3>
              </div>
              <button type="button" className="primary-btn" onClick={() => setScreen('dashboard')}>
                Dashboards
              </button>
            </section>
          </main>
        </div>
      ) : (
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
            <aside className="sidebar">
              <div className="brand">
                <div className="brand-logo">
                  <svg className="icon" aria-hidden="true"><use href="#i-cap" /></svg>
                </div>
                <span>CampusEquip</span>
              </div>
              <ul className="nav">
                <li>
                  <button type="button" className="nav-button" onClick={() => setScreen('landing')}>
                    <svg className="icon" aria-hidden="true"><use href="#i-home" /></svg>
                    <span>Landing Page</span>
                  </button>
                </li>
                <li><a href="#" className="active" aria-current="page"><svg className="icon" aria-hidden="true"><use href="#i-clipboard" /></svg><span>Borrowing Request</span></a></li>
                <li><a href="#"><svg className="icon" aria-hidden="true"><use href="#i-search" /></svg><span>Browse Equipment</span></a></li>
                <li><a href="#"><svg className="icon" aria-hidden="true"><use href="#i-box" /></svg><span>Borrowed Equipment</span></a></li>
                <li><a href="#"><svg className="icon" aria-hidden="true"><use href="#i-bell" /></svg><span>Notifications</span></a></li>
                <li><a href="#"><svg className="icon" aria-hidden="true"><use href="#i-user" /></svg><span>Profile</span></a></li>
              </ul>
              <a href="#" className="logout"><svg className="icon" aria-hidden="true"><use href="#i-logout" /></svg><span>Logout</span></a>
            </aside>

            <main className="main">
              <div className="topbar">
                <div className="user">
                  <div className="avatar" aria-hidden="true">JD</div>
                  <div>
                    <strong>Juan Dela Cruz</strong>
                    <span>Student</span>
                  </div>
                </div>
              </div>

              <section className="summary-strip" aria-label="Dashboard summary">
                {statCards.map((item) => (
                  <div className="mini-stat" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </section>

              <section className="card">
                <div className="card-heading-row">
                  <h2>Borrowing Request</h2>
                  <button type="button" className="ghost-btn" onClick={() => setScreen('landing')}>
                    Back to Landing
                  </button>
                </div>

            <form id="requestForm" noValidate onSubmit={handleSubmit}>
              <div className="row">
                <div className="field">
                  <label htmlFor="equipment">Select Equipment</label>
                  <select
                    id="equipment"
                    className={`control ${errors.equipment ? 'invalid' : ''}`}
                    value={equipment}
                    onChange={(event) => {
                      setEquipment(event.target.value)
                      setQty(1)
                      setErrors((prev) => ({ ...prev, equipment: '' }))
                    }}
                  >
                    <option value="">Select equipment</option>
                    {equipmentList.map((item) => (
                      <option key={item.equipment_id} value={item.equipment_id}>
                        {item.name} ({item.available} available)
                      </option>
                    ))}
                  </select>
                  <div className="error" id="equipmentError">{errors.equipment || ''}</div>
                </div>

                <div className="field">
                  <label htmlFor="qty">Quantity</label>
                  <div className={`stepper ${errors.qty ? 'invalid' : ''}`} id="stepper">
                    <button
                      type="button"
                      id="minus"
                      aria-label="Decrease quantity"
                      onClick={() => handleQtyChange(Number(qty) - 1)}
                    >
                      −
                    </button>
                    <input
                      id="qty"
                      type="number"
                      min="1"
                      max={maxQty}
                      value={qty}
                      onChange={(event) => handleQtyChange(Number(event.target.value))}
                      className={errors.qty ? 'invalid' : ''}
                    />
                    <button
                      type="button"
                      id="plus"
                      aria-label="Increase quantity"
                      onClick={() => handleQtyChange(Number(qty) + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="error" id="qtyError">{errors.qty || ''}</div>
                </div>
              </div>

                  <div className="field full">
                    <label htmlFor="purpose">Purpose of Borrowing</label>
                    <textarea
                      id="purpose"
                      className={`control ${errors.purpose ? 'invalid' : ''}`}
                      placeholder="Enter purpose..."
                      value={purpose}
                      onChange={(event) => {
                        setPurpose(event.target.value)
                        if (errors.purpose) {
                          setErrors((prev) => ({ ...prev, purpose: '' }))
                        }
                      }}
                    />
                    <div className="error" id="purposeError">{errors.purpose || ''}</div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label htmlFor="borrowDate">Borrowing Date</label>
                      <input
                        id="borrowDate"
                        type="date"
                        className={`control ${errors.borrowDate ? 'invalid' : ''}`}
                        value={borrowDate}
                        min={todayIso}
                        onChange={(event) => handleBorrowDateChange(event.target.value)}
                      />
                      <div className="error" id="borrowError">{errors.borrowDate || ''}</div>
                    </div>

                    <div className="field">
                      <label htmlFor="returnDate">Return Date</label>
                      <input
                        id="returnDate"
                        type="date"
                        className={`control ${errors.returnDate ? 'invalid' : ''}`}
                        value={returnDate}
                        min={borrowDate || todayIso}
                        onChange={(event) => {
                          setReturnDate(event.target.value)
                          setErrors((prev) => ({ ...prev, returnDate: '' }))
                        }}
                      />
                      <div className="error" id="returnError">{errors.returnDate || ''}</div>
                    </div>
                  </div>

              <button type="submit" className="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <div className={`toast ${toast ? 'show' : ''}`} id="toast" role="status">
                {toast}
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  )
}

export default App

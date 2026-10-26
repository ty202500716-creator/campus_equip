import { useEffect, useState } from 'react'
import './App.css'
import './adminDashboard.css'

const BASE = 'http://localhost:5000'

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const emptyForm = { name: '', category: '', condition: 'good', quantity: 1 }
const FILTERS = ['all', 'pending', 'approved', 'overdue', 'returned', 'rejected']

function RequestCard({ r, onAct, busy }) {
  return (
    <div className="req">
      <div className="req-top">
        <strong>{r.equipment_name} × {r.quantity}</strong>
        <span className={`badge ${r.status}`}>{r.status}</span>
      </div>
      <div className="req-meta">
        {r.user_name} ({r.user_role}){r.contact_number ? ` · ${r.contact_number}` : ''}
      </div>
      <div className="req-meta">
        Borrow {r.borrow_date} → Due {r.due_date}
        {r.return_date ? ` · Returned ${r.return_date}` : ''}
      </div>
      <p className="req-purpose">{r.purpose}</p>
      <div className="req-actions">
        {r.status === 'pending' && (
          <>
            <button className="btn ok" disabled={busy}
              onClick={() => onAct(r.request_id, 'approve', 'Request approved.')}>
              Approve
            </button>
            <button className="btn danger" disabled={busy}
              onClick={() => onAct(r.request_id, 'reject', 'Request rejected.')}>
              Reject
            </button>
          </>
        )}
        {(r.status === 'approved' || r.status === 'overdue') && (
          <button className="btn" disabled={busy}
            onClick={() => onAct(r.request_id, 'return', 'Marked as returned.')}>
            Mark Returned
          </button>
        )}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [view, setView] = useState('overview')
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const [equipment, setEquipment] = useState([])
  const [filter, setFilter] = useState('pending')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const showError = (err) =>
    showToast(err.message === 'Failed to fetch' ? 'Cannot reach the server.' : err.message)

  const loadAll = async () => {
    try {
      const [s, r, e] = await Promise.all([
        api('/api/admin/stats'),
        api('/api/admin/requests'),
        api('/api/equipment'),
      ])
      setStats(s)
      setRequests(r)
      setEquipment(e)
    } catch (err) {
      showError(err)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const act = async (id, action, okMessage) => {
    setBusy(true)
    try {
      await api(`/api/admin/requests/${id}/${action}`, { method: 'PATCH' })
      showToast(okMessage)
      await loadAll()
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const saveEquipment = async (event) => {
    event.preventDefault()
    const quantity = Number(form.quantity)
    if (!form.name.trim() || !form.category.trim()) {
      setFormError('Name and category are required.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError('Quantity must be a whole number, 0 or more.')
      return
    }
    setFormError('')
    setBusy(true)
    try {
      const body = JSON.stringify({
        name: form.name.trim(),
        category: form.category.trim(),
        condition: form.condition,
        quantity,
      })
      if (editingId) {
        await api(`/api/admin/equipment/${editingId}`, { method: 'PUT', body })
        showToast('Equipment updated.')
      } else {
        await api('/api/admin/equipment', { method: 'POST', body })
        showToast('Equipment added.')
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadAll()
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.equipment_id)
    setForm({
      name: item.name,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
    })
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  const removeEquipment = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setBusy(true)
    try {
      await api(`/api/admin/equipment/${item.equipment_id}`, { method: 'DELETE' })
      showToast('Equipment deleted.')
      await loadAll()
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const navItem = (key, label) => (
    <li key={key}>
      <a
        href="#"
        className={view === key ? 'active' : ''}
        aria-current={view === key ? 'page' : undefined}
        onClick={(event) => {
          event.preventDefault()
          setView(key)
        }}
      >
        <span>{label}</span>
      </a>
    </li>
  )

  const pending = requests.filter((r) => r.status === 'pending')
  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const statCards = stats && [
    ['Equipment Items', stats.total_equipment],
    ['Units Available', stats.available_units],
    ['Pending Requests', stats.pending],
    ['Currently Borrowed', stats.borrowed],
    ['Overdue', stats.overdue, true],
    ['Registered Users', stats.total_users],
  ]

  return (
    <>
      <header className="site-header">
        <div className="brand-block">
          <img src="/wmsu_logo.png" alt="Western Mindanao State University seal" width="78" height="74" />
          <div>
            <h1>Western Mindanao State University</h1>
            <p>A Smart Research University by 2040</p>
          </div>
        </div>
      </header>

      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">CE</div>
            <span>CampusEquip</span>
          </div>
          <ul className="nav">
            {navItem('overview', 'Dashboard')}
            {navItem('requests', 'Requests')}
            {navItem('equipment', 'Equipment')}
            <li><a href="/"><span>Student View</span></a></li>
          </ul>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="user">
              <div className="avatar" aria-hidden="true">AD</div>
              <div>
                <strong>Administrator</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>

          {view === 'overview' && (
            <section className="card">
              <h2>Dashboard</h2>
              <div className="stats">
                {statCards
                  ? statCards.map(([label, value, warn]) => (
                      <div className={`stat ${warn && value > 0 ? 'warn' : ''}`} key={label}>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))
                  : <p className="muted">Loading...</p>}
              </div>

              <h3 className="section-title">Pending Requests</h3>
              {pending.length === 0 && <p className="muted">No pending requests.</p>}
              {pending.slice(0, 5).map((r) => (
                <RequestCard key={r.request_id} r={r} onAct={act} busy={busy} />
              ))}
              {pending.length > 5 && (
                <button className="btn" onClick={() => { setFilter('pending'); setView('requests') }}>
                  View all {pending.length} pending
                </button>
              )}
            </section>
          )}

          {view === 'requests' && (
            <section className="card">
              <h2>Borrowing Requests</h2>
              <div className="chips">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={filter === f ? 'chip on' : 'chip'}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <p className="muted">No {filter} requests.</p>}
              {filtered.map((r) => (
                <RequestCard key={r.request_id} r={r} onAct={act} busy={busy} />
              ))}
            </section>
          )}

          {view === 'equipment' && (
            <section className="card">
              <h2>{editingId ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <form noValidate onSubmit={saveEquipment}>
                <div className="row">
                  <div className="field">
                    <label htmlFor="eqName">Name</label>
                    <input id="eqName" className="control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="eqCat">Category</label>
                    <input id="eqCat" className="control" value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label htmlFor="eqCond">Condition</label>
                    <select id="eqCond" className="control" value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="eqQty">Total Quantity</label>
                    <input id="eqQty" type="number" min="0" className="control" value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                </div>
                <div className="error">{formError}</div>
                <button type="submit" className="submit" disabled={busy}>
                  {editingId ? 'Save Changes' : 'Add Equipment'}
                </button>
                {editingId && (
                  <button type="button" className="btn cancel" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </form>

              <h3 className="section-title">All Equipment</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Available</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.equipment_id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.condition}</td>
                        <td>{item.available} / {item.quantity}</td>
                        <td className="actions">
                          <button className="btn" onClick={() => startEdit(item)}>Edit</button>
                          <button className="btn danger" disabled={busy}
                            onClick={() => removeEquipment(item)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {equipment.length === 0 && (
                      <tr><td colSpan="5" className="muted">No equipment yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
        </main>
      </div>
    </>
  )
}

export default AdminDashboard
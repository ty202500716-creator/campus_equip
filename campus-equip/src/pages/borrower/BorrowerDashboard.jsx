import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, getUser, useApi } from '../../api.js'
import EquipmentImage from '../../components/EquipmentImage.jsx'
import './borrower.css'

const MAX_QTY = 10
const MAX_LOAN_DAYS = 14 // same as system_settings.max_loan_days in the database
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export default function BorrowerDashboard() {
  const user = getUser()
  const today = new Date()
  const plusTwo = new Date(today.getTime() + 2 * 86400000)
  const { data: list, reload } = useApi('/api/equipment')
  const { data: mine, reload: reloadMine } = useApi(`/api/borrow-requests?user_id=${user.user_id}`)
  const [params] = useSearchParams()

  // "Request this equipment" on the details page opens this form with the item already selected
  const [equipment, setEquipment] = useState(params.get('equipment') || '')
  const [qty, setQty] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [borrowDate, setBorrowDate] = useState(iso(today))
  const [returnDate, setReturnDate] = useState(iso(plusTwo))
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = list.find((i) => String(i.equipment_id) === equipment)
  const maxQty = Math.min(MAX_QTY, selected ? selected.available : MAX_QTY)
  const maxReturn = borrowDate
    ? iso(new Date(new Date(borrowDate).getTime() + MAX_LOAN_DAYS * 86400000))
    : ''
  const changeQty = (v) => setQty(Math.min(maxQty, Math.max(1, Number.isFinite(v) ? v : 1)))

  const submit = async (e) => {
    e.preventDefault()
    const err = {
      equipment: equipment ? '' : 'Please select equipment.',
      purpose: purpose.trim() ? '' : 'Tell us why you need this equipment.',
      returnDate:
        returnDate < borrowDate
          ? 'Return date must be on or after the borrowing date.'
          : maxReturn && returnDate > maxReturn
            ? `You can borrow for up to ${MAX_LOAN_DAYS} days.`
            : '',
    }
    setErrors(err)
    if (Object.values(err).some(Boolean)) return

    setBusy(true)
    try {
      await api('/api/borrow-requests', {
        method: 'POST',
        body: {
          user_id: user.user_id,
          equipment_id: Number(equipment),
          quantity: Number(qty),
          purpose: purpose.trim(),
          start_date: borrowDate,
          due_date: returnDate,
        },
      })
      setToast(`Request submitted: ${qty} × ${selected.name}. Wait for the administrator's approval.`)
      setEquipment(''); setQty(1); setPurpose('')
      reload(); reloadMine()
    } catch (e2) {
      setToast(e2.message)
    } finally {
      setBusy(false)
    }
  }

  const count = (s) => mine.filter((r) => r.status === s).length

  return (
    <>
      <section className="summary-strip">
        <div className="mini-stat"><span>Pending</span><strong>{count('pending')}</strong></div>
        <div className="mini-stat"><span>Approved</span><strong>{count('approved')}</strong></div>
        <div className="mini-stat"><span>Returned</span><strong>{count('returned')}</strong></div>
      </section>

      <section className="card">
        <div className="card-heading-row"><h2>Borrowing Request</h2></div>
        <form noValidate onSubmit={submit}>
          {selected && (
            <div className="eq-preview">
              <div className="eq-preview__photo"><EquipmentImage key={selected.equipment_id} item={selected} /></div>
              <div>
                <strong>{selected.name}</strong>
                <p>{selected.category} · {selected.location || 'Property Office'}</p>
                <p>{selected.available} of {selected.quantity} available</p>
              </div>
            </div>
          )}
          <div className="row">
            <div className="field">
              <label htmlFor="equipment">Select Equipment</label>
              <select id="equipment" className={`control ${errors.equipment ? 'invalid' : ''}`} value={equipment}
                onChange={(e) => { setEquipment(e.target.value); setQty(1) }}>
                <option value="">Select equipment</option>
                {list.map((i) => (
                  <option key={i.equipment_id} value={i.equipment_id} disabled={i.available === 0}>
                    {i.name} ({i.available} available)
                  </option>
                ))}
              </select>
              <div className="error">{errors.equipment}</div>
            </div>
            <div className="field">
              <label htmlFor="qty">Quantity</label>
              <div className="stepper">
                <button type="button" aria-label="Decrease quantity" onClick={() => changeQty(qty - 1)}>−</button>
                <input id="qty" type="number" min="1" max={maxQty} value={qty} onChange={(e) => changeQty(Number(e.target.value))} />
                <button type="button" aria-label="Increase quantity" onClick={() => changeQty(qty + 1)}>+</button>
              </div>
            </div>
          </div>
          <div className="field full">
            <label htmlFor="purpose">Purpose of Borrowing</label>
            <textarea id="purpose" className={`control ${errors.purpose ? 'invalid' : ''}`} placeholder="Enter purpose..."
              value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <div className="error">{errors.purpose}</div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="borrowDate">Borrowing Date</label>
              <input id="borrowDate" type="date" className="control" min={iso(today)} value={borrowDate}
                onChange={(e) => { setBorrowDate(e.target.value); if (returnDate < e.target.value) setReturnDate(e.target.value) }} />
            </div>
            <div className="field">
              <label htmlFor="returnDate">Return Date</label>
              <input id="returnDate" type="date" className={`control ${errors.returnDate ? 'invalid' : ''}`} min={borrowDate} max={maxReturn}
                value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              <div className="error">{errors.returnDate}</div>
            </div>
          </div>
          <button type="submit" className="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit Request'}</button>
          <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
        </form>
      </section>
    </>
  )
}
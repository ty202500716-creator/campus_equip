import { useState } from 'react'
import { api, useApi } from '../../api.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function RequestManagement() {
  const { data, reload, error } = useApi('/api/borrow-requests')
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  const setStatus = async (id, status) => {
    try {
      await api(`/api/borrow-requests/${id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (e) {
      setMsg(e.message)
    }
  }

  const shown = data.filter((r) => !filter || r.status === filter)

  return (
    <section className="card">
      <div className="card-heading-row"><h2>Request Management</h2></div>
      <div className="toolbar">
        <select className="control" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'approved', 'rejected', 'returned', 'overdue'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="error">{error || msg}</div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Borrower</th><th>Equipment</th><th>Qty</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.request_id}>
                <td>{r.user_name}</td><td>{r.equipment_name}</td><td>{r.quantity}</td>
                <td>{r.due_date?.slice(0, 10)}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {r.status === 'pending' && (<>
                    <button className="btn-sm" onClick={() => setStatus(r.request_id, 'approved')}>Approve</button>
                    <button className="btn-sm danger" onClick={() => setStatus(r.request_id, 'rejected')}>Reject</button>
                  </>)}
                  {(r.status === 'approved' || r.status === 'overdue') && (
                    <button className="btn-sm" onClick={() => setStatus(r.request_id, 'returned')}>Mark returned</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="empty">No requests found.</p>}
      </div>
    </section>
  )
}

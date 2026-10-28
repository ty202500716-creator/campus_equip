import { useState } from 'react'
import { api, getUser, useApi } from '../../api.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function MyRequests() {
  const user = getUser()
  const { data, reload, error } = useApi(`/api/borrow-requests?user_id=${user.user_id}`)
  const [msg, setMsg] = useState('')

  const cancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return
    try {
      await api(`/api/borrow-requests/${id}`, { method: 'PATCH', body: { status: 'cancelled', user_id: user.user_id } })
      setMsg('Request cancelled.')
      reload()
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <section className="card">
      <div className="card-heading-row"><h2>My Requests</h2></div>
      <div className="error">{error || msg}</div>
      {data.length === 0 ? <p className="empty">You have no requests yet. Submit one from Borrowing Request.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Equipment</th><th>Qty</th><th>Borrow date</th><th>Due date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.request_id}>
                  <td>{r.equipment_name}</td><td>{r.quantity}</td>
                  <td>{r.borrow_date?.slice(0, 10) || '—'}</td><td>{r.due_date?.slice(0, 10)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'pending' && (
                      <button type="button" className="btn-sm danger" onClick={() => cancel(r.request_id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
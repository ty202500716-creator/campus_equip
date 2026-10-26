import { getUser, useApi } from '../../api.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function MyRequests() {
  const { data } = useApi(`/api/borrow-requests?user_id=${getUser().user_id}`)

  return (
    <section className="card">
      <div className="card-heading-row"><h2>My Requests</h2></div>
      {data.length === 0 ? <p className="empty">You have no requests yet. Submit one from Borrowing Request.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Equipment</th><th>Qty</th><th>Borrow date</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.request_id}>
                  <td>{r.equipment_name}</td><td>{r.quantity}</td>
                  <td>{r.borrow_date?.slice(0, 10)}</td><td>{r.due_date?.slice(0, 10)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

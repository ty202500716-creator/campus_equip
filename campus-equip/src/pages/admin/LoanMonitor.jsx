import { useApi } from '../../api.js'
import StatusBadge from '../../components/StatusBadge.jsx'

const today = new Date().toISOString().slice(0, 10)

export default function LoanMonitor() {
  const { data } = useApi('/api/borrow-requests')
  const loans = data
    .filter((r) => r.status === 'approved' || r.status === 'overdue')
    .map((r) => ({ ...r, late: r.status === 'overdue' || r.due_date.slice(0, 10) < today }))

  return (
    <section className="card">
      <div className="card-heading-row"><h2>Loan Monitor</h2></div>
      {loans.length === 0 ? <p className="empty">No active loans.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Borrower</th><th>Equipment</th><th>Qty</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>
              {loans.map((r) => (
                <tr key={r.request_id}>
                  <td>{r.user_name}</td><td>{r.equipment_name}</td><td>{r.quantity}</td>
                  <td>{r.due_date.slice(0, 10)}</td>
                  <td><StatusBadge status={r.late ? 'overdue' : 'approved'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

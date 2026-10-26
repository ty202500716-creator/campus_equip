import { useApi } from '../../api.js'

const today = new Date().toISOString().slice(0, 10)

export default function AdminDashboard() {
  const { data: equipment } = useApi('/api/equipment')
  const { data: requests } = useApi('/api/borrow-requests')

  const available = equipment.reduce((sum, i) => sum + i.available, 0)
  const pending = requests.filter((r) => r.status === 'pending').length
  const overdue = requests.filter((r) => r.status === 'overdue' || (r.status === 'approved' && r.due_date.slice(0, 10) < today)).length

  return (
    <>
      <section className="summary-strip">
        <div className="mini-stat"><span>Available Units</span><strong>{available}</strong></div>
        <div className="mini-stat"><span>Pending Requests</span><strong>{pending}</strong></div>
        <div className="mini-stat"><span>Overdue Loans</span><strong>{overdue}</strong></div>
      </section>
      <section className="card">
        <div className="card-heading-row"><h2>Admin Dashboard</h2></div>
        <p className="empty">{equipment.length} equipment types and {requests.length} requests on record. Use the sidebar to review requests, manage inventory, and monitor loans.</p>
      </section>
    </>
  )
}

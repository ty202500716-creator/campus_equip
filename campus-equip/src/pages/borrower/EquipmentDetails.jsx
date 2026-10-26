import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../api.js'

export default function EquipmentDetails() {
  const { id } = useParams()
  const { data: item, error } = useApi(`/api/equipment/${id}`, null)

  if (error) return <section className="card"><p className="error">{error}</p></section>
  if (!item) return <section className="card"><p className="empty">Loading...</p></section>

  return (
    <section className="card">
      <div className="card-heading-row">
        <h2>{item.name}</h2>
        <Link to="/borrower/catalog" className="ghost-btn" style={{ textDecoration: 'none' }}>Back</Link>
      </div>
      <table className="table">
        <tbody>
          <tr><th>Category</th><td>{item.category}</td></tr>
          <tr><th>Condition</th><td>{item.condition}</td></tr>
          <tr><th>Available</th><td>{item.available} of {item.quantity}</td></tr>
          <tr><th>Description</th><td>{item.description || 'No description.'}</td></tr>
        </tbody>
      </table>
      <Link to="/borrower" className="submit" style={{ display: 'grid', placeItems: 'center', marginTop: 24, textDecoration: 'none' }}>
        Request this equipment
      </Link>
    </section>
  )
}

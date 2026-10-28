import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../api.js'
import EquipmentImage from '../../components/EquipmentImage.jsx'
import './borrower.css'

export default function EquipmentDetails() {
  const { id } = useParams()
  const { data: item, error } = useApi(`/api/equipment/${id}`, null)

  if (error) {
    return (
      <section className="card">
        <p className="error">{error}</p>
        <Link to="/borrower/catalog" className="eq-btn eq-btn--ghost" style={{ display: 'inline-block' }}>Back to equipment</Link>
      </section>
    )
  }
  if (!item) return <section className="card"><p className="empty">Loading...</p></section>

  const out = item.available <= 0

  return (
    <section className="card">
      <div className="card-heading-row">
        <h2>Equipment Details</h2>
        <Link to="/borrower/catalog" className="ghost-btn" style={{ textDecoration: 'none' }}>← Back to equipment</Link>
      </div>

      <div className="eq-details">
        <div className="eq-details__photo"><EquipmentImage key={item.equipment_id} item={item} /></div>
        <div>
          <p className="eq-details__cat">{item.category}</p>
          <h1>{item.name}</h1>
          <p className="eq-details__desc">{item.description || 'No description.'}</p>

          <dl className="eq-specs">
            <div><dt>Brand</dt><dd>{item.brand || '—'}</dd></div>
            <div><dt>Model</dt><dd>{item.model || '—'}</dd></div>
            <div><dt>Asset tag</dt><dd>{item.asset_tag || '—'}</dd></div>
            <div><dt>Location</dt><dd>{item.location || '—'}</dd></div>
            {item.college && <div><dt>College</dt><dd>{item.college}</dd></div>}
            <div><dt>Condition</dt><dd><span className={`eq-status eq-status--${item.condition.toLowerCase()}`}>{item.condition}</span></dd></div>
            <div><dt>Available</dt><dd>{item.available} of {item.quantity}</dd></div>
          </dl>

          <Link to={`/borrower?equipment=${item.equipment_id}`} className={`eq-btn ${out ? 'is-disabled' : ''}`}
            aria-disabled={out}>
            {out ? 'Unavailable' : 'Request this equipment'}
          </Link>
        </div>
      </div>
    </section>
  )
}
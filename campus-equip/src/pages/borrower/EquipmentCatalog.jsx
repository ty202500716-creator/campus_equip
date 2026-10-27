import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../api.js'

export default function EquipmentCatalog() {
  const { data: list } = useApi('/api/equipment')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const cats = [...new Set(list.map((i) => i.category))]
  const shown = list.filter(
    (i) => i.name.toLowerCase().includes(q.toLowerCase()) && (!cat || i.category === cat)
  )

  return (
    <section className="card">
      <div className="card-heading-row"><h2>Browse Equipment</h2></div>
      <div className="toolbar">
        <input className="control" placeholder="Search equipment..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="control" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {shown.length === 0 && <p className="empty">No equipment matches your search.</p>}
      <div className="page-grid">
        {shown.map((i) => (
          <article className="item-card" key={i.equipment_id}>
            <h3>{i.name}</h3>
            <p>{i.category} · {i.condition}</p>
            <p>{i.available} of {i.quantity} available</p>
            <Link to={`/borrower/catalog/${i.equipment_id}`} className="btn-sm" style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none' }}>View details</Link>
          </article>
        ))}
      </div>
    </section>
  )
}

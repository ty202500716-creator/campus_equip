import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../api.js'
import EquipmentImage from '../../components/EquipmentImage.jsx'
import './borrower.css'

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor']
const RANK = { New: 1, Good: 1, Fair: 2, Poor: 3 }

export default function EquipmentCatalog() {
  const { data: list, error } = useApi('/api/equipment')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [sort, setSort] = useState('condition')

  const locations = useMemo(() => [...new Set(list.map((i) => i.location).filter(Boolean))].sort(), [list])
  const categories = useMemo(() => [...new Set(list.map((i) => i.category))].sort(), [list])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    const out = list.filter(
      (i) =>
        (!q ||
          i.name.toLowerCase().includes(q) ||
          (i.brand || '').toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)) &&
        (!location || i.location === location) &&
        (!category || i.category === category) &&
        (!condition || i.condition === condition)
    )
    if (sort === 'name-asc') out.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'name-desc') out.sort((a, b) => b.name.localeCompare(a.name))
    else out.sort((a, b) => (RANK[a.condition] || 4) - (RANK[b.condition] || 4) || a.name.localeCompare(b.name))
    return out
  }, [list, search, location, category, condition, sort])

  const reset = () => { setSearch(''); setLocation(''); setCategory(''); setCondition(''); setSort('condition') }

  return (
    <section className="card">
      <div className="card-heading-row"><h2>Browse Equipment</h2></div>
      {error && <p className="error">{error}</p>}

      <div className="eq-layout">
        <aside className="eq-filters" aria-label="Filters">
          <div className="eq-filters__head">
            <h2>Filters</h2>
            <button type="button" className="eq-link" onClick={reset}>Reset</button>
          </div>
          <div className="eq-group">
            <h3>Location</h3>
            <select className="control" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All locations</option>
              {locations.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="eq-group">
            <h3>Category</h3>
            <select className="control" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="eq-group">
            <h3>Condition</h3>
            <div className="eq-chips">
              {['', ...CONDITIONS].map((c) => (
                <button key={c || 'all'} type="button" className={`eq-chip ${condition === c ? 'is-on' : ''}`}
                  onClick={() => setCondition(c)}>
                  {c || 'All conditions'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="eq-controls">
            <input className="control" type="search" placeholder="Search equipment or brand..."
              aria-label="Search equipment" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="control" aria-label="Sort equipment" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="condition">Condition: best first</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>
          </div>
          <p className="eq-count">Showing {shown.length} of {list.length} equipment item(s)</p>

          {shown.length === 0 ? (
            <p className="empty">No equipment matches your filters. Try changing your search or reset the filters.</p>
          ) : (
            <div className="eq-grid">
              {shown.map((i) => (
                <article className="eq-card" key={i.equipment_id}>
                  <div className="eq-card__photo"><EquipmentImage item={i} /></div>
                  <div className="eq-card__body">
                    <div className="eq-card__title">
                      <h3>{i.name}</h3>
                      <span className={`eq-status eq-status--${i.condition.toLowerCase()}`}>{i.condition}</span>
                    </div>
                    <p className="eq-card__meta">{i.category}</p>
                    <p className="eq-card__meta">Location: {i.location || '—'}</p>
                    <p className={`eq-card__avail ${i.available === 0 ? 'is-out' : ''}`}>
                      {i.available === 0 ? 'Unavailable' : `${i.available} of ${i.quantity} available`}
                    </p>
                    <Link to={`/borrower/catalog/${i.equipment_id}`} className="eq-btn eq-btn--ghost">View details</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
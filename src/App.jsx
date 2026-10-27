import React, { useMemo, useState } from 'react';
import { equipment, categories, featuredIds, categoryOptions, locationOptions, accountMessage } from './equipment.js';

function Header({ active = 'Home' }) {
  return (
    <header className="site-header">
      <a href="/" className="logo">CampusEquip</a>
      <nav className="main-nav">
        <a className={active === 'Home' ? 'active' : ''} href="/">Home</a>
        <a className={active === 'Equipment' ? 'active' : ''} href="/equipment">Equipment</a>
        <a href="/#about">About</a>
      </nav>
      <div className="header-actions">
        <button className="btn btn-outline" onClick={accountMessage}>Login</button>
        
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 CampusEquip. All rights reserved.</p>
    </footer>
  );
}

function Status({ condition }) {
  return <span className={'status ' + condition.toLowerCase()}>{condition}</span>;
}

function EquipmentCard({ item, catalog = false }) {
  return (
    <article className={'equipment-card ' + (catalog ? 'catalog-card' : '')}>
      <img src={item.image} alt={item.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
      <div className="card-body">
        <div className="card-title-row">
          <h3>{item.name}</h3>
          <Status condition={item.condition} />
        </div>
        {catalog ? (
          <>
            <p className="muted">Category: {item.category}</p>
            <p className="muted">Location: {item.location}</p>
          </>
        ) : (
          <p className="muted">{item.category} · {item.brand}</p>
        )}
        <p className="availability">{item.quantity} available</p>
        <a href={'/details?item=' + encodeURIComponent(item.id)} className="btn card-btn">View Details</a>
      </div>
    </article>
  );
}

function Home() {
  const featured = featuredIds.map(id => equipment.find(x => x.id === id)).filter(Boolean);
  return (
    <>
      <Header active="Home" />
      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">CAMPUS EQUIPMENT MADE SIMPLE</p>
            <h1>Campus Equipment<br />Borrowing and Inventory System</h1>
            <p className="hero-description">Easily find and borrow campus equipment for your classes, projects, and school activities.</p>
            <div className="hero-actions">
              <button className="btn" onClick={accountMessage}>Get Started</button>
              <a href="/equipment" className="btn btn-outline light-outline">Browse Equipment</a>
            </div>
          </div>
        </section>
        <section className="section" id="featured">
          <div className="section-heading">
            <div>
              <p className="eyebrow blue-eyebrow">OUR INVENTORY</p>
              <h2>Featured Equipment</h2>
              <p className="muted">Check the equipment available for borrowing.</p>
            </div>
            <a href="/equipment" className="text-link">View All Equipment →</a>
          </div>
          <div className="equipment-grid">
            {featured.map(item => <EquipmentCard key={item.id} item={item} />)}
          </div>
        </section>
        <section className="section how-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow blue-eyebrow">ABOUT CAMPUS EQUIP</p>
              <h2>How It Works</h2>
            </div>
          </div>
          <div className="steps-grid">
            {[
              ['01', 'Browse Equipment', 'Find equipment that you need for school.'],
              ['02', 'Submit a Request', 'Select the equipment you want to borrow.'],
              ['03', 'Wait for Approval', 'The administrator reviews your request.'],
              ['04', 'Return Equipment', 'Return borrowed equipment on time.']
            ].map(s => (
              <article className="step-card" key={s[0]}>
                <span className="step-number">{s[0]}</span>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about-section" id="about">
          <div>
            <p className="eyebrow blue-eyebrow">CAMPUS EQUIP</p>
            <h2>Equipment access made easier.</h2>
          </div>
          <p>CampusEquip helps students browse campus equipment, check its condition, view its assigned location, and see listed availability.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Catalog() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('popular');

  const filtered = useMemo(() => {
    let list = equipment.filter(item => 
      (item.name.toLowerCase().includes(search.toLowerCase()) || 
       item.brand.toLowerCase().includes(search.toLowerCase()) ||
       item.category.toLowerCase().includes(search.toLowerCase())) &&
      (!location || item.location === location) &&
      (!category || item.categoryId === Number(category)) &&
      (!condition || item.condition.toLowerCase() === condition)
    );

    if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => ({ good: 1, new: 1, fair: 2, poor: 3 }[a.condition.toLowerCase()] || 4) - ({ good: 1, new: 1, fair: 2, poor: 3 }[b.condition.toLowerCase()] || 4));

    return list;
  }, [search, location, category, condition, sort]);

  const reset = () => { setSearch(''); setLocation(''); setCategory(''); setCondition(''); setSort('popular'); };

  // Eksaktong istilo na ginaya mula sa Popular dropdown para maging pareho sila
  const popularDropdownStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <>
      <Header active="Equipment" />
      <main className="catalog-page">
        <section className="catalog-heading">
          <p className="eyebrow blue-eyebrow">CAMPUS INVENTORY</p>
          <h1>Equipment Catalog</h1>
          <p className="muted">Find the equipment you need for your school activities.</p>
        </section>
        <div className="catalog-layout">
          <aside className="filter-sidebar">
            <div className="filter-heading">
              <h2>Filters</h2>
              <button className="text-link reset-button" onClick={reset}>Reset</button>
            </div>
            <div className="filter-group">
              <h3>Location</h3>
              <select style={popularDropdownStyle} value={location} onChange={e => setLocation(e.target.value)}>
                <option value="">All Locations</option>
                {locationOptions.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <h3>Category</h3>
              <select style={popularDropdownStyle} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categoryOptions.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <h3>Condition</h3>
              {[
                ['', 'All Conditions'],
                ['good', 'Good'],
                ['new', 'New'],
                ['fair', 'Fair'],
                ['poor', 'Poor']
              ].map(x => (
                <button key={x[0]} className={'filter-btn ' + (condition === x[0] ? 'active' : '')} onClick={() => setCondition(x[0])}>{x[1]}</button>
              ))}
            </div>
          </aside>
          <section className="catalog-content">
            <div className="catalog-controls">
              <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment or brand..." aria-label="Search equipment" />
              
              <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort equipment">
                <option value="popular">Popular: Good to Poor</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </div>
            <p className="result-count">Showing {filtered.length} of {equipment.length} equipment item(s)</p>
            {filtered.length ? (
              <div className="equipment-grid catalog-grid">
                {filtered.map(item => <EquipmentCard key={item.id} item={item} catalog />)}
              </div>
            ) : (
              <div className="no-results">No equipment matches your filters. Try changing your search or reset the filters.</div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Details() {
  const id = new URLSearchParams(window.location.search).get('item');
  const item = equipment.find(x => x.id === id);
  const [message, setMessage] = useState('');

  return (
    <>
      <Header active="Equipment" />
      <main className="details-container">
        <a href="/equipment" className="back-link">← Back to Equipment</a>
        {item ? (
          <div className="details-card">
            <div className="details-image">
              <img src={item.image} alt={item.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="details-info">
              <p className="eyebrow blue-eyebrow">{item.category}</p>
              <h1>{item.name}</h1>
              <p>{item.description}</p>
              <div className="details-specs">
                <p><strong>Brand:</strong> {item.brand}</p>
                <p><strong>Model:</strong> {item.model}</p>
                <p><strong>Asset Tag:</strong> {item.assetTag}</p>
                <p><strong>Location:</strong> {item.location}</p>
                {item.college && <p><strong>College:</strong> {item.college}</p>}
                <p><strong>Condition:</strong> <Status condition={item.condition} /></p>
                <p><strong>Available Quantity:</strong> {item.quantity}</p>
                <p><strong>Status:</strong> {item.quantity > 0 ? 'Available' : 'Unavailable'}</p>
              </div>
              <button 
                className="btn" 
                disabled={item.quantity <= 0} 
                onClick={() => setMessage('Please sign up or log in to continue with your equipment request.')}
              >
                {item.quantity > 0 ? 'Request Equipment' : 'Unavailable'}
              </button>
              <p className="request-message" role="status">{message}</p>
            </div>
          </div>
        ) : (
          <div className="details-card not-found">
            <div>
              <h1>Equipment Not Found</h1>
              <p>Please return to the equipment catalog and select an item.</p>
              <a href="/equipment" className="btn">Browse Equipment</a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/equipment' || path === '/equipment.html') return <Catalog />;
  if (path === '/details' || path === '/details.html') return <Details />;
  return <Home />;
}
import seal from '../../assets/wmsu-seal.png'

export default function AuthBrand() {
  return (
    <aside className="wa__brand">
      <div className="wa__seal">
        <img src={seal} alt="Western Mindanao State University seal" />
      </div>
      <h1 className="wa__system">Campus Equipment<br />Borrowing System</h1>
      <p className="wa__tagline">
        Request equipment, track due dates, and return items on time, all in one place.
      </p>
      <p className="wa__school">Western Mindanao State University</p>
    </aside>
  )
}
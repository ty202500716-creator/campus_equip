import { getUser, useApi } from '../../api.js'

export default function Notifications() {
  const { data } = useApi(`/api/notifications?user_id=${getUser().user_id}`)

  return (
    <section className="card">
      <div className="card-heading-row"><h2>Notifications</h2></div>
      {data.length === 0 && <p className="empty">You are all caught up.</p>}
      {data.map((n) => (
        <div className="item-card" key={n.notification_id} style={{ marginBottom: 12 }}>
          <p style={{ color: 'var(--text)' }}>{n.message}</p>
          <p>{n.created_at?.slice(0, 10)}</p>
        </div>
      ))}
    </section>
  )
}

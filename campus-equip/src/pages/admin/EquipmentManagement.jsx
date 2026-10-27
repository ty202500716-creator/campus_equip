import { useState } from 'react'
import { api, useApi } from '../../api.js'

const blank = { name: '', category: '', condition: 'Good', quantity: 1, description: '' }

export default function EquipmentManagement() {
  const { data, reload } = useApi('/api/equipment')
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    try {
      const path = editId ? `/api/equipment/${editId}` : '/api/equipment'
      await api(path, { method: editId ? 'PUT' : 'POST', body: { ...form, quantity: Number(form.quantity) } })
      setMsg(editId ? 'Equipment updated.' : 'Equipment added.')
      setForm(blank); setEditId(null)
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this equipment?')) return
    try {
      await api(`/api/equipment/${id}`, { method: 'DELETE' })
      reload()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const edit = (i) => {
    setEditId(i.equipment_id)
    setForm({ name: i.name, category: i.category, condition: i.condition, quantity: i.quantity, description: i.description || '' })
  }

  return (
    <>
      <section className="card">
        <div className="card-heading-row"><h2>{editId ? 'Edit equipment' : 'Add equipment'}</h2></div>
        <form onSubmit={save}>
          <div className="row">
            <div className="field"><label htmlFor="n">Name</label><input id="n" className="control" required value={form.name} onChange={set('name')} /></div>
            <div className="field"><label htmlFor="c">Category</label><input id="c" className="control" required value={form.category} onChange={set('category')} /></div>
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="co">Condition</label>
              <select id="co" className="control" value={form.condition} onChange={set('condition')}>
                {['New', 'Good', 'Fair', 'Needs repair'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="q">Quantity</label><input id="q" type="number" min="1" className="control" value={form.quantity} onChange={set('quantity')} /></div>
          </div>
          <div className="field full"><label htmlFor="d">Description</label><textarea id="d" className="control" value={form.description} onChange={set('description')} /></div>
          <button type="submit" className="submit">{editId ? 'Save changes' : 'Add equipment'}</button>
          <div className={`toast ${msg ? 'show' : ''}`} role="status">{msg}</div>
        </form>
      </section>

      <section className="card">
        <div className="card-heading-row"><h2>Inventory</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Category</th><th>Condition</th><th>Available</th><th>Action</th></tr></thead>
            <tbody>
              {data.map((i) => (
                <tr key={i.equipment_id}>
                  <td>{i.name}</td><td>{i.category}</td><td>{i.condition}</td><td>{i.available}/{i.quantity}</td>
                  <td>
                    <button className="btn-sm" onClick={() => edit(i)}>Edit</button>
                    <button className="btn-sm danger" onClick={() => remove(i.equipment_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

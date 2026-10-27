import express from 'express'
import bcrypt from 'bcryptjs'
import pg from 'pg'

// Return DATE columns as 'YYYY-MM-DD' strings (avoids timezone day-shift)
pg.types.setTypeParser(1082, (v) => v)

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next)
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg })
const rollback = (client) => client.query('ROLLBACK').catch(() => {})

export default function routes(pool) {
  const r = express.Router()

  /* ---------- Auth ---------- */
  r.post('/auth/register', wrap(async (req, res) => {
    const b = req.body
    if (!b.name?.trim() || !b.email?.trim() || !b.contact_number?.trim() || !b.password || b.password.length < 6)
      return bad(res, 'Name, email, contact number and a password of 6+ characters are required.')
    if (!['student', 'staff'].includes(b.role)) return bad(res, 'Invalid role.')
    if (b.role === 'student' && !(b.student_number && b.course && b.year_level)) return bad(res, 'Student number, course and year level are required.')
    if (b.role === 'staff' && !(b.employee_number && b.department)) return bad(res, 'Employee number and department are required.')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const hash = await bcrypt.hash(b.password, 10)
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, contact_number)
         VALUES ($1,$2,$3,$4,$5) RETURNING user_id`,
        [b.name.trim(), b.email.trim().toLowerCase(), hash, b.role, b.contact_number.trim()])
      const id = rows[0].user_id
      if (b.role === 'student') {
        await client.query('INSERT INTO students (user_id, student_number, course, year_level) VALUES ($1,$2,$3,$4)',
          [id, b.student_number, b.course, Number(b.year_level)])
      } else {
        await client.query('INSERT INTO staff (user_id, employee_number, department, position) VALUES ($1,$2,$3,$4)',
          [id, b.employee_number, b.department, b.position || null])
      }
      await client.query('COMMIT')
      res.status(201).json({ ok: true })
    } catch (e) {
      await rollback(client)
      if (e.code === '23505') return bad(res, 'Email or ID number is already registered.', 409)
      throw e
    } finally {
      client.release()
    }
  }))

  r.post('/auth/login', wrap(async (req, res) => {
    const { email, password } = req.body
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [(email || '').trim().toLowerCase()])
    const u = rows[0]
    if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return bad(res, 'Invalid email or password.', 401)
    res.json({ user_id: u.user_id, name: u.name, role: u.role === 'admin' ? 'admin' : 'borrower' })
  }))

  /* ---------- Equipment ---------- */
  r.get('/equipment', wrap(async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM equipment ORDER BY name')
    res.json(rows)
  }))

  r.get('/equipment/:id', wrap(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM equipment WHERE equipment_id = $1', [req.params.id])
    if (!rows[0]) return bad(res, 'Equipment not found.', 404)
    res.json(rows[0])
  }))

  r.post('/equipment', wrap(async (req, res) => {
    const { name, category, condition, description, quantity } = req.body
    if (!name?.trim() || !category?.trim() || !(quantity >= 0)) return bad(res, 'Name, category and quantity are required.')
    const { rows } = await pool.query(
      `INSERT INTO equipment (name, category, condition, description, quantity, available)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
      [name.trim(), category.trim(), condition || 'Good', description || '', quantity])
    res.status(201).json(rows[0])
  }))

  r.put('/equipment/:id', wrap(async (req, res) => {
    const { name, category, condition, description, quantity } = req.body
    if (!name?.trim() || !category?.trim() || !(quantity >= 0)) return bad(res, 'Name, category and quantity are required.')
    const { rows } = await pool.query(
      `UPDATE equipment SET name=$1, category=$2, condition=$3, description=$4,
         available = GREATEST(0, available + ($5 - quantity)), quantity = $5
       WHERE equipment_id = $6 RETURNING *`,
      [name.trim(), category.trim(), condition || 'Good', description || '', quantity, req.params.id])
    if (!rows[0]) return bad(res, 'Equipment not found.', 404)
    res.json(rows[0])
  }))

  r.delete('/equipment/:id', wrap(async (req, res) => {
    try {
      const d = await pool.query('DELETE FROM equipment WHERE equipment_id = $1', [req.params.id])
      if (!d.rowCount) return bad(res, 'Equipment not found.', 404)
      res.json({ ok: true })
    } catch (e) {
      if (e.code === '23503') return bad(res, 'Cannot delete equipment that has borrowing records.', 409)
      throw e
    }
  }))

  /* ---------- Borrow requests ---------- */
  r.get('/borrow-requests', wrap(async (req, res) => {
    const params = []
    let where = ''
    if (req.query.user_id) { params.push(req.query.user_id); where = 'WHERE r.user_id = $1' }
    const { rows } = await pool.query(
      `SELECT r.request_id, r.user_id, r.equipment_id, r.quantity, r.purpose,
              r.start_date AS borrow_date, r.due_date, r.return_date, r.status, r.request_date,
              u.name AS user_name, e.name AS equipment_name
       FROM borrow_requests r
       JOIN users u ON u.user_id = r.user_id
       JOIN equipment e ON e.equipment_id = r.equipment_id
       ${where} ORDER BY r.request_date DESC`, params)
    res.json(rows)
  }))

  r.post('/borrow-requests', wrap(async (req, res) => {
    const { user_id, equipment_id, quantity, purpose, due_date } = req.body
    const start = req.body.start_date || req.body.borrow_date
    if (!user_id || !equipment_id || !(quantity > 0) || !purpose?.trim() || !start || !due_date) return bad(res, 'All fields are required.')
    if (due_date < start) return bad(res, 'Return date must be on or after the borrowing date.')
    const eq = await pool.query('SELECT available FROM equipment WHERE equipment_id = $1', [equipment_id])
    if (!eq.rows[0]) return bad(res, 'Equipment not found.', 404)
    if (quantity > eq.rows[0].available) return bad(res, `Only ${eq.rows[0].available} available.`)
    const { rows } = await pool.query(
      `INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, equipment_id, quantity, purpose.trim(), start, due_date])
    res.status(201).json(rows[0])
  }))

  r.patch('/borrow-requests/:id', wrap(async (req, res) => {
    const { status, admin_id } = req.body
    if (!['approved', 'rejected', 'returned'].includes(status)) return bad(res, 'Invalid status.')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `SELECT r.*, e.name AS equipment_name FROM borrow_requests r
         JOIN equipment e ON e.equipment_id = r.equipment_id
         WHERE r.request_id = $1 FOR UPDATE OF r`, [req.params.id])
      const q = rows[0]
      if (!q) { await rollback(client); return bad(res, 'Request not found.', 404) }
      const okFrom = status === 'returned' ? ['approved', 'overdue'] : ['pending']
      if (!okFrom.includes(q.status)) { await rollback(client); return bad(res, `A ${q.status} request cannot be set to ${status}.`) }

      if (status === 'approved') {
        const u = await client.query(
          'UPDATE equipment SET available = available - $1 WHERE equipment_id = $2 AND available >= $1', [q.quantity, q.equipment_id])
        if (!u.rowCount) { await rollback(client); return bad(res, 'Not enough units available to approve.') }
        await client.query('UPDATE borrow_requests SET status=$1, approved_by=$2 WHERE request_id=$3', [status, admin_id || null, q.request_id])
      } else if (status === 'returned') {
        await client.query('UPDATE equipment SET available = available + $1 WHERE equipment_id = $2', [q.quantity, q.equipment_id])
        await client.query('UPDATE borrow_requests SET status=$1, return_date=CURRENT_DATE WHERE request_id=$2', [status, q.request_id])
      } else {
        await client.query('UPDATE borrow_requests SET status=$1 WHERE request_id=$2', [status, q.request_id])
      }
      await client.query('INSERT INTO notifications (user_id, message) VALUES ($1,$2)',
        [q.user_id, `Your request for ${q.quantity} × ${q.equipment_name} was ${status}.`])
      await client.query('COMMIT')
      res.json({ ok: true })
    } catch (e) {
      await rollback(client)
      throw e
    } finally {
      client.release()
    }
  }))

  /* ---------- Notifications ---------- */
  r.get('/notifications', wrap(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.query.user_id])
    res.json(rows)
  }))

  return r
}

export async function markOverdue(pool) {
  try {
    await pool.query(
      `WITH o AS (
         UPDATE borrow_requests SET status = 'overdue'
         WHERE status = 'approved' AND due_date < CURRENT_DATE
         RETURNING user_id, request_id)
       INSERT INTO notifications (user_id, message)
       SELECT user_id, 'Request #' || request_id || ' is overdue. Please return the equipment.' FROM o`)
  } catch (e) {
    console.error('Overdue check failed:', e.message)
  }
}
import { Router } from "express";

// Admin API. NOTE: not protected yet. Add login + role check before real use.
export default function adminRoutes(pool) {
  const router = Router();

  const wrap = (fn) => (req, res) =>
    fn(req, res).catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    });

  // Approved items past their due date become "overdue"
  const markOverdue = () =>
    pool.query(
      `UPDATE borrow_requests SET status = 'overdue'
       WHERE status = 'approved' AND due_date < CURRENT_DATE AND return_date IS NULL`
    );

  // ---------- Dashboard numbers ----------
  router.get(
    "/stats",
    wrap(async (req, res) => {
      await markOverdue();
      const { rows } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM equipment)::int                              AS total_equipment,
          (SELECT COALESCE(SUM(available), 0) FROM equipment)::int           AS available_units,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'pending')::int  AS pending,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'approved')::int AS borrowed,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'overdue')::int  AS overdue,
          (SELECT COUNT(*) FROM users)::int                                  AS total_users
      `);
      res.json(rows[0]);
    })
  );

  // ---------- Requests ----------
  router.get(
    "/requests",
    wrap(async (req, res) => {
      await markOverdue();
      const { rows } = await pool.query(`
        SELECT r.request_id, r.quantity, r.purpose, r.status, r.request_date,
               r.borrow_date::text AS borrow_date,
               r.due_date::text    AS due_date,
               r.return_date::text AS return_date,
               u.name AS user_name, u.role AS user_role, u.contact_number,
               e.name AS equipment_name
        FROM borrow_requests r
        JOIN users u     ON u.user_id = r.user_id
        JOIN equipment e ON e.equipment_id = r.equipment_id
        ORDER BY r.request_date DESC
      `);
      res.json(rows);
    })
  );

  router.patch(
    "/requests/:id/approve",
    wrap(async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          "SELECT equipment_id, quantity, status FROM borrow_requests WHERE request_id = $1 FOR UPDATE",
          [req.params.id]
        );
        const r = rows[0];
        if (!r) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Request not found" });
        }
        if (r.status !== "pending") {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Only pending requests can be approved" });
        }

        const upd = await client.query(
          "UPDATE equipment SET available = available - $1 WHERE equipment_id = $2 AND available >= $1",
          [r.quantity, r.equipment_id]
        );
        if (upd.rowCount === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Not enough units available" });
        }

        // Temporary: uses the first admin until login exists
        const adm = await client.query("SELECT user_id FROM admins LIMIT 1");
        await client.query(
          "UPDATE borrow_requests SET status = 'approved', approved_by = $1 WHERE request_id = $2",
          [adm.rows[0] ? adm.rows[0].user_id : null, req.params.id]
        );
        await client.query("COMMIT");
        res.json({ ok: true });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    })
  );

  router.patch(
    "/requests/:id/reject",
    wrap(async (req, res) => {
      const { rowCount } = await pool.query(
        "UPDATE borrow_requests SET status = 'rejected' WHERE request_id = $1 AND status = 'pending'",
        [req.params.id]
      );
      if (rowCount === 0)
        return res.status(400).json({ error: "Only pending requests can be rejected" });
      res.json({ ok: true });
    })
  );

  router.patch(
    "/requests/:id/return",
    wrap(async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          "SELECT equipment_id, quantity, status FROM borrow_requests WHERE request_id = $1 FOR UPDATE",
          [req.params.id]
        );
        const r = rows[0];
        if (!r || !["approved", "overdue"].includes(r.status)) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "This request is not currently borrowed" });
        }
        await client.query(
          "UPDATE equipment SET available = available + $1 WHERE equipment_id = $2",
          [r.quantity, r.equipment_id]
        );
        await client.query(
          "UPDATE borrow_requests SET status = 'returned', return_date = CURRENT_DATE WHERE request_id = $1",
          [req.params.id]
        );
        await client.query("COMMIT");
        res.json({ ok: true });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    })
  );

  // ---------- Equipment management ----------
  router.post(
    "/equipment",
    wrap(async (req, res) => {
      const { name, category, condition, quantity } = req.body;
      if (!name || !category || !(quantity >= 0))
        return res.status(400).json({ error: "Name, category and quantity are required" });
      const { rows } = await pool.query(
        `INSERT INTO equipment (name, category, condition, quantity, available)
         VALUES ($1, $2, $3, $4, $4) RETURNING *`,
        [name, category, condition || "good", quantity]
      );
      res.status(201).json(rows[0]);
    })
  );

  router.put(
    "/equipment/:id",
    wrap(async (req, res) => {
      const { name, category, condition, quantity } = req.body;
      // available moves by the same amount as quantity; it can't drop below 0
      const { rows } = await pool.query(
        `UPDATE equipment
         SET name = $1, category = $2, condition = $3,
             available = available + ($4 - quantity),
             quantity = $4
         WHERE equipment_id = $5 AND available + ($4 - quantity) >= 0
         RETURNING *`,
        [name, category, condition || "good", quantity, req.params.id]
      );
      if (!rows[0])
        return res
          .status(400)
          .json({ error: "Quantity is lower than the units currently borrowed" });
      res.json(rows[0]);
    })
  );

  router.delete(
    "/equipment/:id",
    async (req, res) => {
      try {
        await pool.query("DELETE FROM equipment WHERE equipment_id = $1", [req.params.id]);
        res.json({ ok: true });
      } catch (err) {
        if (err.code === "23503")
          return res
            .status(400)
            .json({ error: "Can't delete: this equipment has borrowing records" });
        console.error(err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}
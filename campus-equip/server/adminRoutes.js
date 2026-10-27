import { Router } from "express";

export default function adminRoutes(pool) {
  const router = Router();

  const wrap = (fn) => (req, res) =>
    fn(req, res).catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    });

  // Approved items past their due date become "overdue"
  const markOverdue = () =>
    pool.query(`
      UPDATE borrow_requests SET status = 'overdue'
      WHERE status = 'approved' AND returned_at IS NULL AND due_date < CURRENT_DATE
    `);

  // ---------- Dashboard numbers ----------
  router.get(
    "/stats",
    wrap(async (req, res) => {
      await markOverdue();
      const { rows } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM equipment WHERE is_active = 1)::int             AS total_equipment,
          (SELECT COALESCE(SUM(available_quantity), 0) FROM equipment WHERE is_active = 1)::int AS available_units,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'pending')::int    AS pending,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'approved')::int   AS borrowed,
          (SELECT COUNT(*) FROM borrow_requests WHERE status = 'overdue')::int    AS overdue,
          (SELECT COUNT(*) FROM users WHERE is_active = 1)::int                  AS total_users
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
        SELECT r.request_id, r.quantity, r.purpose, r.status, r.requested_at,
               r.start_date::text  AS start_date,
               r.due_date::text    AS due_date,
               r.returned_at::text AS returned_at,
               u.full_name AS user_name, u.role AS user_role, u.phone AS contact_number,
               e.name AS equipment_name
        FROM borrow_requests r
        JOIN users u     ON u.user_id = r.user_id
        JOIN equipment e ON e.equipment_id = r.equipment_id
        ORDER BY r.requested_at DESC
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

        // Find an admin user from the unified users table
        const adm = await client.query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
        const adminId = adm.rows[0] ? adm.rows[0].user_id : null;

        if (adminId) {
          await client.query("SELECT set_config('my.current_user_id', $1, true)", [adminId.toString()]);
        }

        await client.query(
          "UPDATE borrow_requests SET status = 'approved', approved_by = $1 WHERE request_id = $2",
          [adminId, req.params.id]
        );

        await client.query("COMMIT");
        res.json({ ok: true });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(400).json({ error: err.message || "Server error" });
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

        const adm = await client.query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
        const adminId = adm.rows[0] ? adm.rows[0].user_id : null;
        if (adminId) {
          await client.query("SELECT set_config('my.current_user_id', $1, true)", [adminId.toString()]);
        }

        await client.query(
          "UPDATE borrow_requests SET status = 'returned', returned_at = CURRENT_TIMESTAMP, received_by = $1 WHERE request_id = $2",
          [adminId, req.params.id]
        );

        await client.query("COMMIT");
        res.json({ ok: true });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(400).json({ error: err.message || "Server error" });
      } finally {
        client.release();
      }
    })
  );

  // ---------- Equipment management ----------
  router.post(
    "/equipment",
    wrap(async (req, res) => {
      const { name, category_id, item_condition, total_quantity, location } = req.body;
      if (!name || !category_id || !(total_quantity >= 0))
        return res.status(400).json({ error: "Name, category_id and total_quantity are required" });
      
      const { rows } = await pool.query(
        `INSERT INTO equipment (name, category_id, item_condition, total_quantity, location)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, category_id, item_condition || "good", total_quantity, location || "Property Office"]
      );
      res.status(201).json(rows[0]);
    })
  );

  router.put(
    "/equipment/:id",
    wrap(async (req, res) => {
      const { name, category_id, item_condition, total_quantity, location } = req.body;
      const { rows } = await pool.query(
        `UPDATE equipment
         SET name = $1, category_id = $2, item_condition = $3, total_quantity = $4, location = $5
         WHERE equipment_id = $6
         RETURNING *`,
        [name, category_id, item_condition || "good", total_quantity, location, req.params.id]
      );
      if (!rows[0])
        return res.status(404).json({ error: "Equipment not found" });
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
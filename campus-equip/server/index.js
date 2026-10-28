import express from "express";
import cors from "cors";
import pg from "pg";
import crypto from "crypto";
import "dotenv/config";
import adminRoutes from "./adminRoutes.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(cors());
app.use(express.json());

// Admin Routes
app.use("/api/admin", adminRoutes(pool));

// ---------- AUTHENTICATION ROUTES ----------

// ---- password hashing (built-in scrypt, no extra dependency) ----
const hashPassword = (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};
const verifyPassword = (plain, stored) => {
  if (!stored) return false;
  if (!stored.startsWith("scrypt$")) return stored === plain; // legacy plain-text rows
  const [, salt, hash] = stored.split("$");
  const test = crypto.scryptSync(plain, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === test.length && crypto.timingSafeEqual(known, test);
};

const COURSES = ["ACT AD", "ACT NT", "BSIT", "BSSCS"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register student
// Body: { name, student_id, email, contact_number (optional), course, year_level, password, confirmPassword }
app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const studentId = String(req.body.student_id || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const contact = String(req.body.contact_number || "").trim();
  const course = String(req.body.course || "").trim();
  const yearLevel = Number(req.body.year_level);
  const { password, confirmPassword } = req.body;

  if (!name || !studentId || !email || !course || !req.body.year_level || !password || !confirmPassword) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }
  if (!/^\d{9}$/.test(studentId)) {
    return res.status(400).json({ error: "Student ID must be 9 digits (e.g. 202500000)." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!COURSES.includes(course)) {
    return res.status(400).json({ error: "Please select a valid course." });
  }
  if (![1, 2, 3, 4].includes(yearLevel)) {
    return res.status(400).json({ error: "Year level must be 1 to 4." });
  }
  if (contact && !/^[0-9+\-\s()]{7,20}$/.test(contact)) {
    return res.status(400).json({ error: "Please enter a valid contact number." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  try {
    const existing = await pool.query(
      "SELECT email, school_id FROM users WHERE LOWER(email) = $1 OR school_id = $2",
      [email, studentId]
    );
    if (existing.rows.length > 0) {
      const sameEmail = existing.rows.some((r) => r.email.toLowerCase() === email);
      return res.status(400).json({
        error: sameEmail ? "Email is already registered." : "Student ID is already registered.",
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (school_id, full_name, email, password_hash, role, course, year_level, phone)
       VALUES ($1, $2, $3, $4, 'student', $5, $6, $7)
       RETURNING user_id, school_id AS student_id, full_name AS name, email, role, course, year_level, phone AS contact_number`,
      [studentId, name, email, hashPassword(password), course, yearLevel, contact || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      const msg = String(err.constraint || "").includes("school_id")
        ? "Student ID is already registered."
        : "Email is already registered.";
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: "Server error during registration." });
  }
});

// Login user (email + password only)
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, full_name AS name, email, role, course, year_level,
              password_hash, is_active
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (user.is_active === 0) {
      return res.status(403).json({ error: "This account is deactivated." });
    }

    // Upgrade legacy plain-text passwords to a hash, and record the login
    const upgraded = user.password_hash.startsWith("scrypt$")
      ? user.password_hash
      : hashPassword(password);
    await pool.query(
      "UPDATE users SET password_hash = $1, last_login_at = NOW() WHERE user_id = $2",
      [upgraded, user.user_id]
    );

    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course,
      year_level: user.year_level,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// ---------- EQUIPMENT ROUTES ----------

// Shape sent to the frontend (names match what the React pages read)
const EQUIPMENT_SELECT = `
  SELECT e.equipment_id, e.category_id, c.name AS category, e.name, e.brand, e.model,
         e.description, e.asset_tag, INITCAP(e.item_condition::text) AS condition,
         e.total_quantity AS quantity, e.available_quantity AS available,
         e.location, e.college, e.image_url
  FROM equipment e
  JOIN categories c ON c.category_id = e.category_id
  WHERE e.is_active = 1`;

const toDbCondition = (c) => {
  const v = String(c || "good").trim().toLowerCase();
  if (v === "needs repair") return "poor";
  return ["new", "good", "fair", "poor", "damaged", "retired"].includes(v) ? v : "good";
};

const categoryIdByName = async (name) => {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const found = await pool.query("SELECT category_id FROM categories WHERE LOWER(name) = LOWER($1)", [clean]);
  if (found.rows[0]) return found.rows[0].category_id;
  const made = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING category_id", [clean]);
  return made.rows[0].category_id;
};

// All equipment (landing page, borrower catalog, request form, admin inventory)
app.get("/api/equipment", async (req, res) => {
  try {
    const { rows } = await pool.query(`${EQUIPMENT_SELECT} ORDER BY e.name`);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// One equipment item (details page)
app.get("/api/equipment/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid equipment id." });
  try {
    const { rows } = await pool.query(`${EQUIPMENT_SELECT} AND e.equipment_id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Equipment not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: add / edit / delete equipment (Equipment Management page)
app.post("/api/equipment", async (req, res) => {
  const { name, category, condition, quantity, description } = req.body;
  if (!String(name || "").trim() || !String(category || "").trim() || !(Number(quantity) >= 0)) {
    return res.status(400).json({ error: "Name, category and quantity are required." });
  }
  try {
    const categoryId = await categoryIdByName(category);
    const { rows } = await pool.query(
      `INSERT INTO equipment (category_id, name, description, item_condition, total_quantity, location)
       VALUES ($1, $2, $3, $4, $5, 'Property Office') RETURNING equipment_id`,
      [categoryId, String(name).trim(), description || null, toDbCondition(condition), Number(quantity)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/equipment/:id", async (req, res) => {
  const { name, category, condition, quantity, description } = req.body;
  try {
    const categoryId = await categoryIdByName(category);
    const { rows } = await pool.query(
      `UPDATE equipment
          SET name = $1, category_id = $2, description = $3, item_condition = $4,
              total_quantity = $5, updated_at = NOW()
        WHERE equipment_id = $6
        RETURNING equipment_id`,
      [String(name || "").trim(), categoryId, description || null, toDbCondition(condition), Number(quantity), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Equipment not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/equipment/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM equipment WHERE equipment_id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ error: "Can't delete: this equipment has borrowing records." });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- BORROW REQUEST ROUTES ----------

// Approved loans past their due date become "overdue" (same rule the admin routes use)
const markOverdue = () =>
  pool.query(`
    UPDATE borrow_requests SET status = 'overdue'
    WHERE status = 'approved' AND returned_at IS NULL AND due_date < CURRENT_DATE
  `);

// List requests. ?user_id=ID returns only that borrower's requests; no user_id returns all (admin pages).
app.get("/api/borrow-requests", async (req, res) => {
  try {
    await markOverdue();
    const params = [];
    let where = "";
    if (req.query.user_id) {
      params.push(Number(req.query.user_id));
      where = "WHERE r.user_id = $1";
    }
    const { rows } = await pool.query(
      `SELECT r.request_id, r.user_id, r.quantity, r.purpose, r.status, r.requested_at,
              r.start_date::text AS borrow_date, r.due_date::text AS due_date,
              r.returned_at, r.admin_remarks,
              u.full_name AS user_name, u.role AS user_role, u.phone AS contact_number,
              e.name AS equipment_name, e.image_url
         FROM borrow_requests r
         JOIN users u     ON u.user_id = r.user_id
         JOIN equipment e ON e.equipment_id = r.equipment_id
         ${where}
        ORDER BY r.requested_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a borrow request (status starts as 'pending'; the database triggers enforce the rules)
app.post("/api/borrow-requests", async (req, res) => {
  const { user_id, equipment_id, purpose, due_date } = req.body;
  const quantity = Number(req.body.quantity);
  const startDate = req.body.borrow_date || req.body.start_date || null;

  if (!user_id || !equipment_id || !quantity || !String(purpose || "").trim() || !due_date) {
    return res.status(400).json({ error: "Please complete all request details." });
  }

  try {
    const { rows: eq } = await pool.query(
      "SELECT name, available_quantity FROM equipment WHERE equipment_id = $1 AND is_active = 1",
      [equipment_id]
    );
    if (!eq[0]) return res.status(404).json({ error: "Equipment not found." });
    if (quantity > eq[0].available_quantity) {
      return res.status(400).json({ error: `Only ${eq[0].available_quantity} unit(s) of ${eq[0].name} available.` });
    }

    const { rows } = await pool.query(
      `INSERT INTO borrow_requests (user_id, equipment_id, quantity, purpose, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING request_id, status`,
      [user_id, equipment_id, quantity, String(purpose).trim(), startDate, due_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    // Database rule messages (overdue items, max open requests, loan length...) are readable
    res.status(400).json({ error: err.message });
  }
});

// Change a request's status:
//   borrower: { status: 'cancelled', user_id }      (own pending requests only)
//   admin:    { status: 'approved' | 'rejected' | 'returned' }
app.patch("/api/borrow-requests/:id", async (req, res) => {
  const { status, user_id } = req.body;
  const id = Number(req.params.id);
  if (!["cancelled", "approved", "rejected", "returned"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let actorId;
    if (status === "cancelled") {
      if (!user_id) throw new Error("user_id is required to cancel a request.");
      actorId = Number(user_id);
    } else {
      const adm = await client.query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1");
      actorId = adm.rows[0] ? adm.rows[0].user_id : null;
    }
    if (actorId) {
      await client.query("SELECT set_config('my.current_user_id', $1, true)", [String(actorId)]);
    }

    let result;
    if (status === "cancelled") {
      result = await client.query(
        "UPDATE borrow_requests SET status = 'cancelled' WHERE request_id = $1 AND user_id = $2 AND status = 'pending'",
        [id, actorId]
      );
    } else if (status === "returned") {
      result = await client.query(
        "UPDATE borrow_requests SET status = 'returned', received_by = $2 WHERE request_id = $1 AND status IN ('approved', 'overdue')",
        [id, actorId]
      );
    } else {
      result = await client.query(
        `UPDATE borrow_requests SET status = $3, approved_by = $2 WHERE request_id = $1 AND status = 'pending'`,
        [id, actorId, status]
      );
    }
    if (result.rowCount === 0) throw new Error("This request can no longer be changed.");

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ---------- NOTIFICATIONS ----------
app.get("/api/notifications", async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ error: "user_id is required." });
  try {
    const { rows } = await pool.query(
      `SELECT notification_id, request_id, type, message, is_read, created_at
         FROM notifications WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT, () => console.log("API running on " + process.env.PORT));
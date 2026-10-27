import express from "express";
import cors from "cors";
import pg from "pg";
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

// Register user
app.post("/api/auth/register", async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    contact_number, 
    student_number, 
    course, 
    year_level, 
    employee_number, 
    department, 
    position 
  } = req.body;

  // Basic validation
  if (!name || !email || !password || !contact_number) {
    return res.status(400).json({ error: "All fields including contact number are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if email already exists
    const existing = await client.query("SELECT user_id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Email is already registered." });
    }

    // 1. Insert into base 'users' table
    const userRole = role || "student";
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, contact_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, role, contact_number`,
      [name, email, password, userRole, contact_number]
    );

    const newUser = userResult.rows[0];

    // 2. Insert into role-specific tables based on schema
    if (userRole === 'student') {
      await client.query(
        `INSERT INTO students (user_id, student_number, course, year_level)
         VALUES ($1, $2, $3, $4)`,
        [newUser.user_id, student_number, course, year_level]
      );
    } else if (userRole === 'staff') {
      await client.query(
        `INSERT INTO staff (user_id, employee_number, department, position)
         VALUES ($1, $2, $3, $4)`,
        [newUser.user_id, employee_number, department, position || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(newUser);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await pool.query(
      "SELECT user_id, name, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// ---------- EQUIPMENT & BORROW ROUTES ----------

// Fetch equipment using your advanced view
app.get("/api/equipment", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM v_equipment_availability");
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Create borrow request using advanced columns (available_quantity, start_date)
app.post("/api/borrow-requests", async (req, res) => {
  const { user_id, equipment_id, quantity, purpose, start_date, due_date } = req.body;

  try {
    const { rows: eq } = await pool.query(
      "SELECT available_quantity FROM equipment WHERE equipment_id = $1", [equipment_id]
    );
    if (!eq[0]) return res.status(404).json({ error: "Equipment not found" });
    if (quantity > eq[0].available_quantity)
      return res.status(400).json({ error: `Only ${eq[0].available_quantity} available` });

    const { rows } = await pool.query(
      `INSERT INTO borrow_requests
         (user_id, equipment_id, quantity, purpose, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, equipment_id, quantity, purpose, start_date, due_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => console.log("API running on " + process.env.PORT));
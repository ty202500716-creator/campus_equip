import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adminRoutes from "./adminRoutes.js";
import routes, { markOverdue } from "./routes.js";

// Always read server/.env, no matter which folder the server is started from
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Check that server/.env exists.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
});

// Without this, a dropped database connection can crash the whole server
pool.on("error", (err) => console.error("Database error:", err.message));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Admin Routes
=======
>>>>>>> 7f44f044a38052b8b52e72e3ac3cd1804b4938c6
app.use("/api/admin", adminRoutes(pool));
app.use("/api", routes(pool));

<<<<<<< HEAD
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
=======
// Check API
app.get("/", (req, res) => {
  res.json({ message: "Campus Equipment API is running" });
>>>>>>> 7f44f044a38052b8b52e72e3ac3cd1804b4938c6
});

// Check database connection
pool.query("SELECT 1")
  .then(() => console.log("Database connected"))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    console.error("-> Is PostgreSQL running? Does the database in DATABASE_URL exist?");
  });

// Overdue check on start, then hourly
markOverdue(pool);
setInterval(() => markOverdue(pool), 60 * 60 * 1000);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the other program using it, or change PORT in server/.env (and API in src/api.js).`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

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
app.use("/api/admin", adminRoutes(pool));

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
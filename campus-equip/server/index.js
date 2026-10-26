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

app.get("/api/equipment", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM equipment ORDER BY name");
  res.json(rows);
});

app.post("/api/borrow-requests", async (req, res) => {
  const { user_id, equipment_id, quantity, purpose, borrow_date, due_date } = req.body;

  const { rows: eq } = await pool.query(
    "SELECT available FROM equipment WHERE equipment_id = $1", [equipment_id]
  );
  if (!eq[0]) return res.status(404).json({ error: "Equipment not found" });
  if (quantity > eq[0].available)
    return res.status(400).json({ error: `Only ${eq[0].available} available` });

  const { rows } = await pool.query(
    `INSERT INTO borrow_requests
       (user_id, equipment_id, quantity, purpose, borrow_date, due_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [user_id, equipment_id, quantity, purpose, borrow_date, due_date]
  );
  res.status(201).json(rows[0]);
});

app.listen(process.env.PORT, () => console.log("API running on " + process.env.PORT));
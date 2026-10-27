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

app.use("/api/admin", adminRoutes(pool));
app.use("/api", routes(pool));

// Check API
app.get("/", (req, res) => {
  res.json({ message: "Campus Equipment API is running" });
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

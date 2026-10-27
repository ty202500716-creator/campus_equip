import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";
import adminRoutes from "./adminRoutes.js";
import routes, { markOverdue } from "./routes.js";

// ---------- DNS workaround (system resolver is flaky here) ----------
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const realLookup = dns.lookup;
const cache = new Map();

dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") { callback = options; options = {}; }
  if (typeof options === "number") options = { family: options };
  const reply = (addr) =>
    options.all
      ? callback(null, [{ address: addr, family: 4 }])
      : callback(null, addr, 4);

  if (cache.has(hostname)) return reply(cache.get(hostname));

  const attempt = (n) => {
    dns.resolve4(hostname, (err, addrs) => {
      if (!err && addrs?.length) {
        cache.set(hostname, addrs[0]);
        return reply(addrs[0]);
      }
      if (n < 3) return setTimeout(() => attempt(n + 1), 300);
      realLookup(hostname, options, callback);
    });
  };
  attempt(0);
};

// ---------- Env ----------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Check that server/.env exists.");
}

// ---------- Database ----------
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
});

pool.on("error", (err) => console.error("Database error:", err.message));

// ---------- App ----------
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes(pool));
app.use("/api", routes(pool));

app.get("/", (_req, res) => {
  res.json({ message: "Campus Equipment API is running" });
});

// Check database connection
pool
  .query("SELECT 1")
  .then(() => console.log("Database connected"))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    console.error("-> Is the database reachable? Is DATABASE_URL correct?");
  });

// Overdue check shortly after start, then hourly
setTimeout(() => markOverdue(pool), 5000);
setInterval(() => markOverdue(pool), 60 * 60 * 1000);

// Error handler (prints the real error in the terminal)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Close the other program using it, or change PORT in server/.env (and API in src/api.js).`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
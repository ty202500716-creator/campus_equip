import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Same DNS workaround as index.js
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const realLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") { callback = options; options = {}; }
  if (typeof options === "number") options = { family: options };
  dns.resolve4(hostname, (err, addrs) => {
    if (err || !addrs?.length) return realLookup(hostname, options, callback);
    if (options.all) return callback(null, addrs.map((a) => ({ address: a, family: 4 })));
    callback(null, addrs[0], 4);
  });
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const NAME = process.env.ADMIN_NAME || "Super Admin";
const EMAIL = (process.env.ADMIN_EMAIL || "admin@campus.edu").toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 1,
  connectionTimeoutMillis: 20000,
});

async function run() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT user_id FROM users WHERE email = $1", [EMAIL]);

    if (existing.rows[0]) {
      await client.query(
        "UPDATE users SET password_hash = $1, role = 'admin' WHERE user_id = $2",
        [hash, existing.rows[0].user_id]
      );
      await client.query(
        `INSERT INTO admins (user_id, employee_number, office)
         VALUES ($1, 'ADM-0001', 'IT Office') ON CONFLICT (user_id) DO NOTHING`,
        [existing.rows[0].user_id]
      );
      console.log(`Updated existing admin: ${EMAIL}`);
    } else {
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, contact_number)
         VALUES ($1, $2, $3, 'admin', '09000000000') RETURNING user_id`,
        [NAME, EMAIL, hash]
      );
      await client.query(
        `INSERT INTO admins (user_id, employee_number, office)
         VALUES ($1, 'ADM-0001', 'IT Office')`,
        [rows[0].user_id]
      );
      console.log(`Created admin: ${EMAIL}`);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Seed failed:", e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
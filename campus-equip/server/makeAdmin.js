// Usage: node makeAdmin.js "Admin Name" admin@wmsu.edu.ph password123 ADM-001 "IT Office" 09123456789
import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const [name, email, password, empNo, office, contact] = process.argv.slice(2);
if (!contact) { console.log('Usage: node makeAdmin.js "Name" email password employee_no "Office" contact'); process.exit(1); }

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(
    "INSERT INTO users (name, email, password_hash, role, contact_number) VALUES ($1,$2,$3,'admin',$4) RETURNING user_id",
    [name, email.toLowerCase(), await bcrypt.hash(password, 10), contact]);
  await client.query("INSERT INTO admins (user_id, employee_number, office) VALUES ($1,$2,$3)", [rows[0].user_id, empNo, office]);
  await client.query("COMMIT");
  console.log("Admin created:", email);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Failed:", e.message);
} finally {
  client.release();
  await pool.end();
}

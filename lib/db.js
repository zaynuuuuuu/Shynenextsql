import mysql from 'mysql2/promise';
import { SCHEMA_STATEMENTS } from './schema.mjs';

// Pool options shared by the app and scripts/seed.mjs.
//  - timezone 'Z' + session time_zone '+00:00' keep DATETIME columns in UTC end to end.
//  - dateStrings for DATE returns booking dates as plain 'YYYY-MM-DD' strings (no
//    timezone shifting), which is what all the slot/date comparison code expects.
//  - decimalNumbers returns DECIMAL prices as numbers instead of strings.
export function poolConfig() {
  const base = {
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE) || 10,
    timezone: 'Z',
    dateStrings: ['DATE'],
    decimalNumbers: true,
  };

  if (process.env.DATABASE_URL) return { ...base, uri: process.env.DATABASE_URL };

  return {
    ...base,
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE,
  };
}

// Next.js reloads route modules in dev and can invoke this many times in
// serverless — cache the pool on `global` so we reuse it instead of opening a
// new one on every request.
let cached = global._mysql;
if (!cached) {
  cached = global._mysql = { pool: null, ready: null };
}

export function getPool() {
  if (!cached.pool) {
    if (!process.env.DATABASE_URL && !process.env.MYSQL_DATABASE) {
      throw new Error('MySQL is not configured — set MYSQL_DATABASE (plus host/user/password) or DATABASE_URL in .env.local');
    }
    cached.pool = mysql.createPool(poolConfig());
    cached.pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));
  }
  return cached.pool;
}

// Creates the tables on first use so a fresh, empty database just works.
export default async function connectDB() {
  const pool = getPool();
  if (!cached.ready) {
    cached.ready = (async () => {
      for (const sql of SCHEMA_STATEMENTS) await pool.query(sql);
    })().catch((err) => {
      cached.ready = null; // allow a retry on the next request
      throw err;
    });
  }
  await cached.ready;
  return pool;
}

// Runs a parameterized query and returns the rows (or the result header for writes).
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

// Parses a route/body id into a positive integer, or null if it isn't one —
// the replacement for Mongoose's ObjectId casting.
export function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

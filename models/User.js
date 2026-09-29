import bcrypt from 'bcryptjs';
import { query, toId } from '../lib/db';
import { ApiError } from '../lib/apiHandler';

// Columns safe to send to the client — password and reset-token fields are only
// ever selected explicitly (the equivalent of Mongoose's `select: false`).
const PUBLIC_COLUMNS = 'id, name, email, phone, role, businessName, createdAt, updatedAt';
const ROLES = ['customer', 'admin', 'trader'];

const trimOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Rows come back with `id`; the frontend (built against Mongo) expects `_id`.
function toUser(row) {
  if (!row) return null;
  const { id, ...rest } = row;
  return { _id: id, ...rest };
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

function validatePassword(password) {
  if (!password) throw new ApiError('Password is required', 400);
  if (String(password).length < 6) throw new ApiError('Password must be at least 6 characters', 400);
}

export async function findById(id) {
  const userId = toId(id);
  if (!userId) return null;
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [userId]);
  return toUser(rows[0]);
}

// withPassword: include the bcrypt hash so the caller can run matchPassword().
export async function findByEmail(email, { withPassword = false } = {}) {
  const columns = withPassword ? `${PUBLIC_COLUMNS}, password` : PUBLIC_COLUMNS;
  const rows = await query(`SELECT ${columns} FROM users WHERE email = ?`, [normalizeEmail(email)]);
  return toUser(rows[0]);
}

export async function matchPassword(user, enteredPassword) {
  if (!user?.password || !enteredPassword) return false;
  return bcrypt.compare(String(enteredPassword), user.password);
}

export async function create({ name, email, password, phone, role = 'customer', businessName }) {
  const cleanName = trimOrNull(name);
  const cleanEmail = normalizeEmail(email);
  if (!cleanName) throw new ApiError('Name is required', 400);
  if (!cleanEmail) throw new ApiError('Email is required', 400);
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new ApiError('Please provide a valid email', 400);
  validatePassword(password);
  if (!ROLES.includes(role)) throw new ApiError(`Invalid role "${role}"`, 400);

  const result = await query(
    'INSERT INTO users (name, email, password, phone, role, businessName) VALUES (?, ?, ?, ?, ?, ?)',
    [cleanName, cleanEmail, await hashPassword(String(password)), trimOrNull(phone), role, trimOrNull(businessName)]
  );
  return findById(result.insertId);
}

export async function setResetToken(id, hashedToken, expiresAt) {
  await query('UPDATE users SET resetPasswordToken = ?, resetPasswordExpire = ? WHERE id = ?', [
    hashedToken,
    expiresAt,
    id,
  ]);
}

// Returns the user owning a still-valid (unexpired) hashed reset token, or null.
export async function findByValidResetToken(hashedToken) {
  const rows = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire > ?`,
    [hashedToken, new Date()]
  );
  return toUser(rows[0]);
}

// Sets a new password and clears any outstanding reset token.
export async function updatePassword(id, password) {
  validatePassword(password);
  await query(
    'UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE id = ?',
    [await hashPassword(String(password)), id]
  );
}

// Case-insensitive partial match on name/email/phone (the column collation is _ci).
export async function searchCustomers(term, limit = 10) {
  const like = `%${String(term).replace(/[\\%_]/g, '\\$&')}%`;
  const rows = await query(
    `SELECT id, name, email, phone FROM users
     WHERE role = 'customer' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
     LIMIT ?`,
    [like, like, like, limit]
  );
  return rows.map(toUser);
}

export async function findByRole(role) {
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE role = ? ORDER BY createdAt DESC, id DESC`, [role]);
  return rows.map(toUser);
}

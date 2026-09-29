import { query, toId } from '../lib/db';
import { ApiError } from '../lib/apiHandler';

const COLUMNS = 'id, name, description, price, durationMinutes, imageUrl, isActive, createdAt, updatedAt';

// Rows come back with `id` and TINYINT booleans; the frontend expects `_id` and true/false.
function toService(row) {
  if (!row) return null;
  const { id, ...rest } = row;
  return { _id: id, ...rest, isActive: !!row.isActive };
}

// Same rules the Mongoose schema enforced.
function validate(s) {
  if (!s.name || !String(s.name).trim()) throw new ApiError('Service name is required', 400);
  if (!s.description || !String(s.description).trim()) throw new ApiError('Description is required', 400);
  if (s.price === undefined || s.price === null || s.price === '' || Number.isNaN(Number(s.price))) {
    throw new ApiError('Price is required', 400);
  }
  if (Number(s.price) < 0) throw new ApiError('Price cannot be negative', 400);
  if (s.durationMinutes === undefined || s.durationMinutes === null || s.durationMinutes === '' || Number.isNaN(Number(s.durationMinutes))) {
    throw new ApiError('Duration is required', 400);
  }
  if (Number(s.durationMinutes) < 15) throw new ApiError('Duration must be at least 15 minutes', 400);
}

function toRow(s) {
  return {
    name: String(s.name).trim(),
    description: String(s.description).trim(),
    price: Number(s.price),
    durationMinutes: Math.round(Number(s.durationMinutes)),
    imageUrl: s.imageUrl ? String(s.imageUrl).trim() : '',
    isActive: s.isActive === undefined ? 1 : s.isActive ? 1 : 0,
  };
}

export async function find({ activeOnly = false } = {}) {
  const where = activeOnly ? 'WHERE isActive = 1' : '';
  const rows = await query(`SELECT ${COLUMNS} FROM services ${where} ORDER BY createdAt DESC, id DESC`);
  return rows.map(toService);
}

export async function findById(id) {
  const serviceId = toId(id);
  if (!serviceId) return null;
  const rows = await query(`SELECT ${COLUMNS} FROM services WHERE id = ?`, [serviceId]);
  return toService(rows[0]);
}

export async function findByName(name) {
  const rows = await query(`SELECT ${COLUMNS} FROM services WHERE name = ? LIMIT 1`, [name]);
  return toService(rows[0]);
}

export async function create(data) {
  validate(data);
  const row = toRow(data);
  const result = await query('INSERT INTO services SET ?', [row]);
  return findById(result.insertId);
}

// Applies a partial update on top of the existing service, re-validating the result.
export async function update(id, changes) {
  const existing = await findById(id);
  if (!existing) return null;
  const merged = { ...existing, ...changes };
  validate(merged);
  await query('UPDATE services SET ? WHERE id = ?', [toRow(merged), existing._id]);
  return findById(existing._id);
}

// Bookings keep their row; their serviceId becomes NULL (FK ON DELETE SET NULL),
// matching the old behaviour where a deleted service simply stopped populating.
export async function remove(id) {
  await query('DELETE FROM services WHERE id = ?', [toId(id)]);
}

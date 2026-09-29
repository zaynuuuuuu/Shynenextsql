import { query, toId } from '../lib/db';
import { ApiError } from '../lib/apiHandler';

export const STATUSES = ['confirmed', 'completed', 'cancelled', 'no-show'];

const BOOKING_COLUMNS = [
  'id', 'customerId', 'serviceId', 'traderId',
  'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleColor', 'licensePlate',
  'contactName', 'contactPhone', 'contactEmail',
  'date', 'startTime', 'endTime', 'durationMinutes',
  'status', 'notes', 'createdByAdmin', 'createdAt', 'updatedAt',
];

// Relations that can be "populated" (joined) — mirrors the old Mongoose refs.
const RELATIONS = {
  customer: { table: 'users', fk: 'customerId' },
  service: { table: 'services', fk: 'serviceId' },
  trader: { table: 'users', fk: 'traderId' },
};

const trimOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

// Converts a joined row into the same JSON shape Mongoose produced: `_id`, and
// `customer`/`service`/`trader` as either a nested object (when populated) or
// the bare id (when not).
function toBooking(row, populate) {
  const b = { _id: row.id };
  for (const col of BOOKING_COLUMNS) {
    if (col === 'id' || col.endsWith('Id')) continue;
    b[col] = row[col];
  }
  b.createdByAdmin = !!row.createdByAdmin;

  for (const [name, { fk }] of Object.entries(RELATIONS)) {
    const fields = populate[name];
    if (!fields) {
      b[name] = row[fk];
      continue;
    }
    if (row[`${name}__id`] === null) {
      b[name] = null;
      continue;
    }
    const nested = { _id: row[`${name}__id`] };
    for (const f of fields) nested[f] = row[`${name}__${f}`];
    if ('isActive' in nested) nested.isActive = !!nested.isActive;
    b[name] = nested;
  }
  return b;
}

// Builds WHERE clauses from the filters the routes use.
function buildWhere(filter) {
  const clauses = [];
  const params = [];
  if (filter.id !== undefined) { clauses.push('b.id = ?'); params.push(toId(filter.id)); }
  if (filter.date) { clauses.push('b.date = ?'); params.push(filter.date); }
  if (filter.from) { clauses.push('b.date >= ?'); params.push(filter.from); }
  if (filter.to) { clauses.push('b.date <= ?'); params.push(filter.to); }
  if (filter.status) { clauses.push('b.status = ?'); params.push(filter.status); }
  if (filter.notCancelled) clauses.push("b.status <> 'cancelled'");
  if (filter.excludeId !== undefined) { clauses.push('b.id <> ?'); params.push(toId(filter.excludeId)); }
  if (filter.customer !== undefined) { clauses.push('b.customerId = ?'); params.push(toId(filter.customer)); }
  if (filter.trader !== undefined) { clauses.push('b.traderId = ?'); params.push(toId(filter.trader)); }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

// find({ filter, populate: { service: ['name', 'price'], ... } })
// Results are ordered newest first (date DESC, startTime DESC) like the old routes.
export async function find({ filter = {}, populate = {} } = {}) {
  const selects = BOOKING_COLUMNS.map((c) => `b.${c}`);
  const joins = [];
  for (const [name, fields] of Object.entries(populate)) {
    const rel = RELATIONS[name];
    if (!rel) continue;
    joins.push(`LEFT JOIN ${rel.table} AS ${name} ON ${name}.id = b.${rel.fk}`);
    selects.push(`${name}.id AS ${name}__id`);
    for (const f of fields) selects.push(`${name}.${f} AS ${name}__${f}`);
  }

  const where = buildWhere(filter);
  const rows = await query(
    `SELECT ${selects.join(', ')} FROM bookings AS b ${joins.join(' ')} ${where.sql}
     ORDER BY b.date DESC, b.startTime DESC, b.id DESC`,
    where.params
  );
  return rows.map((r) => toBooking(r, populate));
}

export async function findById(id, populate = {}) {
  if (!toId(id)) return null;
  const [booking] = await find({ filter: { id }, populate });
  return booking || null;
}

// Just the time ranges that are already taken on a date — used for conflict checks.
export async function findActiveSlots(date, { excludeId } = {}) {
  const where = buildWhere({ date, notCancelled: true, excludeId });
  return query(`SELECT b.startTime, b.durationMinutes FROM bookings AS b ${where.sql}`, where.params);
}

const REQUIRED = {
  vehicleMake: 'Vehicle make is required',
  vehicleModel: 'Vehicle model is required',
  contactName: 'Contact name is required',
  contactPhone: 'Contact phone is required',
  contactEmail: 'Contact email is required',
};

function validate(data) {
  for (const [field, message] of Object.entries(REQUIRED)) {
    if (!trimOrNull(data[field])) throw new ApiError(message, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date || ''))) throw new ApiError('date must be in YYYY-MM-DD format', 400);
  if (!/^\d{2}:\d{2}$/.test(String(data.startTime || ''))) throw new ApiError('startTime must be in HH:mm format', 400);
  if (data.status && !STATUSES.includes(data.status)) throw new ApiError(`Invalid status "${data.status}"`, 400);
}

export async function create(data) {
  validate(data);
  const row = {
    customerId: data.customerId,
    serviceId: data.serviceId,
    traderId: data.traderId || null,
    vehicleMake: trimOrNull(data.vehicleMake),
    vehicleModel: trimOrNull(data.vehicleModel),
    vehicleYear: trimOrNull(data.vehicleYear),
    vehicleColor: trimOrNull(data.vehicleColor),
    licensePlate: trimOrNull(data.licensePlate),
    contactName: trimOrNull(data.contactName),
    contactPhone: trimOrNull(data.contactPhone),
    contactEmail: trimOrNull(data.contactEmail),
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    status: data.status || 'confirmed',
    notes: trimOrNull(data.notes),
    createdByAdmin: data.createdByAdmin ? 1 : 0,
  };
  const result = await query('INSERT INTO bookings SET ?', [row]);
  return findById(result.insertId);
}

const EDITABLE = [
  'status', 'date', 'startTime', 'endTime', 'vehicleMake', 'vehicleModel', 'vehicleYear',
  'vehicleColor', 'licensePlate', 'contactName', 'contactPhone', 'contactEmail', 'notes',
];

// Partial update; re-validates the merged booking before writing.
export async function update(id, changes) {
  const existing = await findById(id);
  if (!existing) return null;

  const row = {};
  for (const f of EDITABLE) {
    if (changes[f] !== undefined) row[f] = f === 'status' || f === 'date' || f.endsWith('Time') ? changes[f] : trimOrNull(changes[f]);
  }
  validate({ ...existing, ...row });
  if (Object.keys(row).length) await query('UPDATE bookings SET ? WHERE id = ?', [row, existing._id]);
  return findById(existing._id);
}

// Admin — per-trader booking counts (replaces the old Mongo $group aggregation).
export async function countsByTrader() {
  return query(
    `SELECT traderId,
            COUNT(*) AS totalBookings,
            SUM(status = 'confirmed') AS confirmed,
            SUM(status = 'completed') AS completed,
            SUM(status = 'cancelled') AS cancelled,
            SUM(status = 'no-show') AS noShow
     FROM bookings WHERE traderId IS NOT NULL GROUP BY traderId`
  );
}

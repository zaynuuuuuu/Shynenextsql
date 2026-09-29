import { NextResponse } from 'next/server';

// Thrown by route handlers to produce a specific HTTP status + message,
// mirroring the `res.status(x); throw new Error(...)` pattern from the old Express controllers.
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Wraps a route handler: connects to MySQL, runs it, and translates thrown
// errors into the same JSON shape the old Express errorHandler produced.
export function withHandler(fn) {
  return async (request, ctx) => {
    try {
      const connectDB = (await import('./db')).default;
      await connectDB();
      return await fn(request, ctx);
    } catch (err) {
      let statusCode = err.statusCode || 500;
      let message = err.message || 'Server error';

      // MySQL duplicate key — the unique slot key or the unique email key
      if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        if (/uniq_active_slot/.test(err.sqlMessage || '')) {
          message = 'That time slot was just booked by someone else. Please choose another slot.';
        } else {
          const key = (err.sqlMessage || '').match(/for key '(?:[^.']+\.)?(?:uniq_)?([^']+)'/);
          message = `Duplicate value for field: ${key ? key[1] : 'unknown'}`;
        }
      }

      // MySQL foreign key pointing at a row that doesn't exist
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 404;
        message = 'Resource not found';
      }

      if (statusCode >= 500) console.error(err);

      return NextResponse.json({ message }, { status: statusCode });
    }
  };
}

// Strips $-prefixed and dotted keys from user-supplied objects. Queries are fully
// parameterized now, so this is just defensive input hygiene carried over from the
// old express-mongo-sanitize setup.
export function sanitize(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitize(value);
  }
  return clean;
}

export async function readJson(request) {
  const body = await request.json().catch(() => ({}));
  return sanitize(body);
}

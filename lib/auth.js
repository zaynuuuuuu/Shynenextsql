import jwt from 'jsonwebtoken';
import { ApiError } from './apiHandler';

export function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Reads + verifies the Bearer token on a request and loads the current user.
// Returns null if there's no token at all (caller decides whether that's ok).
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError('Not authorized, token invalid or expired', 401);
  }

  const { findById } = await import('../models/User');
  const user = await findById(decoded.id);
  if (!user) throw new ApiError('Not authorized, user no longer exists', 401);
  return user;
}

// Throws 401 if not logged in; returns the user otherwise.
export async function requireUser(request) {
  const user = await getAuthUser(request);
  if (!user) throw new ApiError('Not authorized, no token provided', 401);
  return user;
}

export async function requireRole(request, role) {
  const user = await requireUser(request);
  if (user.role !== role) throw new ApiError(`Access denied: ${role} role required`, 403);
  return user;
}

export async function requireAnyRole(request, roles) {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) throw new ApiError('Access denied', 403);
  return user;
}

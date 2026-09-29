import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { generateToken } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only login endpoint — rejects non-admin credentials even if valid
export const POST = withHandler(async (request) => {
  const { email, password } = await readJson(request);

  const user = await User.findByEmail(email, { withPassword: true });
  if (!user || !(await User.matchPassword(user, password))) {
    throw new ApiError('Invalid email or password', 401);
  }
  if (user.role !== 'admin') {
    throw new ApiError('This account does not have admin access', 403);
  }

  return NextResponse.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id, user.role),
  });
});

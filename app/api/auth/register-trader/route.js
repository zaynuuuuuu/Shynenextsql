import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { generateToken } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(async (request) => {
  const { name, email, password, phone, businessName } = await readJson(request);

  if (!name || !email || !password || password.length < 6) {
    throw new ApiError('Name, email, and a password of at least 6 characters are required', 400);
  }

  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError('An account with this email already exists', 409);

  const user = await User.create({ name, email, password, phone, businessName, role: 'trader' });

  return NextResponse.json(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      token: generateToken(user._id, user.role),
    },
    { status: 201 }
  );
});

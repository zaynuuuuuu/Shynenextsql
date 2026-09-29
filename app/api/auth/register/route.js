import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { generateToken } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(async (request) => {
  const { name, email, password, phone } = await readJson(request);

  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError('An account with this email already exists', 409);

  const user = await User.create({ name, email, password, phone, role: 'customer' });

  return NextResponse.json(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    },
    { status: 201 }
  );
});

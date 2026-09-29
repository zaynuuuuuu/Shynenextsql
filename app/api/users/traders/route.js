import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { requireRole } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — list all traders
export const GET = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const traders = await User.findByRole('trader');
  return NextResponse.json(traders);
});

// Admin — manually create a trader account
export const POST = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const { name, email, phone, businessName, password } = await readJson(request);

  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError('An account with this email already exists', 409);

  // If the admin doesn't set a password, generate one — the trader can use
  // "forgot password" to set their own later, same pattern as walk-in customers.
  const finalPassword = password && password.length >= 6 ? password : crypto.randomBytes(9).toString('base64url');

  const trader = await User.create({
    name,
    email,
    phone,
    businessName,
    password: finalPassword,
    role: 'trader',
  });

  return NextResponse.json(
    {
      _id: trader._id,
      name: trader.name,
      email: trader.email,
      phone: trader.phone,
      businessName: trader.businessName,
      role: trader.role,
      createdAt: trader.createdAt,
    },
    { status: 201 }
  );
});

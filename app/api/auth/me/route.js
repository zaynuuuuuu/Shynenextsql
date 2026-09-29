import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { withHandler } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler(async (request) => {
  const user = await requireUser(request);
  return NextResponse.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    businessName: user.businessName,
  });
});

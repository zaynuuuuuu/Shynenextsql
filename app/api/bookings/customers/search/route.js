import { NextResponse } from 'next/server';
import * as User from '../../../../../models/User';
import { requireAnyRole } from '../../../../../lib/auth';
import { withHandler } from '../../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin or trader — search customers (for the "existing customer" lookup in booking forms)
export const GET = withHandler(async (request) => {
  await requireAnyRole(request, ['admin', 'trader']);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json([]);

  const customers = await User.searchCustomers(q, 10);
  return NextResponse.json(customers);
});

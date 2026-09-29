import { NextResponse } from 'next/server';
import * as Service from '../../../../models/Service';
import { requireRole } from '../../../../lib/auth';
import { withHandler } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — get ALL services regardless of active status
export const GET = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const services = await Service.find();
  return NextResponse.json(services);
});

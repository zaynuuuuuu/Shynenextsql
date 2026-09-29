import { NextResponse } from 'next/server';
import * as Service from '../../../models/Service';
import { requireRole } from '../../../lib/auth';
import { withHandler, readJson } from '../../../lib/apiHandler';

export const runtime = 'nodejs';
// GET doesn't read the request, so without this Next.js would prerender the
// service list once at build time instead of querying the DB on every request.
export const dynamic = 'force-dynamic';

// Public — get all ACTIVE services (for homepage)
export const GET = withHandler(async () => {
  const services = await Service.find({ activeOnly: true });
  return NextResponse.json(services);
});

// Admin — create service
export const POST = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const { name, description, price, durationMinutes, imageUrl, isActive } = await readJson(request);
  const service = await Service.create({
    name,
    description,
    price,
    durationMinutes,
    imageUrl,
    isActive: isActive !== undefined ? isActive : true,
  });
  return NextResponse.json(service, { status: 201 });
});

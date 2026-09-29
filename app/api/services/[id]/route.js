import { NextResponse } from 'next/server';
import * as Service from '../../../../models/Service';
import { requireRole } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get single service by id (public — kept after /admin in the old Express router so
// the literal route took priority; separate folders make that ordering automatic here)
export const GET = withHandler(async (request, { params }) => {
  const service = await Service.findById(params.id);
  if (!service) throw new ApiError('Service not found', 404);
  return NextResponse.json(service);
});

// Admin — update service
export const PUT = withHandler(async (request, { params }) => {
  await requireRole(request, 'admin');
  const body = await readJson(request);
  const fields = ['name', 'description', 'price', 'durationMinutes', 'imageUrl', 'isActive'];
  const changes = {};
  fields.forEach((f) => {
    if (body[f] !== undefined) changes[f] = body[f];
  });

  const service = await Service.update(params.id, changes);
  if (!service) throw new ApiError('Service not found', 404);
  return NextResponse.json(service);
});

// Admin — hard delete a service
export const DELETE = withHandler(async (request, { params }) => {
  await requireRole(request, 'admin');
  const service = await Service.findById(params.id);
  if (!service) throw new ApiError('Service not found', 404);
  await Service.remove(service._id);
  return NextResponse.json({ message: 'Service deleted' });
});

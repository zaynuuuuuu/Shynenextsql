import { NextResponse } from 'next/server';
import * as Service from '../../../../../models/Service';
import { requireRole } from '../../../../../lib/auth';
import { withHandler, ApiError } from '../../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — archive (soft-delete) a service by setting isActive=false
export const PATCH = withHandler(async (request, { params }) => {
  await requireRole(request, 'admin');
  const service = await Service.update(params.id, { isActive: false });
  if (!service) throw new ApiError('Service not found', 404);
  return NextResponse.json(service);
});

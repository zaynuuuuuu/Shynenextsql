import { NextResponse } from 'next/server';
import * as Booking from '../../../../models/Booking';
import { requireRole } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — update a booking's status or details
export const PUT = withHandler(async (request, { params }) => {
  await requireRole(request, 'admin');
  const body = await readJson(request);
  const editableFields = [
    'status', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleColor',
    'licensePlate', 'contactName', 'contactPhone', 'contactEmail', 'notes',
  ];
  const changes = {};
  editableFields.forEach((f) => {
    if (body[f] !== undefined) changes[f] = body[f];
  });

  const booking = await Booking.update(params.id, changes);
  if (!booking) throw new ApiError('Booking not found', 404);
  return NextResponse.json(booking);
});

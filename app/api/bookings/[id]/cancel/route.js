import { NextResponse } from 'next/server';
import * as Booking from '../../../../../models/Booking';
import { requireUser } from '../../../../../lib/auth';
import { withHandler, ApiError } from '../../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Customer (or admin) — cancel own upcoming booking
export const PATCH = withHandler(async (request, { params }) => {
  const user = await requireUser(request);
  const booking = await Booking.findById(params.id);
  if (!booking) throw new ApiError('Booking not found', 404);
  if (String(booking.customer) !== String(user._id) && user.role !== 'admin') {
    throw new ApiError('You can only cancel your own bookings', 403);
  }
  if (booking.status !== 'confirmed') {
    throw new ApiError(`Cannot cancel a booking with status "${booking.status}"`, 400);
  }
  const updated = await Booking.update(booking._id, { status: 'cancelled' });
  return NextResponse.json(updated);
});

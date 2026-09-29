import { NextResponse } from 'next/server';
import * as Booking from '../../../../../models/Booking';
import { requireUser } from '../../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../../lib/apiHandler';
import { rangesOverlap, toMinutes, BUSINESS_HOURS } from '../../../../../lib/slots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Customer (or admin) — reschedule own upcoming booking to a new date/time
export const PATCH = withHandler(async (request, { params }) => {
  const user = await requireUser(request);
  const { date, startTime } = await readJson(request);

  const booking = await Booking.findById(params.id);
  if (!booking) throw new ApiError('Booking not found', 404);
  if (String(booking.customer) !== String(user._id) && user.role !== 'admin') {
    throw new ApiError('You can only reschedule your own bookings', 403);
  }
  if (booking.status !== 'confirmed') {
    throw new ApiError(`Cannot reschedule a booking with status "${booking.status}"`, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) throw new ApiError('date must be in YYYY-MM-DD format', 400);
  if (!/^\d{2}:\d{2}$/.test(String(startTime || ''))) throw new ApiError('startTime must be in HH:mm format', 400);

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) throw new ApiError('Cannot reschedule to a time slot in the past', 400);

  const startMin = toMinutes(startTime);
  const endMin = startMin + booking.durationMinutes;
  if (endMin > BUSINESS_HOURS.endHour * 60) {
    throw new ApiError('This service does not fit before closing time at that start time. Please pick an earlier slot.', 400);
  }

  const sameDayBookings = await Booking.findActiveSlots(date, { excludeId: booking._id });
  const conflict = sameDayBookings.some((b) =>
    rangesOverlap(startTime, booking.durationMinutes, b.startTime, b.durationMinutes)
  );
  if (conflict) throw new ApiError('That time slot is no longer available. Please pick another.', 409);

  const updated = await Booking.update(booking._id, {
    date,
    startTime,
    endTime: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
  });

  return NextResponse.json(updated);
});

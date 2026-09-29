import { NextResponse } from 'next/server';
import * as Service from '../../../models/Service';
import * as Booking from '../../../models/Booking';
import { generateDaySlots, rangesOverlap, toMinutes, BUSINESS_HOURS } from '../../../lib/slots';
import { withHandler, ApiError } from '../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get open time slots for a given service + date
export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');

  if (!serviceId || !date) throw new ApiError('serviceId and date are required', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError('date must be in YYYY-MM-DD format', 400);

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) throw new ApiError('Service not found or is not currently active', 404);

  // Don't allow booking in the past
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json({ date, serviceId, availableSlots: [] });
  }

  const existingBookings = await Booking.findActiveSlots(date);

  const allSlots = generateDaySlots();
  const closingMin = BUSINESS_HOURS.endHour * 60;

  const availableSlots = allSlots.filter((slot) => {
    // Don't offer a slot that would run past business hours (this check was
    // missing in the original Express version — the comment existed but the
    // actual filter didn't)
    if (toMinutes(slot) + service.durationMinutes > closingMin) return false;
    const wouldConflict = existingBookings.some((b) =>
      rangesOverlap(slot, service.durationMinutes, b.startTime, b.durationMinutes)
    );
    return !wouldConflict;
  });

  return NextResponse.json({ date, serviceId, durationMinutes: service.durationMinutes, availableSlots });
});

import { NextResponse } from 'next/server';
import * as Booking from '../../../../../models/Booking';
import { requireRole } from '../../../../../lib/auth';
import { withHandler } from '../../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Trader — list bookings they've submitted
export const GET = withHandler(async (request) => {
  const trader = await requireRole(request, 'trader');
  const bookings = await Booking.find({
    filter: { trader: trader._id },
    populate: { service: ['name', 'price', 'durationMinutes'] },
  });

  return NextResponse.json(bookings);
});

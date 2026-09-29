import { NextResponse } from 'next/server';
import * as Booking from '../../../../models/Booking';
import { requireUser } from '../../../../lib/auth';
import { withHandler } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Customer — list own upcoming + past bookings
export const GET = withHandler(async (request) => {
  const user = await requireUser(request);
  const bookings = await Booking.find({
    filter: { customer: user._id },
    populate: { service: ['name', 'price', 'durationMinutes', 'imageUrl'] },
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.date >= today && b.status === 'confirmed');
  const past = bookings.filter((b) => b.date < today || b.status !== 'confirmed');

  return NextResponse.json({ upcoming, past });
});

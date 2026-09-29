import { NextResponse } from 'next/server';
import * as Booking from '../../../models/Booking';
import { createBookingWithConflictCheck } from '../../../lib/createBooking';
import { requireUser, requireRole } from '../../../lib/auth';
import { withHandler, readJson } from '../../../lib/apiHandler';
import sendEmail from '../../../lib/sendEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Customer — create a booking
export const POST = withHandler(async (request) => {
  const user = await requireUser(request);
  const {
    serviceId,
    date,
    startTime,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    contactName,
    contactPhone,
    contactEmail,
    notes,
  } = await readJson(request);

  const booking = await createBookingWithConflictCheck({
    customerId: user._id,
    serviceId,
    date,
    startTime,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    contactName: contactName || user.name,
    contactPhone: contactPhone || user.phone,
    contactEmail: contactEmail || user.email,
    notes,
  });

  sendEmail({
    to: booking.contactEmail,
    subject: 'Booking Confirmed',
    html: `<p>Your booking is confirmed for ${booking.date} at ${booking.startTime}.</p>`,
  }).catch((e) => console.error('Email send failed:', e.message));

  return NextResponse.json(booking, { status: 201 });
});

// Admin — list all bookings with filters (date, status, customer search, trader)
export const GET = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');
  const customer = searchParams.get('customer');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const trader = searchParams.get('trader');

  // from/to take precedence over an exact date, as before
  const filter = {};
  if (from || to) {
    if (from) filter.from = from;
    if (to) filter.to = to;
  } else if (date) {
    filter.date = date;
  }
  if (status) filter.status = status;
  if (trader) filter.trader = trader;

  let bookings = await Booking.find({
    filter,
    populate: {
      customer: ['name', 'email', 'phone'],
      service: ['name', 'price', 'durationMinutes'],
      trader: ['name', 'email', 'businessName'],
    },
  });

  if (customer) {
    const term = customer.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        b.contactName.toLowerCase().includes(term) ||
        b.contactEmail.toLowerCase().includes(term) ||
        b.contactPhone?.toLowerCase().includes(term)
    );
  }

  return NextResponse.json(bookings);
});

import { NextResponse } from 'next/server';
import { createBookingWithConflictCheck, resolveCustomer } from '../../../../lib/createBooking';
import { requireRole } from '../../../../lib/auth';
import { withHandler, readJson } from '../../../../lib/apiHandler';
import sendEmail from '../../../../lib/sendEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Trader — create a booking on behalf of an existing or brand-new customer
export const POST = withHandler(async (request) => {
  const trader = await requireRole(request, 'trader');
  const {
    existingCustomerId,
    newCustomer,
    serviceId,
    date,
    startTime,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    notes,
  } = await readJson(request);

  const customer = await resolveCustomer({ existingCustomerId, newCustomer });
  const contact = { contactName: customer.name, contactPhone: customer.phone, contactEmail: customer.email };

  const booking = await createBookingWithConflictCheck({
    customerId: customer._id,
    serviceId,
    date,
    startTime,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    ...contact,
    notes,
    createdByAdmin: false,
    traderId: trader._id,
  });

  sendEmail({
    to: booking.contactEmail,
    subject: 'Booking Confirmed',
    html: `<p>Your booking is confirmed for ${booking.date} at ${booking.startTime}.</p>`,
  }).catch((e) => console.error('Email send failed:', e.message));

  return NextResponse.json(booking, { status: 201 });
});

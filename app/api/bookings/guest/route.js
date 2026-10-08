import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { createBookingWithConflictCheck } from '../../../../lib/createBooking';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';
import sendEmail from '../../../../lib/sendEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public — book without logging in. The customer account is created from the form
// (name / phone / email / password) so they can log in later to see the booking.
// If the email already belongs to a customer, the password must match that account,
// so nobody can attach bookings to someone else's account.
export const POST = withHandler(async (request) => {
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
    password,
  } = await readJson(request);

  if (!contactName || !String(contactName).trim()) throw new ApiError('Full name is required', 400);
  if (!contactPhone || !String(contactPhone).trim()) throw new ApiError('Phone is required', 400);
  if (!contactEmail || !String(contactEmail).trim()) throw new ApiError('Email is required', 400);
  if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters', 400);

  let accountCreated = false;
  let customer = await User.findByEmail(contactEmail, { withPassword: true });
  if (customer) {
    if (customer.role !== 'customer' || !(await User.matchPassword(customer, password))) {
      throw new ApiError(
        'An account with this email already exists. Enter that account\'s password, or log in first.',
        409
      );
    }
  } else {
    customer = await User.create({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      password,
      role: 'customer',
    });
    accountCreated = true;
  }

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
    contactName,
    contactPhone,
    contactEmail,
    notes,
  });

  sendEmail({
    to: booking.contactEmail,
    subject: 'Booking Confirmed',
    html: `<p>Your booking is confirmed for ${booking.date} at ${booking.startTime}.</p>
           <p>Log in with this email address to view or manage your booking.</p>`,
  }).catch((e) => console.error('Email send failed:', e.message));

  return NextResponse.json({ ...booking, accountCreated }, { status: 201 });
});

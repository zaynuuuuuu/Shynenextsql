import { NextResponse } from 'next/server';
import * as User from '../../../../models/User';
import { createBookingWithConflictCheck, resolveCustomer } from '../../../../lib/createBooking';
import { requireRole } from '../../../../lib/auth';
import { withHandler, readJson, ApiError } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — create a manual booking (walk-in/phone), for an existing or brand-new customer.
// Optionally attributes the booking to a trader (e.g. the admin took a phone call
// that a trader referred) so it still counts toward that trader's stats.
export const POST = withHandler(async (request) => {
  await requireRole(request, 'admin');
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
    traderId, // optional — attribute this booking to a trader
  } = await readJson(request);

  const customer = await resolveCustomer({ existingCustomerId, newCustomer });
  const contact = { contactName: customer.name, contactPhone: customer.phone, contactEmail: customer.email };

  let resolvedTraderId = null;
  if (traderId) {
    const trader = await User.findById(traderId);
    if (!trader || trader.role !== 'trader') throw new ApiError('traderId does not match any trader', 404);
    resolvedTraderId = trader._id;
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
    ...contact,
    notes,
    createdByAdmin: true,
    traderId: resolvedTraderId,
  });

  return NextResponse.json(booking, { status: 201 });
});

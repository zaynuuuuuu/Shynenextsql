import crypto from 'crypto';
import * as Booking from '../models/Booking';
import * as Service from '../models/Service';
import * as User from '../models/User';
import { toId } from './db';
import { rangesOverlap, toMinutes, BUSINESS_HOURS } from './slots';
import { ApiError } from './apiHandler';

// Shared conflict check + create, used by the customer, admin, and trader booking routes.
// Re-validates against the DB right before insert (not just relying on the availability
// endpoint the client called earlier) to close the race-condition window, and additionally
// relies on the unique active-slot key on the bookings table as a hard DB-level backstop.
export async function createBookingWithConflictCheck({
  customerId,
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
  createdByAdmin,
  traderId,
}) {
  const service = await Service.findById(serviceId);
  if (!service) throw new ApiError('Service not found', 404);
  if (!service.isActive && !createdByAdmin) {
    throw new ApiError('This service is not currently available', 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) throw new ApiError('date must be in YYYY-MM-DD format', 400);
  if (!/^\d{2}:\d{2}$/.test(String(startTime || ''))) throw new ApiError('startTime must be in HH:mm format', 400);

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) throw new ApiError('Cannot book a time slot in the past', 400);

  const durationMinutes = service.durationMinutes;
  const startMin = toMinutes(startTime);
  const endMin = startMin + durationMinutes;

  if (endMin > BUSINESS_HOURS.endHour * 60) {
    throw new ApiError('This service does not fit before closing time at that start time. Please pick an earlier slot.', 400);
  }

  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

  // Re-check overlap against current state of the DB (closes most of the race window)
  const sameDayBookings = await Booking.findActiveSlots(date);
  const conflict = sameDayBookings.some((b) =>
    rangesOverlap(startTime, durationMinutes, b.startTime, b.durationMinutes)
  );
  if (conflict) throw new ApiError('That time slot is no longer available. Please pick another.', 409);

  // Insert — if two requests race past the check above simultaneously, the unique
  // key on the active slot will reject the loser with ER_DUP_ENTRY, which
  // withHandler translates into a friendly 409 message.
  return Booking.create({
    customerId,
    serviceId: service._id,
    date,
    startTime,
    endTime,
    durationMinutes,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    licensePlate,
    contactName,
    contactPhone,
    contactEmail,
    notes,
    createdByAdmin: !!createdByAdmin,
    traderId: traderId || null,
  });
}

// Shared "find or create a customer" logic used by both the admin manual-booking
// route and the trader booking route.
export async function resolveCustomer({ existingCustomerId, newCustomer }) {
  if (existingCustomerId) {
    const customer = toId(existingCustomerId) ? await User.findById(existingCustomerId) : null;
    if (!customer) throw new ApiError('existingCustomerId does not match any customer', 404);
    return customer;
  }

  if (!newCustomer || !newCustomer.email || !newCustomer.name) {
    throw new ApiError('Provide either existingCustomerId or a newCustomer with name and email', 400);
  }

  let customer = await User.findByEmail(newCustomer.email);
  if (!customer) {
    // Walk-in / trader-referred customers get a random password; they can use
    // "forgot password" to set their own later.
    const randomPassword = crypto.randomBytes(9).toString('base64url');
    customer = await User.create({
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      password: randomPassword,
      role: 'customer',
    });
  }
  return customer;
}

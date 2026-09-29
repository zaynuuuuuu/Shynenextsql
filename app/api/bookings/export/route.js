import { Parser } from 'json2csv';
import * as Booking from '../../../../models/Booking';
import { requireRole } from '../../../../lib/auth';
import { withHandler } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — export bookings as CSV (respects same filters as GET /api/bookings)
export const GET = withHandler(async (request) => {
  await requireRole(request, 'admin');
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');
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

  const bookings = await Booking.find({
    filter,
    populate: { service: ['name', 'price'], trader: ['name', 'businessName'] },
  });

  const rows = bookings.map((b) => ({
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    service: b.service?.name || '',
    price: b.service?.price ?? '',
    status: b.status,
    customerName: b.contactName,
    customerEmail: b.contactEmail,
    customerPhone: b.contactPhone,
    vehicle: `${b.vehicleYear || ''} ${b.vehicleMake} ${b.vehicleModel}`.trim(),
    licensePlate: b.licensePlate || '',
    notes: b.notes || '',
    createdByAdmin: b.createdByAdmin,
    trader: b.trader ? (b.trader.businessName || b.trader.name) : '',
  }));

  const parser = new Parser({
    fields: [
      'date', 'startTime', 'endTime', 'service', 'price', 'status',
      'customerName', 'customerEmail', 'customerPhone', 'vehicle',
      'licensePlate', 'notes', 'createdByAdmin', 'trader',
    ],
  });
  const csv = parser.parse(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bookings-export-${Date.now()}.csv"`,
    },
  });
});

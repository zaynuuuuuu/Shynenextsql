import { NextResponse } from 'next/server';
import * as Booking from '../../../../models/Booking';
import * as User from '../../../../models/User';
import { requireRole } from '../../../../lib/auth';
import { withHandler } from '../../../../lib/apiHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin — booking counts per trader (how many bookings each trader has sent)
export const GET = withHandler(async (request) => {
  await requireRole(request, 'admin');

  const stats = await Booking.countsByTrader();
  const statsByTrader = new Map(stats.map((s) => [String(s.traderId), s]));

  // Include every trader, even ones with zero bookings so far
  const traders = await User.findByRole('trader');

  const result = traders.map((t) => {
    const s = statsByTrader.get(String(t._id));
    return {
      trader: { _id: t._id, name: t.name, email: t.email, phone: t.phone, businessName: t.businessName, createdAt: t.createdAt },
      totalBookings: Number(s?.totalBookings || 0),
      confirmed: Number(s?.confirmed || 0),
      completed: Number(s?.completed || 0),
      cancelled: Number(s?.cancelled || 0),
      noShow: Number(s?.noShow || 0),
    };
  });

  result.sort((a, b) => b.totalBookings - a.totalBookings);

  return NextResponse.json(result);
});

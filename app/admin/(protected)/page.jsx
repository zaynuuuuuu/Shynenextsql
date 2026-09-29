import AdminBookings from './bookings/page';

// Mirrors the old React Router setup where the index route (/admin) rendered
// the same bookings view as /admin/bookings.
export default function AdminIndex() {
  return <AdminBookings />;
}

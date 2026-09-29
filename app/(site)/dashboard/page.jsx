'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../lib/apiClient';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import ProtectedRoute from '../../../components/ProtectedRoute';

const statusColors = {
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  'no-show': 'bg-red-100 text-red-700',
};

function CustomerDashboardInner() {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [actionError, setActionError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/bookings/mine').then((res) => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    setActionError('');
    try {
      await api.patch(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel booking.');
    }
  };

  const openReschedule = (booking) => {
    setRescheduling(booking);
    setNewDate(booking.date);
    setNewTime('');
    setSlots([]);
  };

  useEffect(() => {
    if (!rescheduling || !newDate) return;
    api
      .get('/availability', { params: { serviceId: rescheduling.service._id, date: newDate } })
      .then((res) => setSlots(res.data.availableSlots))
      .catch(() => setSlots([]));
  }, [newDate, rescheduling]);

  const submitReschedule = async () => {
    setActionError('');
    try {
      await api.patch(`/bookings/${rescheduling._id}/reschedule`, { date: newDate, startTime: newTime });
      setRescheduling(null);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not reschedule booking.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading your bookings…" />;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
        {actionError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{actionError}</div>
        )}
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-3">Upcoming</h2>
        {data.upcoming.length === 0 ? (
          <EmptyState title="No upcoming bookings" description="Book a service from the homepage to get started." />
        ) : (
          <div className="space-y-3">
            {data.upcoming.map((b) => (
              <div key={b._id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium">{b.service?.name}</p>
                  <p className="text-sm text-gray-500">{b.date} at {b.startTime}</p>
                  <p className="text-xs text-gray-400">{b.vehicleYear} {b.vehicleMake} {b.vehicleModel}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{b.status}</span>
                  <button onClick={() => openReschedule(b)} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    Reschedule
                  </button>
                  <button onClick={() => handleCancel(b._id)} className="text-xs px-3 py-1.5 border rounded-lg text-red-600 hover:bg-red-50">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Past</h2>
        {data.past.length === 0 ? (
          <EmptyState title="No past bookings yet" />
        ) : (
          <div className="space-y-3">
            {data.past.map((b) => (
              <div key={b._id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.service?.name}</p>
                  <p className="text-sm text-gray-500">{b.date} at {b.startTime}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {rescheduling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <h3 className="font-semibold mb-3">Reschedule booking</h3>
            <label className="text-sm font-medium">New date</label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full mt-1 mb-3 border rounded-lg px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium">New time</label>
            <div className="grid grid-cols-3 gap-2 mt-1 mb-4 max-h-40 overflow-y-auto">
              {slots.length === 0 && <p className="text-xs text-gray-400 col-span-3">No open slots this day.</p>}
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTime(t)}
                  className={`text-sm py-2 rounded-lg border ${newTime === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRescheduling(null)} className="flex-1 border rounded-lg py-2 text-sm">
                Cancel
              </button>
              <button
                disabled={!newTime}
                onClick={submitReschedule}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <ProtectedRoute>
      <CustomerDashboardInner />
    </ProtectedRoute>
  );
}

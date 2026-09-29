'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../../lib/apiClient';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import EmptyState from '../../../../components/EmptyState';

const statusColors = {
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  'no-show': 'bg-red-100 text-red-700',
};

export default function AdminTraderBookings() {
  const [stats, setStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [selectedTrader, setSelectedTrader] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    setLoadingStats(true);
    api.get('/bookings/trader-stats').then((res) => setStats(res.data)).finally(() => setLoadingStats(false));
  }, []);

  const viewTrader = (traderStat) => {
    setSelectedTrader(traderStat.trader);
    setLoadingBookings(true);
    api
      .get('/bookings', { params: { trader: traderStat.trader._id } })
      .then((res) => setBookings(res.data))
      .finally(() => setLoadingBookings(false));
  };

  const totalSent = stats.reduce((sum, s) => sum + s.totalBookings, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Trader Bookings</h1>
      <p className="text-sm text-gray-500 mb-6">
        {totalSent} booking{totalSent === 1 ? '' : 's'} sent in total by {stats.length} trader{stats.length === 1 ? '' : 's'}.
      </p>

      {loadingStats ? (
        <LoadingSpinner />
      ) : stats.length === 0 ? (
        <EmptyState title="No traders yet" description="Once traders sign up and submit bookings, their volume will show here." />
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Trader</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3 text-right">Total sent</th>
                <th className="px-4 py-3 text-right">Confirmed</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3 text-right">Cancelled</th>
                <th className="px-4 py-3 text-right">No-show</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.trader._id} className={`border-t ${selectedTrader?._id === s.trader._id ? 'bg-brand-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{s.trader.name}</td>
                  <td className="px-4 py-3">{s.trader.businessName || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{s.totalBookings}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.confirmed}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.completed}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.cancelled}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.noShow}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => viewTrader(s)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">
                      View bookings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTrader && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">
              Bookings from {selectedTrader.name}{selectedTrader.businessName ? ` (${selectedTrader.businessName})` : ''}
            </h2>
            <button onClick={() => setSelectedTrader(null)} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">
              Close
            </button>
          </div>

          {loadingBookings ? (
            <LoadingSpinner />
          ) : bookings.length === 0 ? (
            <EmptyState title="No bookings from this trader yet" />
          ) : (
            <div className="bg-white border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t align-top">
                      <td className="px-4 py-3">{b.date}<br /><span className="text-gray-400">{b.startTime}</span></td>
                      <td className="px-4 py-3">{b.contactName}<br /><span className="text-gray-400">{b.contactPhone}</span></td>
                      <td className="px-4 py-3">{b.service?.name}</td>
                      <td className="px-4 py-3">{b.vehicleYear} {b.vehicleMake} {b.vehicleModel}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

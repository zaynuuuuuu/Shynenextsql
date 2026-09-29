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

const STATUSES = ['confirmed', 'completed', 'cancelled', 'no-show'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', status: '', customer: '' });
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.status) params.status = filters.status;
    if (filters.customer) params.customer = filters.customer;
    api.get('/bookings', { params }).then((res) => setBookings(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters.date, filters.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleStatusChange = async (booking, status) => {
    await api.put(`/bookings/${booking._id}`, { status });
    load();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.date) params.set('date', filters.date);
    if (filters.status) params.set('status', filters.status);
    const token = localStorage.getItem('token');
    // Same-origin export endpoint — attach token as query param workaround isn't needed
    // since fetch below sends the Authorization header directly.
    fetch(`/api/bookings/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-export-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <button onClick={handleExport} className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50">
          Export CSV
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          placeholder="Search customer name/email/phone…"
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          value={filters.customer}
          onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
        />
        <button className="text-sm px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Search</button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Trader</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-t align-top">
                  <td className="px-4 py-3">{b.date}<br /><span className="text-gray-400">{b.startTime}</span></td>
                  <td className="px-4 py-3">{b.contactName}<br /><span className="text-gray-400">{b.contactPhone}</span></td>
                  <td className="px-4 py-3">{b.service?.name}</td>
                  <td className="px-4 py-3">{b.vehicleYear} {b.vehicleMake} {b.vehicleModel}</td>
                  <td className="px-4 py-3 text-gray-500">{b.trader ? (b.trader.businessName || b.trader.name) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={b.status}
                      onChange={(e) => handleStatusChange(b, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

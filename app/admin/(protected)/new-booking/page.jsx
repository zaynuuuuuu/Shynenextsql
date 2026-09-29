'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../../lib/apiClient';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdminNewBooking() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [startTime, setStartTime] = useState('');

  const [customerMode, setCustomerMode] = useState('new'); // 'new' | 'existing'
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  // Trader attribution — optional. Lets the admin credit a phone/walk-in
  // booking to the trader who referred it, so it still counts in their stats.
  const [traders, setTraders] = useState([]);
  const [traderId, setTraderId] = useState('');

  const [vehicle, setVehicle] = useState({ vehicleMake: '', vehicleModel: '', vehicleYear: '', vehicleColor: '', licensePlate: '' });
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services').then((res) => setServices(res.data));
    api.get('/users/traders').then((res) => setTraders(res.data)).catch(() => setTraders([]));
  }, []);

  useEffect(() => {
    if (!serviceId) { setSlots([]); return; }
    api.get('/availability', { params: { serviceId, date } }).then((res) => setSlots(res.data.availableSlots));
  }, [serviceId, date]);

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return; }
    const timer = setTimeout(() => {
      api.get('/bookings/customers/search', { params: { q: customerSearch } }).then((res) => setCustomerResults(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!serviceId || !startTime) {
      setError('Please select a service and time slot.');
      return;
    }
    if (customerMode === 'existing' && !selectedCustomer) {
      setError('Please select an existing customer.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        serviceId,
        date,
        startTime,
        ...vehicle,
        notes,
        ...(traderId ? { traderId } : {}),
        ...(customerMode === 'existing'
          ? { existingCustomerId: selectedCustomer._id }
          : { newCustomer }),
      };
      await api.post('/bookings/admin', payload);
      setSuccess('Booking created successfully.');
      setStartTime('');
      setVehicle({ vehicleMake: '', vehicleModel: '', vehicleYear: '', vehicleColor: '', licensePlate: '' });
      setNotes('');
      setSelectedCustomer(null);
      setNewCustomer({ name: '', email: '', phone: '' });
      setCustomerSearch('');
      setTraderId('');
      api.get('/availability', { params: { serviceId, date } }).then((res) => setSlots(res.data.availableSlots));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">New Manual Booking</h1>
      <p className="text-sm text-gray-500 mb-6">For walk-ins or phone bookings.</p>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 max-w-2xl">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 max-w-2xl">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-5 max-w-2xl">
        <div>
          <label className="text-sm font-medium">Service</label>
          <select
            required
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Select a service…</option>
            {services.map((s) => <option key={s._id} value={s._id}>{s.name} — ${s.price}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            min={todayStr()}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {serviceId && (
          <div>
            <label className="text-sm font-medium">Time slot</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {slots.length === 0 && <p className="text-xs text-gray-400 col-span-4">No open slots this day.</p>}
              {slots.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setStartTime(t)}
                  className={`text-sm py-2 rounded-lg border ${startTime === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-2">Customer</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setCustomerMode('new')} className={`text-xs px-3 py-1.5 rounded-full border ${customerMode === 'new' ? 'bg-gray-900 text-white' : ''}`}>
              New customer
            </button>
            <button type="button" onClick={() => setCustomerMode('existing')} className={`text-xs px-3 py-1.5 rounded-full border ${customerMode === 'existing' ? 'bg-gray-900 text-white' : ''}`}>
              Existing customer
            </button>
          </div>

          {customerMode === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input required placeholder="Name" className="border rounded-lg px-3 py-2 text-sm" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
              <input required type="email" placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
              <input placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
          ) : (
            <div>
              <input
                placeholder="Search by name, email, or phone…"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerResults.length > 0 && (
                <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {customerResults.map((c) => (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(`${c.name} (${c.email})`); setCustomerResults([]); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {c.name} — {c.email}
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && <p className="text-xs text-green-600 mt-1">Selected: {selectedCustomer.name}</p>}
            </div>
          )}
        </div>

        {/* New: attribute this booking to a trader */}
        <div>
          <label className="text-sm font-medium block mb-2">
            Trader <span className="text-gray-400 font-normal">(optional — credit a referring trader)</span>
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={traderId}
            onChange={(e) => setTraderId(e.target.value)}
          >
            <option value="">No trader — walk-in / phone booking</option>
            {traders.map((t) => (
              <option key={t._id} value={t._id}>
                {t.businessName ? `${t.name} (${t.businessName})` : t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Vehicle</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input required placeholder="Make *" className="border rounded-lg px-3 py-2 text-sm" value={vehicle.vehicleMake} onChange={(e) => setVehicle({ ...vehicle, vehicleMake: e.target.value })} />
            <input required placeholder="Model *" className="border rounded-lg px-3 py-2 text-sm" value={vehicle.vehicleModel} onChange={(e) => setVehicle({ ...vehicle, vehicleModel: e.target.value })} />
            <input placeholder="Year" className="border rounded-lg px-3 py-2 text-sm" value={vehicle.vehicleYear} onChange={(e) => setVehicle({ ...vehicle, vehicleYear: e.target.value })} />
            <input placeholder="Color" className="border rounded-lg px-3 py-2 text-sm" value={vehicle.vehicleColor} onChange={(e) => setVehicle({ ...vehicle, vehicleColor: e.target.value })} />
            <input placeholder="License plate" className="border rounded-lg px-3 py-2 text-sm" value={vehicle.licensePlate} onChange={(e) => setVehicle({ ...vehicle, licensePlate: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button disabled={submitting} className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
          {submitting ? 'Creating…' : 'Create booking'}
        </button>
      </form>
    </div>
  );
}

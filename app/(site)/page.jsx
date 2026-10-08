'use client';
import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import api from '../../lib/apiClient';
import ServiceCard from '../../components/ServiceCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
=======
import Link from 'next/link';
import api from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ServicesBookingPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startTime, setStartTime] = useState('');

  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    notes: '',
    password: '',
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const selected = services.find((s) => s._id === Number(serviceId));
>>>>>>> aa2c114 (Initial commit)

  useEffect(() => {
    api
      .get('/services')
<<<<<<< HEAD
      .then((res) => setServices(res.data))
      .catch(() => setError('Could not load services right now. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Book your car detailing appointment</h1>
        <p className="text-gray-500 mt-2">Pick a service, choose a time that works for you, and you're set.</p>
      </div>

      {loading && <LoadingSpinner label="Loading services…" />}

      {!loading && error && <EmptyState title="Something went wrong" description={error} />}

      {!loading && !error && services.length === 0 && (
        <EmptyState title="No services available yet" description="Check back soon — we're setting things up." />
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </div>
      )}
=======
      .then((res) => {
        setServices(res.data);
        const preselect = new URLSearchParams(window.location.search).get('service');
        if (preselect && res.data.some((s) => String(s._id) === preselect)) setServiceId(preselect);
      })
      .catch(() => setLoadError('Could not load services right now. Please try again shortly.'))
      .finally(() => setLoadingServices(false));
  }, []);

  // Prefill from the logged-in customer's account
  useEffect(() => {
    if (!isCustomer) return;
    setForm((f) => ({ ...f, contactName: f.contactName || user.name, contactEmail: f.contactEmail || user.email }));
  }, [isCustomer, user]);

  const loadSlots = () => {
    if (!serviceId || !date) { setSlots([]); return Promise.resolve(); }
    setLoadingSlots(true);
    return api
      .get('/availability', { params: { serviceId, date } })
      .then((res) => setSlots(res.data.availableSlots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  useEffect(() => {
    setStartTime('');
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!serviceId) return setError('Please select a service.');
    if (!startTime) return setError('Please pick a time slot.');

    setSubmitting(true);
    try {
      const { password, ...rest } = form;
      const payload = { serviceId, date, startTime, ...rest };
      const res = isCustomer
        ? await api.post('/bookings', payload)
        : await api.post('/bookings/guest', { ...payload, password });
      setConfirmed(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
      if (err.response?.status === 409) {
        setStartTime('');
        loadSlots();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingServices) return <LoadingSpinner label="Loading services…" />;
  if (loadError) return <EmptyState title="Something went wrong" description={loadError} />;
  if (services.length === 0) {
    return <EmptyState title="No services available yet" description="Check back soon — we're setting things up." />;
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto bg-white border rounded-xl p-6 text-center">
        <div className="text-green-600 text-4xl mb-2">✓</div>
        <h1 className="text-xl font-bold mb-2">Booking confirmed!</h1>
        <p className="text-gray-600 text-sm mb-4">
          {selected?.name} on {confirmed.date} at {confirmed.startTime}
        </p>
        {!isCustomer && (
          <p className="text-gray-600 text-sm mb-4">
            {confirmed.accountCreated ? 'Your account has been created. ' : ''}
            Log in with <strong>{confirmed.contactEmail}</strong> and your password to see your booking.
          </p>
        )}
        <Link
          href={isCustomer ? '/dashboard' : '/login'}
          className="inline-block bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700"
        >
          {isCustomer ? 'Go to my bookings' : 'Log in'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Book a service</h1>
        <p className="text-gray-500 mt-2">No login needed — we'll create your account as you book.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

        <div>
          <label className="text-sm font-medium">Select service *</label>
          <select
            required
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — ${s.price} · {s.durationMinutes} min
              </option>
            ))}
          </select>
          {selected && <p className="text-xs text-gray-500 mt-1">{selected.description}</p>}
        </div>

        <h2 className="font-semibold pt-2">Your details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" value={form.contactName} onChange={set('contactName')} required />
          <Field label="Phone" value={form.contactPhone} onChange={set('contactPhone')} required />
          <Field label="Email" type="email" value={form.contactEmail} onChange={set('contactEmail')} required />
        </div>

        <h2 className="font-semibold pt-2">Date and time</h2>
        <div>
          <input
            type="date"
            required
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm mb-3"
          />
          {!serviceId ? (
            <p className="text-sm text-gray-500">Select a service to see available times.</p>
          ) : loadingSlots ? (
            <LoadingSpinner label="Checking availability…" />
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No open slots on this date. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setStartTime(t)}
                  className={`text-sm py-2 rounded-lg border ${
                    startTime === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white hover:border-brand-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="font-semibold pt-2">Vehicle details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Make" value={form.vehicleMake} onChange={set('vehicleMake')} required />
          <Field label="Model" value={form.vehicleModel} onChange={set('vehicleModel')} required />
          <Field label="Year" value={form.vehicleYear} onChange={set('vehicleYear')} />
          <Field label="Color" value={form.vehicleColor} onChange={set('vehicleColor')} />
          <Field label="License plate" value={form.licensePlate} onChange={set('licensePlate')} />
        </div>
        <div>
          <label className="text-sm font-medium">Notes (optional)</label>
          <textarea
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
          />
        </div>

        {!isCustomer && (
          <div>
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              This creates your account so you can log in later and see your booking (min. 6 characters).
              Already have an account? Use your existing password.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400">Payment is due on arrival — no payment is collected online.</p>
        <button
          disabled={submitting}
          className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, minLength }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
>>>>>>> aa2c114 (Initial commit)
    </div>
  );
}

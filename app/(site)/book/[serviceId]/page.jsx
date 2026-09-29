'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ProtectedRoute from '../../../../components/ProtectedRoute';

const todayStr = () => new Date().toISOString().slice(0, 10);

function BookingFlowInner() {
  const { serviceId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);
  const [step, setStep] = useState(1); // 1: pick date/time, 2: details, 3: confirm

  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const [form, setForm] = useState({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    contactName: user?.name || '',
    contactPhone: '',
    contactEmail: user?.email || '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    api
      .get(`/services/${serviceId}`)
      .then((res) => setService(res.data))
      .catch(() => setError('Could not load this service.'))
      .finally(() => setLoadingService(false));
  }, [serviceId]);

  useEffect(() => {
    if (!service) return;
    setLoadingSlots(true);
    setSelectedTime('');
    api
      .get('/availability', { params: { serviceId, date } })
      .then((res) => setSlots(res.data.availableSlots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, service, serviceId]);

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        serviceId,
        date,
        startTime: selectedTime,
        ...form,
      });
      setConfirmed(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      setError(msg);
      if (err.response?.status === 409) {
        setStep(1);
        setSelectedTime('');
        api.get('/availability', { params: { serviceId, date } }).then((res) => setSlots(res.data.availableSlots));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingService) return <LoadingSpinner label="Loading service…" />;
  if (!service) return <div className="text-center text-gray-500 py-16">Service not found.</div>;

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto bg-white border rounded-xl p-6 text-center">
        <div className="text-green-600 text-4xl mb-2">✓</div>
        <h1 className="text-xl font-bold mb-2">Booking confirmed!</h1>
        <p className="text-gray-600 text-sm mb-4">
          {service.name} on {confirmed.date} at {confirmed.startTime}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700"
        >
          Go to my bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {service.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.imageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="font-bold">{service.name}</h1>
          <p className="text-sm text-gray-500">${service.price} · {service.durationMinutes} min</p>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

      {step === 1 && (
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Pick a date and time</h2>
          <input
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm mb-4"
          />
          {loadingSlots ? (
            <LoadingSpinner label="Checking availability…" />
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No open slots on this date. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`text-sm py-2 rounded-lg border ${
                    selectedTime === t
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white hover:border-brand-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button
            disabled={!selectedTime}
            onClick={() => setStep(2)}
            className="mt-5 w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Your details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
            <Field label="Phone" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
            <Field label="Email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} type="email" />
          </div>

          <h2 className="font-semibold pt-2">Vehicle details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Make" value={form.vehicleMake} onChange={(v) => setForm({ ...form, vehicleMake: v })} required />
            <Field label="Model" value={form.vehicleModel} onChange={(v) => setForm({ ...form, vehicleModel: v })} required />
            <Field label="Year" value={form.vehicleYear} onChange={(v) => setForm({ ...form, vehicleYear: v })} />
            <Field label="Color" value={form.vehicleColor} onChange={(v) => setForm({ ...form, vehicleColor: v })} />
            <Field label="License plate" value={form.licensePlate} onChange={(v) => setForm({ ...form, licensePlate: v })} />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
              Back
            </button>
            <button
              disabled={!form.vehicleMake || !form.vehicleModel || !form.contactName || !form.contactPhone || !form.contactEmail}
              onClick={() => setStep(3)}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
            >
              Review booking
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Confirm your booking</h2>
          <SummaryRow label="Service" value={`${service.name} ($${service.price})`} />
          <SummaryRow label="Date" value={date} />
          <SummaryRow label="Time" value={selectedTime} />
          <SummaryRow label="Vehicle" value={`${form.vehicleYear} ${form.vehicleMake} ${form.vehicleModel}`.trim()} />
          <SummaryRow label="Contact" value={`${form.contactName} · ${form.contactPhone} · ${form.contactEmail}`} />
          <p className="text-xs text-gray-400 pt-2">Payment is due on arrival — no payment is collected online.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
              Back
            </button>
            <button
              disabled={submitting}
              onClick={handleConfirm}
              className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function BookingFlow() {
  return (
    <ProtectedRoute>
      <BookingFlowInner />
    </ProtectedRoute>
  );
}

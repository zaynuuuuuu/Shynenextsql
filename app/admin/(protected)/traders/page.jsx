'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../../lib/apiClient';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import EmptyState from '../../../../components/EmptyState';

const emptyForm = { name: '', businessName: '', email: '', phone: '', password: '' };

export default function AdminTraders() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users/traders').then((res) => setTraders(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/users/traders', form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create trader account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Traders</h1>
        <button onClick={openNew} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700">
          + Add trader
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : traders.length === 0 ? (
        <EmptyState title="No traders yet" description="Add a trader account, or share the trader sign-up link with your partners." />
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {traders.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.businessName || '—'}</td>
                  <td className="px-4 py-3">{t.email}</td>
                  <td className="px-4 py-3">{t.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 max-w-md w-full space-y-3">
            <h3 className="font-semibold">Add trader</h3>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Business name" value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field
              label="Password (optional — leave blank to auto-generate)"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
              <button disabled={submitting} className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
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

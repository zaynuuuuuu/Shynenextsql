'use client';
import React, { useEffect, useState } from 'react';
import api from '../../../../lib/apiClient';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import EmptyState from '../../../../components/EmptyState';

const emptyForm = { name: '', description: '', price: '', durationMinutes: '', imageUrl: '', isActive: true };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/services/admin').then((res) => setServices(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      imageUrl: s.imageUrl || '',
      isActive: s.isActive,
    });
    setEditingId(s._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, price: Number(form.price), durationMinutes: Number(form.durationMinutes) };
      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
      } else {
        await api.post('/services', payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this service? It will no longer be bookable by customers.')) return;
    await api.patch(`/services/${id}/archive`);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this service? This cannot be undone.')) return;
    await api.delete(`/services/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <button onClick={openNew} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700">
          + Add service
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" description="Add your first service to start taking bookings." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s._id} className={`bg-white border rounded-xl p-4 ${!s.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{s.name}</h3>
                {!s.isActive && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Archived</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{s.description}</p>
              <p className="text-sm mt-2">${s.price} · {s.durationMinutes} min</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(s)} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                  Edit
                </button>
                {s.isActive && (
                  <button onClick={() => handleArchive(s._id)} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    Archive
                  </button>
                )}
                <button onClick={() => handleDelete(s._id)} className="text-xs px-3 py-1.5 border rounded-lg text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold">{editingId ? 'Edit service' : 'Add service'}</h3>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea
                required
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
              <Field label="Duration (min)" type="number" value={form.durationMinutes} onChange={(v) => setForm({ ...form, durationMinutes: v })} required />
            </div>
<<<<<<< HEAD
            <Field label="Image URL" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} />
=======
>>>>>>> aa2c114 (Initial commit)
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active (bookable by customers)
            </label>
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

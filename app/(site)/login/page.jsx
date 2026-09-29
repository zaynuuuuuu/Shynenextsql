'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../lib/apiClient';
import { useAuth } from '../../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data);
      router.push(res.data.role === 'trader' ? '/trader/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-xl border">
      <h1 className="text-xl font-bold mb-4">Log in</h1>
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button
          disabled={submitting}
          className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <div className="flex justify-between mt-4 text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
        <Link href="/signup" className="text-brand-600 hover:underline">Create account</Link>
      </div>
      <p className="text-xs text-center text-gray-400 mt-4">
        Are you a trader/partner? <Link href="/trader/login" className="text-brand-600 hover:underline">Trader login</Link>
      </p>
    </div>
  );
}

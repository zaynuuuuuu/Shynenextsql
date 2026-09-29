'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-xl border">
      <h1 className="text-xl font-bold mb-4">Reset your password</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          If an account exists for that email, a reset link has been sent. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            disabled={submitting}
            className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="text-sm mt-4 text-center">
        <Link href="/login" className="text-brand-600 hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}

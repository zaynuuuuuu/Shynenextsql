'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../lib/apiClient';

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess('Password reset! Redirecting to login…');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-xl border">
      <h1 className="text-xl font-bold mb-4">Set a new password</h1>
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button
          disabled={submitting}
          className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Reset password'}
        </button>
      </form>
      <p className="text-sm mt-4 text-center">
        <Link href="/login" className="text-brand-600 hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}

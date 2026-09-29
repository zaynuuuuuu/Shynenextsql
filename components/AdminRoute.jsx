'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Role-gated — not just a hidden URL. Redirects non-admins to the admin login page.
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/admin/login');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') return <LoadingSpinner />;
  return children;
}

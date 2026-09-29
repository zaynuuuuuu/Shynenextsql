'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Gates trader-only routes (trader dashboard / add booking)
export default function TraderRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trader')) router.replace('/trader/login');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'trader') return <LoadingSpinner />;
  return children;
}

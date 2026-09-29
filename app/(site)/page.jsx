'use client';
import React, { useEffect, useState } from 'react';
import api from '../../lib/apiClient';
import ServiceCard from '../../components/ServiceCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/services')
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
    </div>
  );
}

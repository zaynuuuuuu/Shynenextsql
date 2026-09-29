'use client';
import React from 'react';
import Link from 'next/link';

export default function ServiceCard({ service }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- images come from arbitrary admin-entered URLs
          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg">{service.name}</h3>
        <p className="text-sm text-gray-500 mt-1 flex-1">{service.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-xl font-bold text-brand-600">${service.price}</span>
            <span className="text-xs text-gray-400 ml-2">{service.durationMinutes} min</span>
          </div>
          <Link
            href={`/book/${service._id}`}
            className="text-sm px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}

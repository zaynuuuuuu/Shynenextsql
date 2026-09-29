import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 px-4 border border-dashed rounded-xl bg-white">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

'use client';

import React from 'react';

type MeckanoMapProps = {
  className?: string;
};

export default function MeckanoMap({ className = '' }: MeckanoMapProps) {
  return (
    <div
      className={`rounded-[32px] border border-gray-200 bg-gray-50 overflow-hidden ${className}`}
      style={{ minHeight: 400 }}
    >
      <div className="w-full h-full min-h-[400px] flex items-center justify-center text-gray-500 font-medium">
        מפת נוכחות — סימון עובדים ואזורים מורשים (Google Maps)
      </div>
    </div>
  );
}

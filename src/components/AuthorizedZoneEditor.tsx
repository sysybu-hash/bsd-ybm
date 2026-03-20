'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

const BRAND = '#004694';

export type AuthorizedZone = {
  name: string;
  address: string;
  radiusMeters: number;
};

type AuthorizedZoneEditorProps = {
  open: boolean;
  onClose: () => void;
  onSave: (zone: AuthorizedZone) => void;
  initial?: Partial<AuthorizedZone>;
};

export default function AuthorizedZoneEditor({
  open,
  onClose,
  onSave,
  initial = {},
}: AuthorizedZoneEditorProps) {
  const [name, setName] = useState(initial.name ?? '');
  const [address, setAddress] = useState(initial.address ?? '');
  const [radiusMeters, setRadiusMeters] = useState(initial.radiusMeters ?? 100);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address, radiusMeters });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pt-safe pb-safe sm:items-center"
      dir="rtl"
    >
      <div className="flex max-h-[min(90dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-[40px] bg-white shadow-xl sm:max-h-[min(85dvh,40rem)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[#1a1a1a] sm:text-xl">עריכת אזור מורשה</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[40px] text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">שם האזור</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:border-[#004694] focus-visible:ring-2 focus-visible:ring-[#004694]/30"
              placeholder="למשל: אתר בניין א'"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">כתובת (חיפוש Google Places)</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:border-[#004694] focus-visible:ring-2 focus-visible:ring-[#004694]/30"
              placeholder="הזן כתובת"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">רדיוס (מטרים)</span>
            <input
              type="number"
              min={10}
              max={5000}
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value) || 100)}
              className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:border-[#004694] focus-visible:ring-2 focus-visible:ring-[#004694]/30"
            />
          </label>

          <div className="mt-4 flex shrink-0 gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 flex-1 rounded-[40px] border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="min-h-12 flex-1 rounded-[40px] py-3 font-bold text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: BRAND }}
            >
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import { Video } from 'lucide-react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

/** “Live Field Tour” — set NEXT_PUBLIC_FIELD_TOUR_VIDEO_URL (YouTube embed or mp4 URL). */
export default function FieldTourVideo() {
  const isAdmin = usePlatformAdmin();
  const raw = (process.env.NEXT_PUBLIC_FIELD_TOUR_VIDEO_URL || '').trim();

  const embedUrl = useMemo(() => {
    if (!raw) return null;
    const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;
    if (raw.includes('youtube.com/embed/')) return raw;
    return null;
  }, [raw]);

  if (!raw) {
    return (
      <section
        className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-[#001A4D]/25 bg-[#FDFDFD] p-8 text-center"
        dir="rtl"
      >
        <Video className="h-10 w-10" style={{ color: MEUHEDET.blue }} aria-hidden />
        <p className="text-sm font-bold text-[#001A4D]">סיור שטח חי (וידאו)</p>
        <p className="text-xs text-gray-500">
          {isAdmin ? (
            <>
              הגדירו <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_FIELD_TOUR_VIDEO_URL</code> לקישור YouTube או הטמעה.
            </>
          ) : (
            <>סיור השטח יוגדר על ידי מנהל המערכת.</>
          )}
        </p>
      </section>
    );
  }

  return (
    <section
      className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm"
      style={{ boxShadow: '0 8px 32px rgba(0,26,77,0.08)' }}
      dir="rtl"
    >
      <h2 className="text-center text-lg font-black text-[#001A4D]">סיור שטח חי</h2>
      {embedUrl ? (
        <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-[32px] border border-gray-100 bg-black">
          <iframe
            title="Field tour"
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video className="w-full max-w-2xl rounded-[32px]" controls src={raw} playsInline>
          <track kind="captions" />
        </video>
      )}
    </section>
  );
}

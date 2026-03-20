'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LuxuryLandingPage from '@/components/landing/LuxuryLandingPage';

function LandingWithShowroom() {
  const searchParams = useSearchParams();
  const showroomMode = searchParams.get('mode') === 'showroom';
  return <LuxuryLandingPage showroomMode={showroomMode} />;
}

function LandingFallback() {
  return (
    <div
      className="empire-landing-engine flex min-h-dvh items-center justify-center"
      aria-hidden
    >
      <div className="h-12 w-12 animate-pulse rounded-4xl border border-[#c9a227]/30 bg-[#000814]/80" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingWithShowroom />
    </Suspense>
  );
}

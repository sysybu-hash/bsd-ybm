'use client';

import React from 'react';
import UnifiedScanModal from '@/components/scan/UnifiedScanModal';
import { useSubscription } from '@/hooks/useSubscription';

export default function ScanPage() {
  const { hasFeature, plan } = useSubscription();

  if (!hasFeature('multi_engine_scan')) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FDFDFD] p-6 pt-safe px-safe text-center"
        dir="rtl"
      >
        <p className="text-sm font-bold text-gray-700">סריקת AI רב־מנוע זמינה בתוכנית Alloy בלבד.</p>
        <p className="text-xs text-gray-500">תוכנית נוכחית: {plan}</p>
      </div>
    );
  }

  return <UnifiedScanModal open embedded />;
}

'use client';

import React, { useEffect, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

const ils = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export function formatIls(value: number): string {
  return ils.format(Math.round(value));
}

export default function CountUpCurrency({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(mv, 'change', (v) => setDisplay(v));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, mv]);

  return <span className={className}>{formatIls(display)}</span>;
}

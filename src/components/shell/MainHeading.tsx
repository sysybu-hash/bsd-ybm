'use client';

import React from 'react';

/**
 * Hero band — white type on royal blue; padding tuned for Meuhedet-like vertical rhythm.
 */
export default function MainHeading() {
  return (
    <section
      className="bsd-shell-hero flex w-full items-center justify-center px-5 py-10 md:px-10 md:py-14"
      style={{ backgroundColor: 'var(--bsd-royal-blue)' }}
    >
      <h1 className="max-w-[min(100%,920px)] text-center text-[22px] font-bold leading-[1.45] tracking-tight text-white md:text-[28px] md:leading-[1.4]">
        שותפי בנייה יקרים, BSD-YBM איתכם בכל פרויקט.
      </h1>
    </section>
  );
}

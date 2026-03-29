"use client";

import Image from "next/image";

type Props = {
  text: string;
};

/**
 * לוגו ירו. אם המקור מגיע עם דוגמת שחמט אטומה:
 * node scripts/remove-checkerboard-hero-png.mjs
 */
const HERO_TITLE_ART = "/landing-hero-title-art.png";

/** ניגוד + רוויה + צללים מדורגים — חדות ויזואלית ותחושת תבליט מול רקע עיר */
const HERO_IMG_FILTER =
  "contrast(1.12) saturate(1.18) brightness(1.045) drop-shadow(0 2px 6px rgba(0,0,0,0.62)) drop-shadow(0 10px 28px rgba(0,0,0,0.45)) drop-shadow(0 20px 48px rgba(0,0,0,0.28)) drop-shadow(0 0 1.5px rgba(0,0,0,0.55))";

export default function LandingHeroMetallicTitle({ text }: Props) {
  return (
    <h2 className="mx-auto w-full max-w-[min(100%,56rem)] px-2 py-1 text-center">
      <Image
        src={HERO_TITLE_ART}
        alt={text}
        width={2814}
        height={1536}
        sizes="(max-width: 896px) 100vw, 896px"
        priority
        unoptimized
        className="mx-auto h-auto w-full max-h-[min(46svh,calc(100svh-19rem))] object-contain md:max-h-[min(52svh,calc(100svh-18rem))] transform-gpu will-change-transform"
        style={{ filter: HERO_IMG_FILTER }}
        decoding="async"
      />
    </h2>
  );
}

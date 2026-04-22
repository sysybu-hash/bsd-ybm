"use client";

import Link from "next/link";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ reset }: Props) {
  return (
    <div className="tile tile--soft max-w-3xl p-6 sm:p-8" dir="rtl">
      <span className="bento-eyebrow">Workspace Error</span>
      <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--ink-900)]">
        משהו השתבש בחלון העבודה הזה.
      </h2>
      <p className="mt-4 text-base leading-8 text-[color:var(--ink-500)]">
        כדי שהחוויה תישאר ברורה גם כשיש תקלה, המסך מציע חזרה נקייה לאותו חלון במקום להשאיר את המשתמש אבוד.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => reset()} className="bento-btn bento-btn--primary">
          לנסות שוב
        </button>
        <Link href="/app" className="bento-btn bento-btn--secondary">
          חזרה לבית החדש
        </Link>
      </div>
    </div>
  );
}

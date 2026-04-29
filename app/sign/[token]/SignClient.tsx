"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";
import type { SignatureCanvasRef } from "react-signature-canvas";

type QuoteWithContact = {
  id: string;
  token: string;
  amount: number;
  status: string;
  contact: { name: string; email: string | null };
};

export default function SignClient({
  token,
  quote,
}: {
  token: string;
  quote: QuoteWithContact;
}) {
  const sigRef = useRef<SignatureCanvasRef | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** רק בצד לקוח — מונע בעיות SSR/hydration עם canvas */
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    setCanvasReady(true);
  }, []);

  const clear = () => sigRef.current?.clear();

  const submit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setMsg("אנא חתם באזור החתימה");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const signatureBase64 = sigRef.current.toDataURL("image/png");
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "שגיאה בשמירה");
        return;
      }
      setMsg("החתימה נשמרה בהצלחה. תודה!");
    } catch {
      setMsg("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  };

  if (quote.status === "CLOSED_WON") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[color:var(--canvas-sunken)] to-[color:var(--canvas-raised)] p-6 text-[color:var(--ink-900)]"
        dir="rtl"
      >
        <div className="max-w-md space-y-4 rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-8 text-center shadow-[var(--cd-shadow-sm)]">
          <p className="font-bold text-[color:var(--cd-positive)]">ההצעה כבר אושרה וחתומה.</p>
          <Link
            href="/"
            className="font-bold text-[color:var(--cd-accent)] underline underline-offset-2 hover:text-[color:var(--cd-accent-ink)]"
          >
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[color:var(--canvas-sunken)] to-[color:var(--canvas-raised)] p-6 text-[color:var(--ink-900)]"
      dir="rtl"
    >
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-black text-[color:var(--cd-accent)]">חתימה דיגיטלית – BSD-YBM</h1>
        <p className="text-sm text-[color:var(--ink-600)]">
          הצעת מחיר עבור <strong className="text-[color:var(--ink-900)]">{quote.contact.name}</strong>
        </p>
        <p className="text-3xl font-black text-[color:var(--ink-900)]">₪{quote.amount.toLocaleString()}</p>

        <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-4 shadow-[var(--cd-shadow)]">
          <p className="mb-2 text-sm text-[color:var(--ink-500)]">חתם כאן:</p>
          <div className="min-h-[160px] overflow-hidden rounded-lg border border-[color:var(--line-subtle)] bg-[color:var(--canvas-sunken)]">
            {canvasReady ? (
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "w-full h-40 touch-none",
                  width: 400,
                  height: 160,
                }}
              />
            ) : (
              <div className="h-40 w-full animate-pulse rounded-lg bg-[color:var(--canvas-sunken)]" aria-hidden />
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] px-4 py-2 text-sm font-bold text-[color:var(--ink-800)] hover:bg-[color:var(--canvas)]"
            >
              נקה
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 rounded-xl bg-[color:var(--cd-accent)] px-4 py-2 font-bold text-white shadow-[var(--cd-shadow-sm)] hover:bg-[color:var(--cd-accent-ink)] disabled:opacity-50"
            >
              {loading ? "שומר..." : "חתום ואשר"}
            </button>
          </div>
        </div>

        {msg && (
          <p
            className={`text-sm font-medium ${msg.includes("הצלחה") ? "text-[color:var(--cd-positive)]" : "text-[color:var(--cd-accent-ink)]"}`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

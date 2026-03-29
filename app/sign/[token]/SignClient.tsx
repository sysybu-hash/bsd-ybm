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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md text-center space-y-4">
          <p className="text-emerald-400 font-bold">ההצעה כבר אושרה וחתומה.</p>
          <Link href="/" className="text-blue-400 underline">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-black text-blue-500">חתימה דיגיטלית – BSD-YBM</h1>
        <p className="text-slate-400 text-sm">
          הצעת מחיר עבור <strong className="text-white">{quote.contact.name}</strong>
        </p>
        <p className="text-3xl font-black">₪{quote.amount.toLocaleString()}</p>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
          <p className="text-sm text-slate-500 mb-2">חתם כאן:</p>
          <div className="bg-white rounded-lg overflow-hidden min-h-[160px]">
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
              <div className="w-full h-40 bg-slate-100 animate-pulse rounded-lg" aria-hidden />
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={clear}
              className="px-4 py-2 rounded-lg bg-slate-800 text-sm"
            >
              נקה
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 font-bold disabled:opacity-50"
            >
              {loading ? "שומר..." : "חתום ואשר"}
            </button>
          </div>
        </div>

        {msg && (
          <p
            className={`text-sm ${msg.includes("הצלחה") ? "text-emerald-400" : "text-amber-300"}`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

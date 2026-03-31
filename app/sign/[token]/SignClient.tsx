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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md text-center space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <p className="text-emerald-700 font-bold">ההצעה כבר אושרה וחתומה.</p>
          <Link href="/" className="text-blue-600 font-bold underline underline-offset-2 hover:text-blue-800">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-black text-blue-600">חתימה דיגיטלית – BSD-YBM</h1>
        <p className="text-slate-600 text-sm">
          הצעת מחיר עבור <strong className="text-slate-900">{quote.contact.name}</strong>
        </p>
        <p className="text-3xl font-black text-slate-900">₪{quote.amount.toLocaleString()}</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md shadow-slate-200/40">
          <p className="text-sm text-slate-500 mb-2">חתם כאן:</p>
          <div className="bg-slate-50 rounded-lg overflow-hidden min-h-[160px] border border-slate-100">
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
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold border border-slate-200 hover:bg-slate-200"
            >
              נקה
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 hover:bg-blue-700 shadow-sm"
            >
              {loading ? "שומר..." : "חתום ואשר"}
            </button>
          </div>
        </div>

        {msg && (
          <p
            className={`text-sm font-medium ${msg.includes("הצלחה") ? "text-emerald-700" : "text-blue-700"}`}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

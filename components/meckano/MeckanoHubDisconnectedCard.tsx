"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Key, Loader2 } from "lucide-react";
import { updateMeckanoApiKeyAction } from "@/app/actions/org-settings";

type Props = {
  apiKeyInput: string;
  setApiKeyInput: (v: string) => void;
  keyMsg: { ok: boolean; msg: string } | null;
  setKeyMsg: (v: { ok: boolean; msg: string } | null) => void;
  setConnected: (v: boolean) => void;
  inputCls: string;
};

export default function MeckanoHubDisconnectedCard({
  apiKeyInput,
  setApiKeyInput,
  keyMsg,
  setKeyMsg,
  setConnected,
  inputCls,
}: Props) {
  const [pendingKey, startKeyTransition] = useTransition();

  return (
    <div className="mx-auto max-w-lg py-12" dir="rtl">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-1 bg-teal-600" />
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15">
            <Key size={28} className="text-teal-400" />
          </div>
          <h1 className="mb-2 text-xl font-black text-gray-900">חיבור מקאנו</h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            הזינו את מפתח ה-API מלוח הניהול של מקאנו כדי לסנכרן עובדים, נוכחות ומשימות.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("meckanoApiKey", apiKeyInput);
              startKeyTransition(async () => {
                const r = await updateMeckanoApiKeyAction(fd);
                if (r.ok) {
                  setConnected(true);
                  setKeyMsg(null);
                } else setKeyMsg({ ok: false, msg: r.error ?? "שגיאה" });
              });
            }}
            className="space-y-3 text-end"
          >
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="OFIUOILqHkqISR9K..."
              className={`${inputCls} w-full font-mono text-xs`}
              dir="ltr"
              required
            />
            <button
              type="submit"
              disabled={pendingKey || !apiKeyInput.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {pendingKey ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              חבר מקאנו
            </button>
          </form>
          {keyMsg && (
            <p className={`mt-3 text-sm ${keyMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>{keyMsg.msg}</p>
          )}
          <p className="mt-4 text-xs text-gray-400">
            ניתן גם{" "}
            <Link href="/app/settings/stack" className="text-teal-400 hover:underline">
              להגדיר בדף ההגדרות
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

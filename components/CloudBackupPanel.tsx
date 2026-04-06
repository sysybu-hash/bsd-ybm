"use client";

import { useEffect, useState, useCallback } from "react";
import { Cloud, RefreshCw, Loader2, ChevronDown } from "lucide-react";
import { CloudProvider } from "@prisma/client";

const PROVIDERS: { id: CloudProvider; label: string; hint: string }[] = [
  { id: "GOOGLE_DRIVE", label: "Google Drive", hint: "OAuth + Google Cloud Console" },
  { id: "ONEDRIVE", label: "Microsoft OneDrive", hint: "Azure App Registration" },
  { id: "DROPBOX", label: "Dropbox", hint: "Scoped OAuth + אפליקציה ב-Dropbox" },
  { id: "ICLOUD", label: "iCloud Drive", hint: "אין API רשמי מלא — לרוב macOS / ידני" },
  {
    id: "S3_COMPATIBLE",
    label: "S3 / תאימות (Wasabi, R2…)",
    hint: "מפתחות גישה + שם באקט + endpoint",
  },
];

/** מה לכלול בין קוד לבין ספק — לפי סוג החיבור */
const SETUP_CHECKLISTS: Record<
  CloudProvider,
  { title: string; serverEnv: string[]; portalSteps: string[] }
> = {
  GOOGLE_DRIVE: {
    title: "Google Drive",
    serverEnv: [
      "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (או שמות שתואמים ל-OAuth בפרויקט)",
      "REDIRECT_URI מוגדר ב-Google Cloud Console → OAuth",
      "הרשאות: drive.readonly / drive.file לפי צורך",
    ],
    portalSteps: [
      "יצירת פרויקט ב-Google Cloud Console",
      "הפעלת Google Drive API",
      "מסך הסכמה (Consent) ו-test users",
      "שמירת Client ID/Secret ב-Vercel → Environment Variables",
    ],
  },
  ONEDRIVE: {
    title: "Microsoft OneDrive / Graph",
    serverEnv: [
      "AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID",
      "redirect URI רשום ב-Azure App Registration",
    ],
    portalSteps: [
      "Azure Portal → App registrations → New",
      "הוספת Microsoft Graph delegated permissions: Files.Read / Files.ReadWrite",
      "Redirect URI: כתובת ה-callback באתר (למשל /api/auth/...)",
      "העתקת מזהים ל-Vercel",
    ],
  },
  DROPBOX: {
    title: "Dropbox",
    serverEnv: ["DROPBOX_APP_KEY, DROPBOX_APP_SECRET", "Redirect URI מול Dropbox App Console"],
    portalSteps: [
      "Dropbox Developers → יצירת אפליקציה",
      "Scoped access — בחירת תיקיות או full Dropbox לפי מדיניות",
      "Redirect URIs — הוספת דומיין הייצור (bsd-ybm.co.il)",
    ],
  },
  ICLOUD: {
    title: "iCloud Drive",
    serverEnv: ["בדרך כלל ללא מפתח שרת ישיר; שימוש ב-CloudKit דורש חשבון מפתח אפל"],
    portalSteps: [
      "להבין שאין חיבור דומה ל-Drive API בשכבת האתר בלבד",
      "אפשרויות: גיבוי ידני, אינטגרציה דרך מחשב Mac בעסק, או ספק צד ג׳",
    ],
  },
  S3_COMPATIBLE: {
    title: "S3-compatible (R2, Wasabi, MinIO…)",
    serverEnv: [
      "S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
      "אופציונלי: S3_REGION",
    ],
    portalSteps: [
      "יצירת באקט ומפתחות read/write מוגבלים",
      "הגבלת IP או מדיניות גיבוי לקריאה בלבד לייצוא",
      "בדיקת חיבור מקומית לפני ייצור",
    ],
  },
};

type Row = {
  id: string;
  provider: CloudProvider;
  displayName: string | null;
  autoScan: boolean;
  backupExports: boolean;
  lastSyncAt: string | null;
};

export default function CloudBackupPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<CloudProvider | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<CloudProvider | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/cloud");
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setRows(data.items);
      }
    } catch {
      /* ללא טיפול — מציג מצב ריק */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleProvider = async (
    provider: CloudProvider,
    patch: Partial<Pick<Row, "autoScan" | "backupExports">> & { create?: boolean },
  ) => {
    setSaving(provider);
    setMsg(null);
    const existing = rows.find((r) => r.provider === provider);
    try {
      const res = await fetch("/api/integrations/cloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          displayName: existing?.displayName ?? PROVIDERS.find((p) => p.id === provider)?.label,
          autoScan: patch.autoScan ?? existing?.autoScan ?? false,
          backupExports: patch.backupExports ?? existing?.backupExports ?? false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "שגיאה");
      } else {
        setMsg("ההגדרה נשמרה. חיבור OAuth והעלאה אוטומטית יופעלו כשיוגדרו המפתחות בשרת.");
        await load();
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/20">
        <Cloud className="text-indigo-400 shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-gray-600 leading-relaxed">
          <p className="font-bold text-gray-900">גיבוי וסריקה אוטונומית מול ענן</p>
          <p className="mt-1">
            כפתור ראשי: שמירת &quot;רשומת הכנה&quot; למסלול. כפתור משני: פתיחת רשימת צעדים (מה להגדיר
            בשרת ובפורטל הספק) — Drive, OneDrive, Dropbox, iCloud/S3.
          </p>
          <p className="mt-2 text-gray-500 border-t border-indigo-500/30/60 pt-2">
            <strong>מסמכים ישנים מהמחשב:</strong> העלאה ופענוח אצלנו ב־ERP דרך &quot;סורק ה־AI&quot;
            (גרירה של כמה קבצים). חיבור ענן כאן מתאים בעיקר לגיבוי וסנכרון שוטפים אחרי שכבר עובדים
            במערכת.
          </p>
        </div>
      </div>

      {msg && (
        <p className="text-sm font-medium text-emerald-800 bg-emerald-500/15 border border-emerald-100 rounded-xl px-4 py-2">
          {msg}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-400" size={32} />
        </div>
      ) : (
        <ul className="space-y-4">
          {PROVIDERS.map((p) => {
            const row = rows.find((r) => r.provider === p.id);
            const active = Boolean(row);
            const rec = row;
            const guide = SETUP_CHECKLISTS[p.id];
            const guideOpen = openGuide === p.id;
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden"
              >
                <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-400">{p.hint}</p>
                    {rec?.lastSyncAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        סנכרון אחרון: {new Date(rec.lastSyncAt).toLocaleString("he-IL")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
                    <div className="inline-flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                      {!active || !rec ? (
                        <button
                          type="button"
                          disabled={saving !== null}
                          onClick={() =>
                            void toggleProvider(p.id, { autoScan: false, backupExports: true })
                          }
                          className="px-4 py-2.5 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500/15 disabled:opacity-50"
                        >
                          {saving === p.id ? (
                            <Loader2 className="animate-spin inline" size={16} />
                          ) : (
                            "הפעל רשומה"
                          )}
                        </button>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer px-3 py-2 border-l border-gray-100">
                            <input
                              type="checkbox"
                              checked={rec.autoScan}
                              onChange={(e) =>
                                void toggleProvider(p.id, { autoScan: e.target.checked })
                              }
                            />
                            סריקה
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer px-3 py-2">
                            <input
                              type="checkbox"
                              checked={rec.backupExports}
                              onChange={(e) =>
                                void toggleProvider(p.id, { backupExports: e.target.checked })
                              }
                            />
                            גיבוי
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpenGuide(guideOpen ? null : p.id)}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-100 border-l"
                      >
                        איך מחברים?
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${guideOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                {guideOpen ? (
                  <div className="border-t border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 space-y-3">
                    <p className="font-black text-gray-900">{guide.title} — רשימת הכנה</p>
                    <div>
                      <p className="text-xs font-bold text-indigo-300 mb-1">בשרת (Vercel / .env)</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        {guide.serverEnv.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-300 mb-1">בפורטל הספק</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        {guide.portalSteps.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => void load()}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-400"
      >
        <RefreshCw size={16} />
        רענון רשימה
      </button>
    </div>
  );
}

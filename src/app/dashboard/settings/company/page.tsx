'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Palette, Timer, Upload } from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getDb } from '@/lib/firestore';
import { getFirebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';
import { getSectorPreset } from '@/config/sectorConfigs';
import {
  clampInactivityMinutes,
  DEFAULT_INACTIVITY_MINUTES,
  MAX_INACTIVITY_MINUTES,
  MIN_INACTIVITY_MINUTES,
} from '@/lib/inactivityPreferences';

const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp']);

export default function CompanyBrandingSettingsPage() {
  const { user } = useAuth();
  const { companyId, isCompanyAdmin } = useCompany();
  const { sectorPreset } = useSubscription();
  const [primary, setPrimary] = useState(() => getSectorPreset('CONSTRUCTION').brandingPalette.primary);
  const [secondary, setSecondary] = useState(() => getSectorPreset('CONSTRUCTION').brandingPalette.secondary);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [inactivityMinutes, setInactivityMinutes] = useState(DEFAULT_INACTIVITY_MINUTES);
  const [savingIdle, setSavingIdle] = useState(false);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const cref = doc(getDb(), 'companies', companyId);
    const tref = doc(getDb(), 'companies', companyId, 'branding', 'theme');
    let rootDone = false;
    let themeDone = false;
    const tryFinish = () => {
      if (rootDone && themeDone) setLoading(false);
    };
    const unsubRoot = onSnapshot(
      cref,
      (snap) => {
        const d = snap.data() as Record<string, unknown> | undefined;
        const logo =
          (typeof d?.companyLogoUrl === 'string' && d.companyLogoUrl.trim()) ||
          (typeof d?.logoUrl === 'string' && d.logoUrl.trim()) ||
          '';
        setLogoPreview(logo || null);
        const idleRaw = d?.inactivityTimeoutMinutes;
        if (typeof idleRaw === 'number') {
          setInactivityMinutes(clampInactivityMinutes(idleRaw));
        } else {
          setInactivityMinutes(DEFAULT_INACTIVITY_MINUTES);
        }
        rootDone = true;
        tryFinish();
      },
      () => {
        rootDone = true;
        tryFinish();
      }
    );
    const unsubTheme = onSnapshot(
      tref,
      (snap) => {
        const t = snap.data() as Record<string, unknown> | undefined;
        if (typeof t?.primaryColor === 'string' && t.primaryColor.trim()) setPrimary(t.primaryColor.trim());
        if (typeof t?.secondaryColor === 'string' && t.secondaryColor.trim()) setSecondary(t.secondaryColor.trim());
        themeDone = true;
        tryFinish();
      },
      () => {
        themeDone = true;
        tryFinish();
      }
    );
    return () => {
      unsubRoot();
      unsubTheme();
    };
  }, [companyId]);

  const saveColors = useCallback(async () => {
    if (!user || !companyId || !isCompanyAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      await setDoc(
        doc(getDb(), 'companies', companyId, 'branding', 'theme'),
        {
          primaryColor: primary.trim() || sectorPreset.brandingPalette.primary,
          secondaryColor: secondary.trim() || sectorPreset.brandingPalette.secondary,
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
        },
        { merge: true }
      );
      await updateDoc(doc(getDb(), 'companies', companyId), {
        primaryColor: primary.trim() || sectorPreset.brandingPalette.primary,
        secondaryColor: secondary.trim() || sectorPreset.brandingPalette.secondary,
      }).catch(() => {});
      setMsg('צבעי מותג נשמרו.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  }, [user, companyId, isCompanyAdmin, primary, secondary, sectorPreset]);

  const saveInactivity = useCallback(async () => {
    if (!user || !companyId || !isCompanyAdmin) return;
    setSavingIdle(true);
    setMsg(null);
    try {
      const m = clampInactivityMinutes(inactivityMinutes);
      await updateDoc(doc(getDb(), 'companies', companyId), {
        inactivityTimeoutMinutes: m,
      });
      setMsg(`זמן חוסר פעילות נשמר: ${m} דק׳.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה בשמירה');
    } finally {
      setSavingIdle(false);
    }
  }, [user, companyId, isCompanyAdmin, inactivityMinutes]);

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!user || !companyId || !isCompanyAdmin || !file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.has(ext)) {
      setMsg('קבצים מותרים: PNG, JPG, WEBP');
      return;
    }
    if (file.size > 2_500_000) {
      setMsg('הקובץ גדול מדי (מקס׳ 2.5MB)');
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const storage = getFirebaseStorage();
      const path = `companies/${companyId}/assets/logo.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(getDb(), 'companies', companyId), {
        companyLogoUrl: url,
        logoUrl: url,
      });
      await setDoc(
        doc(getDb(), 'companies', companyId, 'branding', 'theme'),
        {
          companyLogoUrl: url,
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
        },
        { merge: true }
      );
      setLogoPreview(url);
      setMsg('הלוגו הועלה ונשמר.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'העלאה נכשלה — בדקו הרשאות Storage');
    } finally {
      setUploading(false);
    }
  };

  if (!isCompanyAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-12 text-center text-sm text-gray-600" dir="rtl">
        גישה למנהלי חברה בלבד.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
          <Building2 className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">מותג משנה (White-Label)</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            לוגו וצבעים ללקוחות — נשמרים תחת החברה הנבחרת בלבד (<code className="rounded bg-gray-100 px-1">bsd-ybm:selectedCompanyId</code>).
          </p>
        </div>
      </header>

      {!companyId && <p className="text-center text-gray-500">בחרו חברה מהמתג.</p>}

      {companyId && (
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-8">
          <section className="flex w-full flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-4 text-[#001A4D]">
              <Upload className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-black">לוגו חברה</h2>
            </div>
            <p className="text-center text-xs text-gray-500">נתיב אחסון: companies/{'{companyId}'}/assets/logo.*</p>
            {loading ? (
              <p className="text-sm text-gray-500">טוען…</p>
            ) : logoPreview ? (
              <img
                src={logoPreview}
                alt=""
                className="h-20 max-w-[240px] object-contain"
              />
            ) : (
              <p className="text-sm text-gray-500">טרם הועלה לוגו</p>
            )}
            <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-[32px] border-2 border-dashed border-[#001A4D]/30 px-8 py-4 text-sm font-bold text-[#001A4D] transition-colors hover:bg-gray-50">
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(ev) => void onLogo(ev)} disabled={uploading} />
              {uploading ? 'מעלה…' : 'בחירת קובץ והעלאה'}
            </label>
          </section>

          <section className="flex w-full flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-4 text-[#001A4D]">
              <Palette className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-black">צבעי מותג</h2>
            </div>
            <p className="max-w-md text-center text-xs text-gray-500">
              ברירת מחדל לפי פרופיל הענף (<span className="font-bold">{sectorPreset.labelHe}</span>) — ניתן לדרוס בכל עת.
              שמירה עם שדה ריק משתמשת בערכי ברירת המחדל של הענף.
            </p>
            <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
                ראשי
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-12 w-full max-w-[120px] cursor-pointer rounded-[32px] border border-gray-200"
                />
              </label>
              <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
                משני
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className="h-12 w-full max-w-[120px] cursor-pointer rounded-[32px] border border-gray-200"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => void saveColors()}
              className="min-h-12 w-full max-w-xs rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
              style={{ backgroundColor: MEUHEDET.orange }}
            >
              {saving ? 'שומר…' : 'שמירת צבעים'}
            </button>
          </section>

          <section className="flex w-full flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-4 text-[#001A4D]">
              <Timer className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-black">זמן חוסר פעילות (ארגוני)</h2>
            </div>
            <p className="max-w-md text-center text-xs text-gray-500">
              לאחר מספר דקות ללא פעילות (עכבר/מקלדת) המערכת תחזיר לדף הבית. ברירת מחדל 10 דקות. עדיפות: הגדרה זו על פני הגדרה אישית במשתמש.
            </p>
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <label className="flex w-full max-w-xs flex-col items-center justify-center gap-4 text-sm font-bold text-gray-700">
                <span>
                  {inactivityMinutes} דקות ({MIN_INACTIVITY_MINUTES}–{MAX_INACTIVITY_MINUTES})
                </span>
                <input
                  type="range"
                  min={MIN_INACTIVITY_MINUTES}
                  max={MAX_INACTIVITY_MINUTES}
                  value={inactivityMinutes}
                  onChange={(e) => setInactivityMinutes(clampInactivityMinutes(Number(e.target.value)))}
                  className="h-4 w-full cursor-pointer accent-[#FF8C00]"
                />
              </label>
              <button
                type="button"
                disabled={savingIdle || loading || !companyId}
                onClick={() => void saveInactivity()}
                className="min-h-12 w-full max-w-xs rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
                style={{ backgroundColor: MEUHEDET.blue }}
              >
                {savingIdle ? 'שומר…' : 'שמירת זמן חוסר פעילות'}
              </button>
            </div>
          </section>

          {msg ? (
            <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
              {msg}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

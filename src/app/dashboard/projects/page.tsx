'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onSnapshot } from 'firebase/firestore';
import { HardHat, Plus } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

type ProjectRow = {
  id: string;
  name: string;
  client?: string;
  siteAddress?: string;
  totalContractValue?: number;
  startDate?: string;
  estimatedFinishDate?: string;
};

export default function ProjectsPage() {
  const { companyId, companies } = useCompany();
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  const membership = companies.find((c) => c.companyId === companyId);
  const isClient = membership?.role === 'client';
  const allowedIds = membership?.allowedProjectIds ?? [];

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId) {
      setProjects([]);
      return;
    }
    const ref = companyProjectsRef(companyId);
    const unsub = onSnapshot(ref, (snap) => {
      const rows: ProjectRow[] = [];
      snap.forEach((d) => {
        const data = d.data() as {
          name?: string;
          client?: string;
          siteAddress?: string;
          location?: string;
          totalContractValue?: number;
          budget?: number;
          startDate?: string;
          estimatedFinishDate?: string;
        };
        rows.push({
          id: d.id,
          name: (data.name as string) || d.id,
          client: data.client,
          siteAddress: data.siteAddress || data.location,
          totalContractValue:
            typeof data.totalContractValue === 'number'
              ? data.totalContractValue
              : typeof data.budget === 'number'
                ? data.budget
                : undefined,
          startDate: data.startDate,
          estimatedFinishDate: data.estimatedFinishDate,
        });
      });
      if (isClient && allowedIds.length > 0) {
        const allow = new Set(allowedIds);
        setProjects(rows.filter((r) => allow.has(r.id)));
      } else if (isClient) {
        setProjects([]);
      } else {
        setProjects(rows);
      }
    });
    return () => unsub();
  }, [companyId, isClient, JSON.stringify(allowedIds)]);

  return (
    <div className="min-h-full bg-[#FDFDFD] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      <header className="mb-8 flex flex-col items-center justify-center gap-4 text-center sm:mb-12 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <div className="rounded-[32px] bg-[#004694]/10 p-3">
            <HardHat className="h-8 w-8 text-[#004694]" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">פרויקטים</h1>
            <p className="mt-1 text-gray-500">ניהול פרויקטים ובנייה</p>
          </div>
        </div>
        {companyId && !isClient && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex min-h-12 items-center justify-center gap-4 rounded-[32px] bg-[#004694] px-6 py-3 font-bold text-white shadow-md transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
          >
            <Plus className="h-5 w-5 shrink-0" aria-hidden />
            פרויקט חדש
          </Link>
        )}
      </header>

      {!companyId && (
        <p className="text-center text-gray-500">בחר חברה מהמתג לצפייה ברשימה.</p>
      )}

      {companyId && (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-6">
          {projects.length === 0 && (
            <div className="flex min-h-[200px] w-full max-w-2xl items-center justify-center rounded-[32px] border border-gray-100 bg-white p-6 sm:p-12">
              <p className="text-center text-gray-400">
                {isClient && allowedIds.length === 0
                  ? 'לא הוקצו פרויקטים לחשבון הלקוח. פנה למנהל.'
                  : 'אין פרויקטים להצגה.'}
              </p>
            </div>
          )}

          {projects.length > 0 && (
            <section className="w-full overflow-x-auto rounded-[32px] border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <caption className="sr-only">רשימת פרויקטים</caption>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      שם פרויקט
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      לקוח
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      כתובת אתר
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      תקציב / חוזה
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      התחלה
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      סיום משוער
                    </th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-wide text-[#001a4d]">
                      פתיחה
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 transition-colors hover:bg-[#FDFDFD]"
                    >
                      <td className="p-4 text-center font-bold text-[#1a1a1a]">{p.name}</td>
                      <td className="p-4 text-center text-gray-600">{p.client?.trim() || '—'}</td>
                      <td className="p-4 text-center text-gray-600">{p.siteAddress?.trim() || '—'}</td>
                      <td className="p-4 text-center font-semibold text-[#004694]">
                        {p.totalContractValue != null ? `${p.totalContractValue.toLocaleString()} ₪` : '—'}
                      </td>
                      <td className="p-4 text-center text-gray-500">{p.startDate || '—'}</td>
                      <td className="p-4 text-center text-gray-500">{p.estimatedFinishDate || '—'}</td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/dashboard/projects/${encodeURIComponent(p.id)}`}
                          className="inline-flex min-h-12 items-center justify-center rounded-[32px] bg-[#004694] px-6 py-2 text-xs font-black text-white shadow-sm hover:opacity-90"
                        >
                          כניסה
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td
                      colSpan={3}
                      className="p-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500"
                    >
                      סה״כ {projects.length} פרויקטים
                    </td>
                    <td className="p-4 text-center text-sm font-black text-[#004694]">
                      {projects
                        .reduce((s, x) => s + (typeof x.totalContractValue === 'number' ? x.totalContractValue : 0), 0)
                        .toLocaleString()}{' '}
                      ₪
                    </td>
                    <td colSpan={3} className="p-4 text-center text-xs text-gray-400">
                      bsd-ybm
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onSnapshot } from 'firebase/firestore';
import { HardHat } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

type ProjectRow = { id: string; name: string };

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
        const data = d.data() as { name?: string };
        rows.push({ id: d.id, name: (data.name as string) || d.id });
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
      <header className="mb-8 flex flex-col items-center justify-center gap-3 text-center sm:mb-12 sm:flex-row sm:items-center">
        <div className="rounded-[32px] bg-[#004694]/10 p-3">
          <HardHat className="h-8 w-8 text-[#004694]" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">פרויקטים</h1>
          <p className="mt-1 text-gray-500">ניהול פרויקטים ובנייה</p>
        </div>
      </header>

      {!companyId && (
        <p className="text-center text-gray-500">בחר חברה מהמתג לצפייה ברשימה.</p>
      )}

      {companyId && (
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4">
          {projects.length === 0 && (
            <div className="flex min-h-[200px] w-full items-center justify-center rounded-[32px] border border-gray-100 bg-white p-6 sm:p-12">
              <p className="text-center text-gray-400">
                {isClient && allowedIds.length === 0
                  ? 'לא הוקצו פרויקטים לחשבון הלקוח. פנה למנהל.'
                  : 'אין פרויקטים להצגה.'}
              </p>
            </div>
          )}
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${encodeURIComponent(p.id)}`}
              className="flex w-full min-h-12 items-center justify-center rounded-[32px] border border-gray-100 bg-white px-6 py-4 text-center font-bold text-[#1a1a1a] shadow-sm transition-colors hover:border-[#FF8C00]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

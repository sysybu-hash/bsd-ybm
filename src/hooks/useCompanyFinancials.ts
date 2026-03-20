'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import { useDemoMode } from '@/services/demo/DemoProvider';
import { getDemoFinancialBundle } from '@/services/demo/mockSectorData';

export type ProjectHealthRow = {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
};

/**
 * Live financial aggregates for the selected company (updates when global switcher changes).
 * Revenue: finances docs type revenue/income. Expenses: Σ project labor + material (Meckano + AI scans).
 */
export function useCompanyFinancials() {
  const { companyId } = useCompany();
  const { dataMode } = useDemoMode();
  const { sector } = useSubscription();
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [projects, setProjects] = useState<ProjectHealthRow[]>([]);
  /** Full list for exports / reports (chart may show a subset). */
  const [allProjects, setAllProjects] = useState<ProjectHealthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setRevenue(0);
      setExpenses(0);
      setProjects([]);
      setAllProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getDb();
    const base = ['companies', companyId] as const;

    const unsubProjects = onSnapshot(
      collection(db, ...base, 'projects'),
      (snap) => {
        let totalExp = 0;
        const rows: ProjectHealthRow[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const pl = (data.plSummary as Record<string, unknown> | undefined) ?? {};
          const L = typeof pl.laborCosts === 'number' ? pl.laborCosts : 0;
          const M = typeof pl.materialCosts === 'number' ? pl.materialCosts : 0;
          const actual = Math.round((L + M) * 100) / 100;
          totalExp += actual;

          const budgetedRaw =
            typeof pl.budgetedCost === 'number'
              ? pl.budgetedCost
              : typeof data.budgetedTotal === 'number'
                ? data.budgetedTotal
                : typeof data.budget === 'number'
                  ? data.budget
                  : null;

          const budgeted =
            budgetedRaw != null && budgetedRaw > 0
              ? Math.round(budgetedRaw * 100) / 100
              : actual > 0
                ? Math.round(actual * 1.18 * 100) / 100
                : 0;

          const rawName = String(data.name ?? d.id);
          rows.push({
            id: d.id,
            name: rawName,
            budgeted,
            actual,
          });
        });
        rows.sort((a, b) => b.actual - a.actual);
        setExpenses(Math.round(totalExp * 100) / 100);
        setAllProjects(rows);
        setProjects(rows.slice(0, 14));
        setLoading(false);
      },
      () => {
        setProjects([]);
        setAllProjects([]);
        setExpenses(0);
        setLoading(false);
      }
    );

    const unsubFinances = onSnapshot(
      collection(db, ...base, 'finances'),
      (snap) => {
        let rev = 0;
        snap.forEach((d) => {
          const x = d.data();
          const t = String(x.type ?? '').toLowerCase();
          const a = Number(x.amount) || 0;
          if (t === 'revenue' || t === 'income' || t === 'הכנסה') {
            rev += a;
          }
        });
        setRevenue(Math.round(rev * 100) / 100);
      },
      () => setRevenue(0)
    );

    return () => {
      unsubProjects();
      unsubFinances();
    };
  }, [companyId, dataMode, sector]);

  const netProfit = Math.round((revenue - expenses) * 100) / 100;

  return {
    companyId,
    revenue,
    expenses,
    netProfit,
    projects,
    allProjects,
    loading,
  };
}

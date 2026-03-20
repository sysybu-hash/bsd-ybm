import { doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { getDb, projectCommunicationsRef, projectMilestonesRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { ProjectCommunication } from '@/types/multitenant';
import type { ProjectMilestoneDoc } from '@/types/projectMilestone';
import type { ProjectStatusReportPayload } from '@/services/reports/types';

function projectFinancials(data: Record<string, unknown>): {
  budget: number;
  actual: number;
  laborCosts: number;
  materialCosts: number;
} {
  const pl = (data.plSummary as Record<string, unknown> | undefined) ?? {};
  const L = typeof pl.laborCosts === 'number' ? pl.laborCosts : 0;
  const M = typeof pl.materialCosts === 'number' ? pl.materialCosts : 0;
  const actual = Math.round((L + M) * 100) / 100;
  const budgetedRaw =
    typeof pl.budgetedCost === 'number'
      ? pl.budgetedCost
      : typeof data.budgetedTotal === 'number'
        ? data.budgetedTotal
        : typeof data.budget === 'number'
          ? data.budget
          : null;
  const budget =
    budgetedRaw != null && budgetedRaw > 0
      ? Math.round(Number(budgetedRaw) * 100) / 100
      : actual > 0
        ? Math.round(actual * 1.18 * 100) / 100
        : 0;
  return {
    budget,
    actual,
    laborCosts: Math.round(L * 100) / 100,
    materialCosts: Math.round(M * 100) / 100,
  };
}

function formatWhen(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toLocaleString('he-IL');
    } catch {
      return '';
    }
  }
  return '';
}

function isClientVisibleComm(data: Record<string, unknown>): boolean {
  if (data.internal === true || data.visibility === 'internal') return false;
  return true;
}

export async function fetchProjectStatusReportPayload(
  companyId: string,
  projectId: string
): Promise<ProjectStatusReportPayload> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }
  const db = getDb();
  const pref = doc(db, 'companies', companyId, 'projects', projectId);
  const pSnap = await getDoc(pref);
  const pdata = (pSnap.exists() ? pSnap.data() : {}) as Record<string, unknown>;
  const { budget, actual, laborCosts, materialCosts } = projectFinancials(pdata);
  const variance = Math.round((actual - budget) * 100) / 100;
  const projectName = String(pdata.name ?? projectId);

  const mq = query(projectMilestonesRef(companyId, projectId), orderBy('order', 'asc'));
  const mSnap = await getDocs(mq);
  const completedMilestones: ProjectStatusReportPayload['completedMilestones'] = [];
  mSnap.forEach((d) => {
    const m = d.data() as ProjectMilestoneDoc;
    if (m.status !== 'completed') return;
    completedMilestones.push({
      title: m.title,
      targetDate: (m.targetDate ?? '').slice(0, 10),
    });
  });

  const cq = query(projectCommunicationsRef(companyId, projectId), orderBy('createdAt', 'desc'), limit(40));
  const cSnap = await getDocs(cq);
  const clientTimeline: ProjectStatusReportPayload['clientTimeline'] = [];
  cSnap.forEach((d) => {
    const data = d.data() as ProjectCommunication;
    const rec = data as unknown as Record<string, unknown>;
    if (!isClientVisibleComm(rec)) return;
    const kind = data.kind === 'task' ? 'משימה' : 'הודעה';
    const body = (data.body ?? '').slice(0, 120);
    const suffix = (data.body ?? '').length > 120 ? '…' : '';
    clientTimeline.push({
      title: `תקשורת — ${kind}`,
      subtitle: `${data.displayName ?? 'משתמש'} · ${body}${suffix}`,
      when: formatWhen(data.createdAt),
    });
  });
  clientTimeline.reverse();

  return {
    generatedAtIso: new Date().toISOString(),
    projectId,
    projectName,
    financial: {
      budget,
      actual,
      variance,
      laborCosts,
      materialCosts,
    },
    completedMilestones,
    clientTimeline: clientTimeline.slice(-20),
  };
}

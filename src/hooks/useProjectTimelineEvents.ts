'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import {
  projectCommunicationsRef,
  projectMilestonesRef,
  companyFinancesRef,
  companyScansRef,
} from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { ProjectCommunication } from '@/types/multitenant';
import type { ProjectMilestoneDoc } from '@/types/projectMilestone';
import type { ProjectTimelineEvent, ProjectTimelineVariant } from '@/types/projectTimeline';

function toMillis(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as Timestamp).toMillis === 'function') {
    try {
      return (v as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function buildFinanceEvent(docId: string, data: Record<string, unknown>, projectId: string): ProjectTimelineEvent | null {
  const pid = String(data.projectId ?? '');
  if (pid !== projectId) return null;

  const type = String(data.type ?? '').toLowerCase();
  const amount = Number(data.amount) || 0;
  const createdAt = data.createdAt ?? null;
  const ts = toMillis(createdAt) || Date.now();

  if (type === 'labor' || data.source === 'meckano_sync') {
    const hours = typeof data.hours === 'number' ? data.hours : Number(data.hours) || 0;
    const name = String(data.teamMemberName ?? data.teamMemberId ?? 'עובד');
    return {
      id: `fin-labor-${docId}`,
      kind: 'finance_labor',
      ts,
      createdAt,
      title: 'נוכחות / שעות עבודה (Meckano)',
      subtitle: `${name} · ${hours} ש׳ · ${Math.round(amount)} ₪`,
      color: 'orange',
      payload: { ...data, _docId: docId },
      sourceCollection: 'finances',
    };
  }

  if (type === 'revenue' || type === 'income' || type === 'הכנסה') {
    return {
      id: `fin-rev-${docId}`,
      kind: 'finance_revenue',
      ts,
      createdAt,
      title: 'תנועה כספית — הכנסה',
      subtitle: `${Math.round(amount)} ₪ · ${String(data.category ?? '')}`,
      color: 'green',
      payload: { ...data, _docId: docId },
      sourceCollection: 'finances',
    };
  }

  return {
    id: `fin-exp-${docId}`,
    kind: 'finance_expense',
    ts,
    createdAt,
    title: 'תנועה כספית — הוצאה',
    subtitle: `${Math.round(amount)} ₪ · ${String(data.vendor ?? data.category ?? type)}`,
    color: 'orange',
    payload: { ...data, _docId: docId },
    sourceCollection: 'finances',
  };
}

function buildScanEvent(docId: string, data: Record<string, unknown>, projectId: string): ProjectTimelineEvent | null {
  const pid = String(data.projectId ?? '');
  if (pid !== projectId) return null;
  const createdAt = data.createdAt ?? null;
  const ts = toMillis(createdAt) || Date.now();
  const files = data.fileNames;
  const fileHint = Array.isArray(files) ? `${files.length} קבצים` : 'סריקת AI';
  return {
    id: `scan-${docId}`,
    kind: 'scan',
    ts,
    createdAt,
    title: 'חשבונית / מסמך — סריקת AI',
    subtitle: `${fileHint} · ${String(data.status ?? '')}`,
    color: 'orange',
    payload: { ...data, _docId: docId },
    sourceCollection: 'scans',
  };
}

function milestoneToEvent(docId: string, data: ProjectMilestoneDoc, projectId: string): ProjectTimelineEvent | null {
  if (String(data.projectId ?? '') !== projectId) return null;
  if (data.status !== 'completed') return null;
  const ts = toMillis(data.completedAt ?? data.updatedAt) || Date.now();
  return {
    id: `ms-${docId}`,
    kind: 'milestone',
    ts,
    createdAt: (data.completedAt ?? data.updatedAt) ?? null,
    title: 'אבן דרך הושגה',
    subtitle: `${data.title} · יעד ${(data.targetDate ?? '').slice(0, 10) || '—'}`,
    color: 'green',
    payload: { ...(data as Record<string, unknown>), _docId: docId },
    sourceCollection: 'milestones',
  };
}

function commToEvent(docId: string, data: ProjectCommunication): ProjectTimelineEvent {
  const createdAt = data.createdAt ?? null;
  const ts = toMillis(createdAt) || Date.now();
  const kind = data.kind === 'task' ? 'משימה' : 'הודעה';
  return {
    id: `comm-${docId}`,
    kind: 'communication',
    ts,
    createdAt,
    title: `תקשורת — ${kind}`,
    subtitle: `${data.displayName ?? 'משתמש'} · ${(data.body ?? '').slice(0, 80)}${(data.body ?? '').length > 80 ? '…' : ''}`,
    color: 'blue',
    payload: { ...data, _docId: docId },
    sourceCollection: 'communications',
  };
}

function isClientVisibleComm(data: Record<string, unknown>): boolean {
  if (data.internal === true || data.visibility === 'internal') return false;
  return true;
}

/**
 * Merges communications, finances, and scans for a project. Real-time via onSnapshot.
 */
export function useProjectTimelineEvents(
  companyId: string | null,
  projectId: string | null,
  variant: ProjectTimelineVariant
) {
  const [communications, setCommunications] = useState<ProjectTimelineEvent[]>([]);
  const [finances, setFinances] = useState<ProjectTimelineEvent[]>([]);
  const [scans, setScans] = useState<ProjectTimelineEvent[]>([]);
  const [milestones, setMilestones] = useState<ProjectTimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sourcesDone = useRef(0);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || !projectId) {
      setCommunications([]);
      setFinances([]);
      setScans([]);
      setMilestones([]);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    sourcesDone.current = 0;
    const needed = variant === 'full' ? 4 : 2;
    let alive = true;

    const markSource = () => {
      if (!alive) return;
      sourcesDone.current += 1;
      if (sourcesDone.current >= needed) setLoading(false);
    };

    const qComm = query(projectCommunicationsRef(companyId, projectId), orderBy('createdAt', 'desc'));
    const unsubComm = onSnapshot(
      qComm,
      (snap) => {
        if (!alive) return;
        const list: ProjectTimelineEvent[] = [];
        snap.forEach((d) => {
          const data = d.data() as ProjectCommunication;
          const rec = asRecord(data) ?? {};
          if (variant === 'client' && !isClientVisibleComm(rec)) return;
          list.push(commToEvent(d.id, data));
        });
        setCommunications(list);
        markSource();
      },
      (err) => {
        console.error('timeline comm', err);
        if (alive) {
          setError('שגיאת טעינת תקשורת');
          markSource();
        }
      }
    );

    const unsubFin =
      variant === 'full'
        ? onSnapshot(
            companyFinancesRef(companyId),
            (snap) => {
              if (!alive) return;
              const list: ProjectTimelineEvent[] = [];
              snap.forEach((d) => {
                const data = asRecord(d.data());
                if (!data) return;
                const ev = buildFinanceEvent(d.id, data, projectId);
                if (ev) list.push(ev);
              });
              setFinances(list);
              markSource();
            },
            (err) => {
              console.error('timeline fin', err);
              if (alive) {
                setError((e) => e ?? 'שגיאת טעינת כספים');
                markSource();
              }
            }
          )
        : null;

    const unsubScan =
      variant === 'full'
        ? onSnapshot(
            companyScansRef(companyId),
            (snap) => {
              if (!alive) return;
              const list: ProjectTimelineEvent[] = [];
              snap.forEach((d) => {
                const data = asRecord(d.data());
                if (!data) return;
                const ev = buildScanEvent(d.id, data, projectId);
                if (ev) list.push(ev);
              });
              setScans(list);
              markSource();
            },
            (err) => {
              console.error('timeline scan', err);
              if (alive) {
                setError((e) => e ?? 'שגיאת טעינת סריקות');
                markSource();
              }
            }
          )
        : null;

    const qMs = query(projectMilestonesRef(companyId, projectId), orderBy('order', 'asc'));
    const unsubMs = onSnapshot(
      qMs,
      (snap) => {
        if (!alive) return;
        const list: ProjectTimelineEvent[] = [];
        snap.forEach((d) => {
          const data = d.data() as ProjectMilestoneDoc;
          const ev = milestoneToEvent(d.id, data, projectId);
          if (ev) list.push(ev);
        });
        setMilestones(list);
        markSource();
      },
      (err) => {
        console.error('timeline milestones', err);
        if (alive) {
          setError((e) => e ?? 'שגיאת טעינת אבני דרך');
          markSource();
        }
      }
    );

    const safety = window.setTimeout(() => {
      if (alive) setLoading(false);
    }, 4500);

    return () => {
      alive = false;
      window.clearTimeout(safety);
      unsubComm();
      unsubFin?.();
      unsubScan?.();
      unsubMs();
    };
  }, [companyId, projectId, variant]);

  const events = useMemo(() => {
    const merged =
      variant === 'full'
        ? [...communications, ...finances, ...scans, ...milestones]
        : [...communications, ...milestones];
    merged.sort((a, b) => a.ts - b.ts);
    return merged;
  }, [communications, finances, scans, milestones, variant]);

  return { events, error, loading: !companyId || !projectId ? false : loading };
}

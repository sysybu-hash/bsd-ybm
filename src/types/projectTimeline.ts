import type { Timestamp } from 'firebase/firestore';

export type ProjectTimelineVariant = 'full' | 'client';

export type TimelineEventKind =
  | 'communication'
  | 'finance_labor'
  | 'finance_expense'
  | 'finance_revenue'
  | 'scan'
  | 'milestone';

export type TimelineNodeColor = 'blue' | 'orange' | 'green';

export type ProjectTimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  /** ms since epoch for sorting */
  ts: number;
  createdAt: Timestamp | unknown | null;
  title: string;
  subtitle: string;
  color: TimelineNodeColor;
  /** Original Firestore payload for slide-over */
  payload: Record<string, unknown>;
  sourceCollection: 'communications' | 'finances' | 'scans' | 'milestones';
};

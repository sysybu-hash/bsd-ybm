export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export type ProjectMilestoneDoc = {
  companyId: string;
  projectId: string;
  title: string;
  targetDate: string;
  status: MilestoneStatus;
  order: number;
  completedAt?: unknown;
  updatedAt?: unknown;
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'ממתין',
  in_progress: 'בביצוע',
  completed: 'הושלם',
};

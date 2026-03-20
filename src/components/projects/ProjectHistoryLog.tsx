'use client';

import React from 'react';
import ProjectTimeline from '@/components/project/ProjectTimeline';

/** @deprecated Use ProjectTimeline directly; kept for backward compatibility */
export default function ProjectHistoryLog({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  return (
    <ProjectTimeline
      companyId={companyId}
      projectId={projectId}
      variant="full"
      heading="יומן פרויקט"
      subheading="ציר זמן אינטראקטיבי — לחצו על אירוע לפרטים מלאים"
      showFinanceFab
    />
  );
}

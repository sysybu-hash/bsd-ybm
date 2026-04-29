import { TableSkeleton } from "@/lib/polish/standards";

/** מסך טעינה בעת ניווט בין מקטעי `/app` (כולל רענון RSC) */
export default function AppWorkspaceLoading() {
  return (
    <div className="cd-canvas w-full min-w-0 space-y-6 py-4 md:py-6">
      <TableSkeleton rows={7} columns={4} />
    </div>
  );
}

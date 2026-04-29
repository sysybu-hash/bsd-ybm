import { TableSkeleton } from "@/lib/polish/standards";

export default function CrmClientLoading() {
  return (
    <div className="cd-canvas w-full min-w-0 space-y-6 py-4 md:py-6">
      <TableSkeleton rows={7} columns={4} />
    </div>
  );
}

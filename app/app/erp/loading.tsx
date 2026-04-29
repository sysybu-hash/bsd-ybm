import { TableSkeleton } from "@/lib/polish/standards";

export default function ErpLoading() {
  return (
    <div className="cd-canvas w-full min-w-0 space-y-6 py-4 md:py-6">
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}

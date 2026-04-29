import { TableSkeleton } from "@/lib/polish/standards";

export default function MeckanoLoading() {
  return (
    <div className="w-full min-w-0 space-y-6 py-4">
      <TableSkeleton rows={5} columns={3} />
    </div>
  );
}

import { TableSkeleton } from "@/lib/polish/standards";

export default function SettingsLoading() {
  return (
    <div className="w-full min-w-0 py-4">
      <TableSkeleton rows={5} columns={3} />
    </div>
  );
}

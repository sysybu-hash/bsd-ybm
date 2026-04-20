import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import { loadOperationsWorkspaceProps } from "@/lib/load-operations-workspace-props";

export const dynamic = "force-dynamic";

export default async function AppOperationsPage() {
  const props = await loadOperationsWorkspaceProps();
  return <OperationsWorkspaceV2 {...props} />;
}

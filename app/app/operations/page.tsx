import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import { loadOperationsWorkspaceProps } from "@/lib/load-operations-workspace-props";

export const dynamic = "force-dynamic";

export default async function AppOperationsPage() {
  const props = await loadOperationsWorkspaceProps();
  return (
    <WorkspaceEngineeringShell>
      <OperationsWorkspaceV2 {...props} />
    </WorkspaceEngineeringShell>
  );
}

import OperationsWorkspaceV2 from "@/components/operations/OperationsWorkspaceV2";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import { loadOperationsWorkspaceProps } from "@/lib/load-operations-workspace-props";
import { PageHeader } from "@/components/ui/claude";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

export default async function AppOperationsPage() {
  const props = await loadOperationsWorkspaceProps();
  return (
    <AppPageChrome>
    <WorkspaceEngineeringShell>
      <PageHeader
        eyebrow="Operations"
        title="תפעול"
        subtitle="נוכחות עובדים, שטח, תהליכי צוות וזרימות עבודה."
      />
      <OperationsWorkspaceV2 {...props} />
    </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}

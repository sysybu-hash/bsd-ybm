import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BusinessPageContent } from "@/app/workspace-content/business/BusinessPageContent";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";
import WorkspacePageHeader from "@/components/layout/WorkspacePageHeader";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import { authOptions } from "@/lib/auth";
import { loadBusinessShellStats } from "@/lib/load-business-shell-stats";

export const metadata = {
  title: "מרכז עסקי | BSD-YBM",
};

export const dynamic = "force-dynamic";

export default async function AppBusinessPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) redirect("/login");

  const { dataCoveragePct, opsFlowPct } = await loadBusinessShellStats(orgId);

  return (
    <WorkspaceEngineeringShell>
      <div className="w-full min-w-0 space-y-8" dir="rtl">
        <WorkspacePageHeader
          eyebrow="Business Center"
          title="מרכז עסקי"
          subtitle="תמונה עסקית רוחבית: הכנסות, הוצאות, CRM, ERP ותובנות מסונכרנות."
        />
        <BentoGrid>
          <Tile tone="clients" span={8}>
            <TileHeader eyebrow="כיסוי נתונים" />
            <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-clients-ink)]">
              ציון משוקלל לפי מסמכים סרוקים, אנשי קשר והנפקות — מתעדכן מול Neon בזמן אמת.
            </p>
            <div className="mt-4">
              <ProgressBar value={dataCoveragePct} axis="clients" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[color:var(--ink-500)]">
              {dataCoveragePct}% כיסוי נתונים משוער
            </p>
          </Tile>
          <Tile tone="finance" span={4}>
            <TileHeader eyebrow="תזרים תפעולי" />
            <p className="mt-3 text-sm font-bold text-[color:var(--axis-finance-ink)]">מסמכים מונפקים מול ממתינים לגבייה</p>
            <div className="mt-4">
              <ProgressBar value={opsFlowPct} axis="finance" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[color:var(--ink-500)]">{opsFlowPct}% יעילות תזרים (הערכה)</p>
          </Tile>
        </BentoGrid>
        <BusinessPageContent />
      </div>
    </WorkspaceEngineeringShell>
  );
}

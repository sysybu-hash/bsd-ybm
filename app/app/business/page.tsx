import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Building2, CreditCard, UsersRound } from "lucide-react";
import { BusinessPageContent } from "@/app/workspace-content/business/BusinessPageContent";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";
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
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {/* ── Hero: ברכה + 4 KPI + תובנת AI ── */}
      <Tile tone="clients" span={12}>
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">Business Center · Vision 2026</p>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-[color:var(--ink-900)]">
                מרכז עסקי
              </h1>
              <p className="mt-1 text-sm text-[color:var(--ink-500)]">
                תמונה עסקית רוחבית: הכנסות, הוצאות, CRM, ERP ותובנות מסונכרנות.
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--axis-clients-soft)] sm:flex">
              <Building2 className="h-6 w-6 text-[color:var(--axis-clients)]" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-[color:var(--axis-clients)]" strokeWidth={2} aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">כיסוי נתונים</p>
              </div>
              <p className="mt-2 text-xl font-black text-[color:var(--ink-900)] tracking-tight">{dataCoveragePct}%</p>
              <div className="mt-2">
                <ProgressBar value={dataCoveragePct} axis="clients" height={4} />
              </div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[color:var(--axis-finance)]" strokeWidth={2} aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">תזרים תפעולי</p>
              </div>
              <p className="mt-2 text-xl font-black text-[color:var(--ink-900)] tracking-tight">{opsFlowPct}%</p>
              <div className="mt-2">
                <ProgressBar value={opsFlowPct} axis="finance" height={4} />
              </div>
            </div>
          </div>
        </div>
      </Tile>

      <BusinessPageContent />
    </div>
  );
}

import AutomationsPageContent from "@/components/automations/AutomationsPageContent";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export const dynamic = "force-dynamic";

export default function SettingsAutomationsPage() {
  const meta = getSettingsHubNavItem("automations", false);

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} eyebrow="Automations" /> : null}
      <BentoGrid>
        <Tile tone="ai" span={8}>
          <TileHeader eyebrow="Flow builder" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-ai-ink)]">
            בונים כאן זרימות סביב מסמכים, גבייה ולקוחות — עם AI כשלב ביניים.
          </p>
          <div className="mt-4">
            <ProgressBar value={72} axis="ai" />
          </div>
        </Tile>
        <Tile tone="clients" span={4}>
          <TileHeader eyebrow="Recipes" />
          <p className="mt-3 text-sm font-semibold text-[color:var(--axis-clients-ink)]">תסריטים מומלצים בצד ימין של המסך</p>
        </Tile>
      </BentoGrid>
      <AutomationsPageContent />
    </div>
  );
}

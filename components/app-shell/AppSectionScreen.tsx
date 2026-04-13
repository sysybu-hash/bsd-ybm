import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, LayoutPanelTop } from "lucide-react";

type SectionAction = {
  href: string;
  label: string;
  kind?: "primary" | "secondary";
  icon?: LucideIcon;
};

type SectionStat = {
  label: string;
  value: string;
  tone?: "accent" | "success" | "neutral";
};

type SectionPanel = {
  title: string;
  body: string;
  items: string[];
};

type Props = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  legacyHref: string;
  legacyLabel: string;
  stats: SectionStat[];
  actions: SectionAction[];
  flow: string[];
  primaryPanel: SectionPanel;
  secondaryPanel: SectionPanel;
  rightRailTitle: string;
  rightRailItems: string[];
}>;

function toneClasses(tone: SectionStat["tone"]) {
  if (tone === "success") {
    return "bg-[color:var(--v2-success-soft)] text-[color:var(--v2-success)]";
  }

  if (tone === "accent") {
    return "bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]";
  }

  return "bg-[color:var(--v2-canvas)] text-[color:var(--v2-ink)]";
}

export default function AppSectionScreen({
  eyebrow,
  title,
  description,
  legacyHref,
  legacyLabel,
  stats,
  actions,
  flow,
  primaryPanel,
  secondaryPanel,
  rightRailTitle,
  rightRailItems,
}: Props) {
  return (
    <div className="grid gap-6">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">{eyebrow}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">{description}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action) => {
                const Icon = action.icon ?? (action.kind === "secondary" ? ArrowUpRight : ArrowLeft);
                const className =
                  action.kind === "secondary" ? "v2-button v2-button-secondary" : "v2-button v2-button-primary";

                return (
                  <Link key={`${action.href}-${action.label}`} href={action.href} className={className}>
                    {action.label}
                    <Icon className="h-4 w-4" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="v2-panel p-5">
            <div className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="text-sm font-black text-[color:var(--v2-ink)]">חלון עבודה ברור</p>
            </div>
            <div className="mt-4 grid gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className={`rounded-2xl px-4 py-3 ${toneClasses(stat.tone)}`}>
                  <p className="text-xs font-bold text-current/70">{stat.label}</p>
                  <p className="mt-2 text-lg font-black tracking-[-0.04em] text-current">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="v2-panel p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <h2 className="text-xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">איך משתמשים במסך הזה</h2>
          </div>

          <div className="mt-5 grid gap-4">
            {flow.map((item, index) => (
              <div key={item} className="flex items-start gap-4 rounded-[24px] bg-[color:var(--v2-canvas)] px-4 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="v2-panel v2-panel-highlight p-6">
          <p className="text-sm font-black text-[color:var(--v2-ink)]">{rightRailTitle}</p>
          <div className="mt-4 grid gap-3">
            {rightRailItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/78 px-4 py-4">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[color:var(--v2-success)]" aria-hidden />
                <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
              </div>
            ))}
          </div>

          <Link href={legacyHref} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[color:var(--v2-accent)] transition hover:opacity-80">
            פתיחת {legacyLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {[primaryPanel, secondaryPanel].map((panel) => (
          <article key={panel.title} className="v2-panel p-6">
            <h3 className="text-xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{panel.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{panel.body}</p>
            <div className="mt-4 grid gap-3">
              {panel.items.map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
                  <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

import Link from "next/link";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  Bot,
  CreditCard,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export const metadata = {
  title: "׳¢׳–׳¨׳” | BSD-YBM",
};

function HelpStep({
  step,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  icon: ReactNode;
}) {
  return (
    <article className="tile p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--ink-900)] text-sm font-black text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
              {icon}
            </span>
            <h2 className="text-lg font-black text-[color:var(--ink-900)]">{title}</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{description}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white">
              {primaryLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href={secondaryHref} className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white">
              {secondaryLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function AppHelpPage() {
  const session = await getServerSession(authOptions);
  const platformAdmin = isAdmin(session?.user?.email);

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          Workspace Guide
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          ׳”׳׳¡׳׳•׳ ׳”׳§׳¦׳¨ ׳‘׳™׳•׳×׳¨ ׳׳¢׳‘׳•׳“׳” ׳ ׳›׳•׳ ׳”, ׳‘׳˜׳•׳—׳” ׳•׳׳”׳™׳¨׳” ׳‘׳×׳•׳ ׳”׳׳¢׳¨׳›׳×.
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          ׳׳ ׳ ׳›׳ ׳¡׳× ׳׳¨׳׳©׳•׳ ׳”, ׳׳ ׳¢׳•׳‘׳“ ׳—׳“׳© ׳׳¦׳˜׳¨׳£, ׳׳• ׳׳ ׳¦׳¨׳™׳ ׳׳”׳×׳׳₪׳¡ ׳¢׳ ׳¡׳“׳¨ ׳”׳₪׳¢׳•׳׳•׳× ׳”׳ ׳›׳•׳, ׳–׳” ׳”׳“׳£ ׳©׳׳¡׳“׳¨ ׳׳× ׳”׳¦׳¢׳“׳™׳ ׳‘׳׳™ ׳¢׳•׳׳¡ ׳•׳‘׳׳™ ׳§׳₪׳™׳¦׳•׳× ׳׳™׳•׳×׳¨׳•׳×.
        </p>
      </header>

      <BentoGrid>
        <Tile tone="clients" span={8}>
          <TileHeader eyebrow="Workspace Guide" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-clients-ink)]">
            ׳”׳׳¢׳¨׳›׳× ׳‘׳ ׳•׳™׳” ׳׳׳¡׳׳•׳ ׳¢׳‘׳•׳“׳” ׳‘׳¨׳•׳¨: ׳׳ ׳•׳™, ׳׳¨׳’׳•׳, ׳׳©׳×׳׳©׳™׳, ׳•׳׳– ׳¢׳‘׳•׳“׳” ׳©׳•׳˜׳₪׳× ׳‘׳׳¡׳׳›׳™׳, ׳׳§׳•׳—׳•׳× ׳•׳›׳¡׳₪׳™׳.
          </p>
          <div className="mt-4">
            <ProgressBar value={75} axis="clients" />
          </div>
        </Tile>

        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="׳׳” ׳‘׳•׳“׳§׳™׳ ׳§׳•׳“׳" />
          <div className="mt-3 grid gap-2">
            {[
              "׳‘׳“׳™׳§׳× ׳׳ ׳•׳™, ׳—׳™׳•׳‘ ׳•׳׳׳¦׳¢׳™ ׳×׳©׳׳•׳ ׳₪׳¢׳™׳.",
              "׳”׳©׳׳׳× ׳₪׳¨׳˜׳™ ׳׳¨׳’׳•׳, ׳›׳×׳•׳‘׳×, AI ׳•׳׳™׳ ׳˜׳’׳¨׳¦׳™׳•׳×.",
              "׳₪׳×׳™׳—׳× ׳׳©׳×׳׳©׳™׳ ׳•׳”׳¨׳©׳׳•׳× ׳׳₪׳™ ׳×׳₪׳§׳™׳“.",
              "׳׳¢׳‘׳¨ ׳׳¢׳‘׳•׳“׳” ׳©׳•׳˜׳₪׳× ׳‘-Inbox, Clients ׳•-Billing.",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
                <p className="text-[12px] leading-6 text-[color:var(--ink-700)]">{item}</p>
              </div>
            ))}
          </div>
        </Tile>
      </BentoGrid>

      <section className="grid gap-4">
        <HelpStep
          step="1"
          title="׳‘׳“׳™׳§׳× ׳׳ ׳•׳™ ׳•׳—׳™׳•׳‘"
          description="׳׳•׳•׳“׳׳™׳ ׳©׳™׳© ׳׳¡׳׳•׳ ׳₪׳¢׳™׳, ׳׳׳¦׳¢׳™ ׳×׳©׳׳•׳ ׳×׳§׳™׳ ׳•׳’׳™׳©׳” ׳׳›׳׳™ ׳”׳¢׳‘׳•׳“׳” ׳”׳¨׳׳•׳•׳ ׳˜׳™׳™׳."
          primaryHref="/app/settings/billing"
          primaryLabel="׳₪׳×׳™׳—׳× ׳—׳™׳•׳‘"
          secondaryHref="/app/settings/billing?tab=control"
          secondaryLabel="׳׳¨׳›׳– ׳׳ ׳•׳™׳™׳"
          icon={<CreditCard className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="2"
          title="׳”׳©׳׳׳× ׳”׳’׳“׳¨׳•׳× ׳”׳׳¨׳’׳•׳"
          description="׳׳¢׳“׳›׳ ׳™׳ ׳₪׳¨׳˜׳™ ׳¢׳¡׳§, ׳׳¡, ׳›׳×׳•׳‘׳×, ׳“׳•׳׳™׳™׳, AI ׳•׳—׳™׳‘׳•׳¨׳™׳ ׳‘׳¡׳™׳¡׳™׳™׳."
          primaryHref="/app/settings/overview"
          primaryLabel="׳₪׳×׳™׳—׳× ׳”׳’׳“׳¨׳•׳×"
          secondaryHref="/app/operations"
          secondaryLabel="׳‘׳“׳™׳§׳× ׳×׳₪׳¢׳•׳"
          icon={<Settings className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="3"
          title="׳ ׳™׳”׳•׳ ׳׳©׳×׳׳©׳™׳ ׳•׳”׳¨׳©׳׳•׳×"
          description="׳׳–׳׳™׳ ׳™׳ ׳׳©׳×׳׳©׳™׳, ׳‘׳•׳“׳§׳™׳ ׳”׳¨׳©׳׳•׳×, ׳•׳׳•׳•׳“׳׳™׳ ׳©׳›׳ ׳׳—׳“ ׳׳’׳™׳¢ ׳׳׳¡׳›׳™׳ ׳©׳׳×׳׳™׳׳™׳ ׳׳•."
          primaryHref="/app/settings/organization"
          primaryLabel="׳׳©׳×׳׳©׳™׳ ׳•׳”׳’׳“׳¨׳•׳×"
          secondaryHref={platformAdmin ? "/app/admin" : "/app/inbox"}
          secondaryLabel={platformAdmin ? "Admin" : "׳׳¢׳‘׳¨ ׳-Inbox"}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="4"
          title="׳׳¢׳‘׳¨ ׳׳¢׳‘׳•׳“׳” ׳©׳•׳˜׳₪׳×"
          description="׳׳—׳¨׳™ ׳©׳”׳‘׳¡׳™׳¡ ׳׳•׳›׳, ׳¢׳•׳‘׳¨׳™׳ ׳׳×׳™׳‘׳× ׳”׳¢׳‘׳•׳“׳”, CRM, ׳׳¡׳׳›׳™׳, ׳—׳™׳•׳‘ ׳•׳×׳•׳‘׳ ׳•׳×."
          primaryHref="/app/inbox"
          primaryLabel="׳₪׳×׳™׳—׳× ׳×׳™׳‘׳× ׳¢׳‘׳•׳“׳”"
          secondaryHref="/app/ai#assistant"
          secondaryLabel="׳₪׳×׳™׳—׳× ׳×׳•׳‘׳ ׳•׳×"
          icon={<Workflow className="h-5 w-5" aria-hidden />}
        />
      </section>

      <BentoGrid>
        <Tile tone="neutral" span={7}>
          <TileHeader eyebrow="Quick Rescue" />
          <div className="mt-4 grid gap-3">
            {[
              { href: "/app/settings/billing", label: "׳‘׳“׳™׳§׳× ׳׳ ׳•׳™, ׳—׳™׳•׳‘ ׳•׳×׳©׳׳•׳׳™׳", icon: CreditCard },
              { href: "/app/settings/overview", label: "׳‘׳“׳™׳§׳× ׳”׳’׳“׳¨׳•׳×, ׳“׳•׳׳™׳™׳ ׳•-AI", icon: Bot },
              { href: "/app/clients", label: "׳‘׳“׳™׳§׳× ׳׳§׳•׳—׳•׳×, ׳¦׳ ׳¨׳× ׳•׳”׳§׳©׳¨׳™׳", icon: Shield },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3 transition hover:border-[color:var(--axis-clients)] hover:bg-[color:var(--canvas-sunken)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--canvas-sunken)] text-[color:var(--axis-clients)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex-1 text-[13px] font-black text-[color:var(--ink-900)]">{label}</span>
                <ArrowUpRight className="h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
              </Link>
            ))}
          </div>
        </Tile>

        <Tile tone="lavender" span={5}>
          <TileHeader eyebrow="Notes" />
          <div className="mt-4 grid gap-3">
            {[
              "׳”׳¢׳‘׳•׳“׳” ׳”׳™׳•׳׳™׳•׳׳™׳× ׳׳×׳‘׳¦׳¢׳× ׳×׳—׳× /app. ׳׳™׳ ׳¦׳•׳¨׳ ׳׳—׳–׳•׳¨ ׳׳׳¡׳›׳™ ׳¢׳•׳׳§ ׳׳׳ ׳׳ ׳™׳© ׳¦׳•׳¨׳ ׳¡׳₪׳¦׳™׳₪׳™.",
              "Meckano ׳–׳׳™׳ ׳¨׳§ ׳׳׳ ׳•׳™ ׳”׳׳•׳¨׳©׳” ׳©׳”׳•׳’׳“׳¨ ׳‘׳׳¢׳¨׳›׳×.",
              "׳‘׳׳§׳¨׳” ׳©׳ ׳¡׳₪׳§, ׳׳×׳—׳™׳׳™׳ ׳׳”׳׳¡׳ ׳”׳¨׳׳•׳•׳ ׳˜׳™ ׳‘׳™׳•׳×׳¨ ׳׳׳©׳™׳׳” ׳•׳׳ ׳׳”׳׳¢׳¨׳›׳× ׳”׳•׳•׳×׳™׳§׳” ׳©׳׳׳—׳•׳¨׳™׳•.",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-white/75 px-4 py-3">
                <p className="text-[13px] leading-6 text-[color:var(--ink-700)]">{item}</p>
              </div>
            ))}
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}


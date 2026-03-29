"use client";

import { useCallback, useState } from "react";
import { Play, Users, FileText, ScanLine } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

const VIDEO_SRC = {
  crm: "/tutorials/crm.mp4",
  erp: "/tutorials/erp.mp4",
  scanner: "/tutorials/scanner.mp4",
} as const;

type Kind = keyof typeof VIDEO_SRC;

function TutorialVideoOrAnimation({ kind }: { kind: Kind }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"try" | "video" | "anim">("try");
  const src = VIDEO_SRC[kind];

  const onVideoReady = useCallback(() => setMode("video"), []);
  const onVideoErr = useCallback(() => setMode("anim"), []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-inner">
      {mode !== "anim" ? (
        <video
          className={
            mode === "video"
              ? "absolute inset-0 h-full w-full object-cover"
              : "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          }
          src={src}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          onLoadedData={onVideoReady}
          onError={onVideoErr}
          aria-hidden={mode !== "video"}
        />
      ) : null}
      {mode !== "video" ? (
        <div className="absolute inset-0 flex flex-col p-4 md:p-6" aria-hidden>
          {kind === "crm" ? <AnimCrm /> : null}
          {kind === "erp" ? <AnimErp /> : null}
          {kind === "scanner" ? <AnimScanner /> : null}
        </div>
      ) : null}
      <div className="pointer-events-none absolute end-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur-sm">
        {t("landing.tutorialDuration")}
      </div>
    </div>
  );
}

function AnimCrm() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 text-white/90">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold text-blue-300">
        <Users size={16} /> CRM
      </div>
      <div className="bsd-tut-crm-row rounded-xl bg-white/5 px-3 py-2.5 backdrop-blur-sm">
        <div className="h-2 w-1/3 rounded bg-white/20" />
        <div className="mt-2 h-2 w-2/3 rounded bg-white/10" />
      </div>
      <div className="bsd-tut-crm-row rounded-xl bg-white/5 px-3 py-2.5 backdrop-blur-sm">
        <div className="h-2 w-2/5 rounded bg-white/20" />
        <div className="mt-2 h-2 w-1/2 rounded bg-white/10" />
      </div>
      <div className="bsd-tut-crm-row rounded-xl bg-white/5 px-3 py-2.5 backdrop-blur-sm">
        <div className="h-2 w-1/4 rounded bg-white/20" />
        <div className="mt-2 h-2 w-3/4 rounded bg-white/10" />
      </div>
    </div>
  );
}

function AnimErp() {
  return (
    <div className="flex h-full flex-col text-white/90">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
        <FileText size={16} /> ERP
      </div>
      <div className="flex flex-1 items-end justify-center gap-2 px-2 pb-2">
        <div className="bsd-tut-erp-bar w-[18%] rounded-t-lg bg-emerald-500/70" />
        <div className="bsd-tut-erp-bar w-[18%] rounded-t-lg bg-emerald-400/80" />
        <div className="bsd-tut-erp-bar w-[18%] rounded-t-lg bg-teal-400/80" />
        <div className="bsd-tut-erp-bar w-[18%] rounded-t-lg bg-cyan-500/70" />
      </div>
      <div className="mt-1 h-2 w-full rounded bg-white/10" />
    </div>
  );
}

function AnimScanner() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-white/90">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-violet-300">
        <ScanLine size={16} /> Scan
      </div>
      <div className="bsd-tut-scan-box relative flex h-[62%] w-[78%] items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/50 bg-violet-950/40">
        <div className="bsd-tut-scan-line pointer-events-none absolute start-0 end-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
        <div className="bsd-tut-scan-file rounded-lg bg-white/10 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="h-2 w-16 rounded bg-white/30" />
          <div className="mt-2 h-2 w-12 rounded bg-white/15" />
        </div>
      </div>
      <div className="mt-3 h-1.5 w-[70%] overflow-hidden rounded-full bg-white/10">
        <div className="bsd-tut-scan-progress h-full rounded-full bg-violet-500" />
      </div>
    </div>
  );
}

const ICONS = { crm: Users, erp: FileText, scanner: ScanLine } as const;

export default function LandingTutorialSection() {
  const { t, dir } = useI18n();

  const items: { kind: Kind; titleKey: string; bodyKey: string }[] = [
    { kind: "crm", titleKey: "landing.tutorial1Title", bodyKey: "landing.tutorial1Body" },
    { kind: "erp", titleKey: "landing.tutorial2Title", bodyKey: "landing.tutorial2Body" },
    { kind: "scanner", titleKey: "landing.tutorial3Title", bodyKey: "landing.tutorial3Body" },
  ];

  return (
    <section
      id="tutorial-videos"
      className="relative z-20 mx-4 mt-2 mb-24 scroll-mt-6 rounded-[4rem] border border-white/15 bg-slate-950/45 p-12 shadow-lg shadow-black/25 backdrop-blur-md md:mx-10 md:p-20"
      dir={dir}
    >
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-200">
          <Play size={12} className="shrink-0" aria-hidden />
          {t("landing.tutorialSectionKicker")}
        </span>
        <h2 className="mt-4 text-3xl font-black italic tracking-tight text-white md:text-5xl">
          {t("landing.tutorialHeading")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-slate-300 md:text-base leading-relaxed">
          {t("landing.tutorialIntro")}
        </p>
        <p className="mt-2 text-xs font-bold text-slate-500">{t("landing.tutorialDuration")}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        {items.map(({ kind, titleKey, bodyKey }) => {
          const Icon = ICONS[kind];
          return (
            <article
              key={kind}
              className="flex flex-col rounded-[2rem] border border-white/10 bg-black/20 p-6 shadow-md backdrop-blur-sm md:p-7"
            >
              <div className="mb-4 flex items-center justify-center gap-2 text-blue-300 md:justify-start">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                  <Icon size={20} aria-hidden />
                </span>
              </div>
              <TutorialVideoOrAnimation kind={kind} />
              <h3 className="mt-5 text-lg font-black text-white md:text-xl">{t(titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{t(bodyKey)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

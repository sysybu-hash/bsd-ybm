"use client";

import { motion } from "framer-motion";
import { FileText, Users, LayoutDashboard, Play } from "lucide-react";

export type VideoTutorialItem = {
  id: string;
  title: string;
  description: string;
  embedSrc: string | null;
  envHint: string;
  icon: typeof FileText;
};

const VIDEOS: VideoTutorialItem[] = [
  {
    id: "dashboard",
    title: "דשבורד — ניווט ושליטה",
    description:
      "מבט על המסך הראשי: כניסה ללוחות, התראות, חיפוש מהיר ומעבר בין מודולים.",
    icon: LayoutDashboard,
    embedSrc: process.env.NEXT_PUBLIC_VIDEO_TUTORIAL_DASHBOARD?.trim() || null,
    envHint: "NEXT_PUBLIC_VIDEO_TUTORIAL_DASHBOARD",
  },
  {
    id: "erp",
    title: "ERP — סריקה ומסמכים",
    description:
      "העלאת מסמך, פענוח AI, עריכה/תצוגה מקדימה ומחיקה ממאגר המסמכים.",
    icon: FileText,
    embedSrc: process.env.NEXT_PUBLIC_VIDEO_TUTORIAL_ERP?.trim() || null,
    envHint: "NEXT_PUBLIC_VIDEO_TUTORIAL_ERP",
  },
  {
    id: "crm",
    title: "CRM — לקוחות ופרויקטים",
    description:
      "פתיחת פרויקט, שיוך לקוחות, סטטוסים והפקת מסמך עבודה מול הלקוח.",
    icon: Users,
    embedSrc: process.env.NEXT_PUBLIC_VIDEO_TUTORIAL_CRM?.trim() || null,
    envHint: "NEXT_PUBLIC_VIDEO_TUTORIAL_CRM",
  },
];

function AnimatedClip({ id }: { id: string }) {
  if (id === "dashboard") {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-50 p-4">
        <div className="grid grid-cols-[120px_1fr] gap-3 h-full">
          <div className="rounded-xl bg-white border border-slate-200 p-2 space-y-1">
            {["דשבורד", "CRM", "ERP", "הגדרות"].map((l, i) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`text-[10px] rounded-lg px-2 py-1 ${i === 0 ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600"}`}
              >
                {l}
              </motion.div>
            ))}
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-3 text-[10px] text-slate-500">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-2 bg-slate-200 rounded-full mb-2"
            />
            ווידג׳טים חיים, חיפוש גלובלי, והפניות מהירות לפעולות מרכזיות.
          </div>
        </div>
      </div>
    );
  }
  if (id === "erp") {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-indigo-50 p-4">
        <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-white h-full flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="text-[var(--primary-color,#3b82f6)] text-sm font-black"
          >
            העלאת חשבונית
          </motion.div>
          <div className="w-40 h-2 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              animate={{ width: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
            />
          </div>
          <div className="text-[10px] text-slate-500">פענוח → שמירה למסמכים</div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-emerald-50 p-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {["לקוח חדש", "שיוך לפרויקט", "הצעת מחיר"].map((row, i) => (
          <motion.div
            key={row}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18 }}
            className="text-[10px] px-3 py-2 border-b border-slate-100 text-slate-700"
          >
            {row}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VideoFrame({ item, index }: { item: VideoTutorialItem; index: number }) {
  const Icon = item.icon;
  const hasEmbed = Boolean(item.embedSrc);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {hasEmbed ? (
          <iframe
            title={item.title}
            src={item.embedSrc!}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0">
            <AnimatedClip id={item.id} />
            <div className="absolute bottom-2 left-2 rounded-full border border-slate-200/90 bg-white/95 text-[10px] px-2 py-1 text-slate-600 shadow-sm">
              אנימציה מובנית
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary-color,#3b82f6)]">
            <Icon size={22} aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function LandingVideoTutorials() {
  return (
    <section
      className="mb-24 scroll-mt-28"
      id="video-tutorials"
      aria-labelledby="video-tutorials-heading"
    >
      <div className="mb-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-800"
        >
          <Play size={14} className="shrink-0" aria-hidden />
          שלוש הדרכות וידאו
        </motion.p>
        <h2
          id="video-tutorials-heading"
          className="text-3xl font-black italic text-slate-900 md:text-4xl"
        >
          הכירו את המערכת — שלב אחר שלב
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          שלוש אנימציות תפעול: דשבורד, ERP ו־CRM. ניתן להחליף לסרטוני וידאו אמיתיים דרך משתני סביבה.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {VIDEOS.map((item, i) => (
          <VideoFrame key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  Home,
  Info,
  Mail,
  Sparkles,
  X,
  MessageCircle,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { marketingSans } from "@/lib/fonts/marketing-fonts";

const HERO_LOGO = "/landing-hero-title-art.png";
const WHATSAPP_HREF =
  "https://wa.me/972525640021?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A0%D7%99%20%D7%A4%D7%95%D7%A0%D7%94%20%D7%9E%D7%91%D7%A8%D7%A7%20%D7%99%D7%91%D7%9D";

type Props = {
  open: boolean;
  onClose: (open: boolean) => void;
};

function NavRow({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0a0b14] px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-indigo-500/30 hover:bg-indigo-500/15"
    >
      <span className="rounded-lg bg-indigo-500/15 p-1.5">
        <Icon className="h-4 w-4 text-indigo-400" aria-hidden />
      </span>
      {label}
    </Link>
  );
}

export default function LandingNavDrawer({ open, onClose }: Props) {
  const { t, dir } = useI18n();
  const pathname = usePathname() ?? "";
  const close = () => onClose(false);

  const pricingHref = "/#pricing";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[200]">
      <DialogBackdrop
        transition
        className="fixed inset-0 z-[201] bg-gray-900/35 transition duration-300 ease-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 z-[202] overflow-hidden" dir={dir}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className={`pointer-events-auto relative flex h-full w-[min(100vw,22rem)] max-w-[100vw] flex-col border-l border-white/[0.08] bg-[#0a0b14] shadow-xl shadow-gray-200/70 transition duration-300 ease-out data-[closed]:translate-x-full data-[closed]:opacity-0 sm:w-[min(100vw,24rem)] ${marketingSans.className}`}
            >
              {/* Header */}
              <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.07] bg-[#0a0b14] px-4 py-3.5">
                <DialogTitle className="sr-only">
                  {t("marketingDrawer.navAria")}
                </DialogTitle>
                <p className="text-sm font-black italic tracking-tight" style={{ color: "var(--primary-color, #2563eb)" }}>
                  BSD-YBM
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.05] hover:text-white"
                  aria-label={t("marketingDrawer.closeMenu")}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {/* לוגו */}
              <div className="border-b border-white/[0.07] px-4 py-4">
                <div className="mx-auto max-h-20 w-full max-w-[14rem]">
                  <Image
                    src={HERO_LOGO}
                    alt={t("landing.heroTitle")}
                    width={800}
                    height={200}
                    className="h-auto w-full object-contain object-center"
                    unoptimized
                  />
                </div>
              </div>

              {/* ניווט */}
              <nav
                className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 text-start"
                aria-label={t("marketingDrawer.navAria")}
              >
                <NavRow href="/" icon={Home} label={t("marketingDrawer.home")} onNavigate={close} />
                <NavRow href="/about" icon={Info} label={t("marketingDrawer.about")} onNavigate={close} />
                <NavRow href="/contact" icon={Mail} label={t("marketingDrawer.contact")} onNavigate={close} />

                {/* כרטיס פרטי קשר */}
                <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-white/65">
                  <p className="mb-2 font-bold text-white">
                    {t("marketingDrawer.contact")}
                  </p>
                  <p className="text-white/55 text-xs">{t("marketingDrawer.contactAddress")}</p>
                  <a
                    href="tel:+972525640021"
                    className="mt-2 block font-medium text-white/75 hover:text-indigo-300"
                    onClick={close}
                  >
                    {t("marketingDrawer.contactPhone")}
                  </a>
                  <a
                    href="mailto:sysybu@gmail.com"
                    className="mt-1 block font-medium text-indigo-400 hover:text-indigo-800"
                    onClick={close}
                  >
                    {t("marketingDrawer.contactEmail")}
                  </a>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white shadow transition hover:brightness-110"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {t("marketingDrawer.whatsappQuick")}
                  </a>
                </div>

                {/* כפתור מחירים */}
                <Link
                  href={pricingHref}
                  scroll={pathname === "/"}
                  onClick={close}
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-3.5 text-sm font-black text-indigo-300 shadow-sm transition hover:bg-indigo-500/25"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t("marketingDrawer.subscribe")}
                </Link>

                <Link
                  href="/dashboard/billing"
                  onClick={close}
                  className="text-center text-xs font-semibold text-white/35 underline-offset-2 hover:text-indigo-300 hover:underline"
                >
                  {t("marketingDrawer.billingLink")}
                </Link>
              </nav>

              {/* Footer — כניסה/הרשמה */}
              <div className="relative border-t border-white/[0.07] px-4 py-5 space-y-2">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition hover:opacity-90"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <LogIn size={16} /> כניסה למערכת
                </Link>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-sm font-bold text-white/65 transition hover:bg-white/[0.05]"
                >
                  <LayoutDashboard size={15} /> לדשבורד
                </Link>
                <p className="text-center text-[0.8rem] font-medium italic leading-snug text-white/45 pt-1">
                  {t("marketingDrawer.brandQuote")}
                </p>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

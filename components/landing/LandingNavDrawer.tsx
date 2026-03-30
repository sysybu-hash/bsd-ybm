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
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50/80"
    >
      <Icon className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
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
        className="fixed inset-0 z-[201] bg-slate-300/55 backdrop-blur-sm transition duration-300 ease-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 z-[202] overflow-hidden" dir={dir}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className={`pointer-events-auto relative flex h-full w-[min(100vw,22rem)] max-w-[100vw] flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-300/40 backdrop-blur-xl transition duration-300 ease-out data-[closed]:translate-x-full data-[closed]:opacity-0 sm:w-[min(100vw,24rem)] ${marketingSans.className}`}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-slate-50/90"
                aria-hidden
              />

              <div className="relative flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <DialogTitle className="sr-only">
                  {t("marketingDrawer.navAria")}
                </DialogTitle>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800/90">
                  BSD-YBM
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={t("marketingDrawer.closeMenu")}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="relative border-b border-slate-100 px-4 py-4">
                <div className="mx-auto max-h-24 w-full max-w-[16rem]">
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

              <nav
                className="relative flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 text-start"
                aria-label={t("marketingDrawer.navAria")}
              >
                <NavRow
                  href="/"
                  icon={Home}
                  label={t("marketingDrawer.home")}
                  onNavigate={close}
                />
                <NavRow
                  href="/about"
                  icon={Info}
                  label={t("marketingDrawer.about")}
                  onNavigate={close}
                />
                <NavRow
                  href="/contact"
                  icon={Mail}
                  label={t("marketingDrawer.contact")}
                  onNavigate={close}
                />

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-sm leading-relaxed text-slate-700">
                  <p className="mb-2 font-bold text-amber-900">
                    {t("marketingDrawer.contact")}
                  </p>
                  <p className="text-slate-600">
                    {t("marketingDrawer.contactAddress")}
                  </p>
                  <a
                    href="tel:+972525640021"
                    className="mt-2 block font-medium text-slate-900 hover:text-amber-800"
                    onClick={close}
                  >
                    {t("marketingDrawer.contactPhone")}
                  </a>
                  <a
                    href="mailto:sysybu@gmail.com"
                    className="mt-1 block font-medium text-blue-700 hover:text-blue-800"
                    onClick={close}
                  >
                    {t("marketingDrawer.contactEmail")}
                  </a>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-900/30 transition hover:brightness-110"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {t("marketingDrawer.whatsappQuick")}
                  </a>
                </div>

                <Link
                  href={pricingHref}
                  scroll={pathname === "/"}
                  onClick={close}
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-amber-200 via-yellow-100 to-slate-200 px-4 py-3.5 text-center text-base font-black text-slate-900 shadow-lg shadow-amber-900/25 ring-1 ring-amber-300/50 transition hover:brightness-105"
                >
                  <Sparkles className="h-5 w-5 text-amber-800" aria-hidden />
                  {t("marketingDrawer.subscribe")}
                </Link>

                <Link
                  href="/dashboard/billing"
                  onClick={close}
                  className="text-center text-xs font-semibold text-slate-500 underline-offset-2 hover:text-amber-800 hover:underline"
                >
                  {t("marketingDrawer.billingLink")}
                </Link>
              </nav>

              <div className="relative border-t border-slate-100 px-4 py-5">
                <p className="text-center text-[0.95rem] font-medium italic leading-snug text-slate-600">
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

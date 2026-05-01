import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}>;

export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-lg">
      <div className="overflow-hidden rounded-[30px] border border-white/90 bg-white/86 shadow-[0_32px_90px_-56px_rgba(42,35,24,0.55)] backdrop-blur-xl">
        <div className="border-b border-[#eadfce] bg-[linear-gradient(180deg,#ffffff_0%,#fbf6ee_100%)] px-6 py-7 text-center sm:px-8">
          {icon ? (
            <div className="mb-4 flex justify-center text-[#f9134d]">{icon}</div>
          ) : (
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] text-sm font-black text-white shadow-[0_18px_40px_-20px_rgba(17,24,39,0.85)]">
                BY
              </div>
            </div>
          )}
          <h1 className="!text-[#f9134d] text-2xl font-black">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-7 text-[#607089]">{subtitle}</p>
          ) : null}
        </div>
        <div className="px-6 pb-7 pt-6 sm:px-8">{children}</div>
      </div>
    </div>
  );
}

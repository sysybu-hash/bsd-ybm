type Props = {
  title: string;
  description: string;
};

/** כותרת אחידה לעמודי מרכז ההגדרות */
export default function SettingsPageHeader({ title, description }: Props) {
  return (
    <header className="glass-2026-panel relative z-0 mb-6 overflow-hidden p-5 sm:p-6">
      <h1 className="relative z-[1] text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-3xl">{title}</h1>
      <p className="relative z-[1] mt-2 max-w-3xl text-sm leading-7 text-[color:var(--v2-muted)] sm:text-base">{description}</p>
    </header>
  );
}

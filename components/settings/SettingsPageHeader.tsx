type Props = {
  title: string;
  description: string;
  eyebrow?: string;
};

export default function SettingsPageHeader({ title, description, eyebrow = "System settings" }: Props) {
  return (
    <header className="mb-5 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--ops-indigo)]">
        {eyebrow}
      </p>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[color:var(--ink-500)]">
            {description}
          </p>
        </div>
        <span className="w-fit rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-2 text-[11px] font-black text-[color:var(--ink-600)]">
          מקור אמת יחיד
        </span>
      </div>
    </header>
  );
}

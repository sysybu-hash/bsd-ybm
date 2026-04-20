type Props = {
  title: string;
  description: string;
  eyebrow?: string;
};

/** Pro Bento — כותרת אחידה לעמודי מרכז ההגדרות */
export default function SettingsPageHeader({ title, description, eyebrow }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-1 px-1">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[28px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[34px]">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[color:var(--ink-500)]">
        {description}
      </p>
    </header>
  );
}

'use client';

import React from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

/** ברירת מחדל לשדה יחיד (לוגו וכו') */
export const HEBREW_ADD_FROM_FILE = 'הוספה מקובץ';

/** בחירה מרובה (ייבוא, סריקה) */
export const HEBREW_ADD_FROM_FILES = 'הוספה מקבצים';

type Props = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  uploadingLabel?: string;
  /** דורס את הטקסט כשלא במצב העלאה */
  labelOverride?: string;
  className?: string;
  /** ברירת מחדל: מוסתר מסקרין-רידר; אפשר `hidden` אם הורה משתמש ב-dashed area */
  inputClassName?: string;
  /** כפתור כהה (ייבוא מסמכים וכו') */
  variant?: 'default' | 'solidBlue';
};

/**
 * כפתור עקבי: אייקון + "הוספה מקובץ" / "הוספה מקבצים" + input מוסתר.
 */
export default function AddFromFileButton({
  onChange,
  accept = '*/*',
  multiple = false,
  disabled = false,
  uploading = false,
  uploadingLabel = 'מעלה…',
  labelOverride,
  className,
  inputClassName = 'sr-only',
  variant = 'default',
}: Props) {
  const text =
    uploading ? uploadingLabel : labelOverride ?? (multiple ? HEBREW_ADD_FROM_FILES : HEBREW_ADD_FROM_FILE);

  return (
    <label
      className={clsx(
        'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[32px] px-6 py-3 text-sm font-bold transition-colors',
        variant === 'default' &&
          'border border-[#E5E7EB] bg-[#F8F9FA] text-[#111827] hover:bg-white',
        variant === 'solidBlue' && 'border-0 bg-[#001A4D] text-white shadow-md hover:bg-[#002b6b]',
        (disabled || uploading) && 'pointer-events-none opacity-50',
        className
      )}
    >
      <Upload className={clsx('h-4 w-4 shrink-0', variant === 'solidBlue' && 'text-white')} aria-hidden />
      <span>{text}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className={inputClassName}
        disabled={disabled || uploading}
        onChange={onChange}
      />
    </label>
  );
}

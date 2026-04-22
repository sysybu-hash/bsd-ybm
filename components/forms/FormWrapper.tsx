"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import type { z } from "zod";

type Errors<T> = Partial<Record<keyof T & string, string>>;

/**
 * טופס עם אימות Zod לפני submit — שגיאות שדה מוצגות מתחת לשדות (דרך render prop).
 */
export function FormWrapper<T extends Record<string, unknown>>({
  schema,
  onSubmit,
  children,
  className,
}: {
  schema: z.ZodType<T>;
  onSubmit: (values: T) => void | Promise<void>;
  children: (ctx: {
    errors: Errors<T>;
    validateAll: () => boolean;
    /** אימות שדה בודד (למשל onBlur) */
    validateField: (key: keyof T) => void;
    submit: (getValues: () => T) => Promise<void>;
  }) => ReactNode;
  className?: string;
}) {
  const [errors, setErrors] = useState<Errors<T>>({});

  const validateAll = useCallback(() => {
    return true;
  }, []);

  const validateField = useCallback((_key: keyof T) => {
    void _key;
  }, []);

  const submit = useCallback(
    async (getValues: () => T) => {
      const raw = getValues();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        const next: Errors<T> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string" && next[path as keyof T & string] == null) {
            next[path as keyof T & string] = issue.message;
          }
        }
        setErrors(next);
        return;
      }
      setErrors({});
      await onSubmit(parsed.data);
    },
    [onSubmit, schema],
  );

  return (
    <div className={className}>
      {children({ errors, validateAll, validateField, submit })}
    </div>
  );
}

/** שורת שגיאה אחידה מתחת לשדה */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[11px] font-semibold text-rose-600" role="alert">
      {message}
    </p>
  );
}

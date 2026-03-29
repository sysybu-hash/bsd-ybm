import type { CrmAdminOrganizationRow } from "./CrmOrganizationsAdminTable";

export type OrganizationRowFromDb = {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  users: { email: string }[];
};

function pickCanonicalRow(
  a: OrganizationRowFromDb,
  b: OrganizationRowFromDb,
): OrganizationRowFromDb {
  const ae = a.users[0]?.email?.trim() ?? "";
  const be = b.users[0]?.email?.trim() ?? "";
  if (ae && !be) return a;
  if (be && !ae) return b;
  return a.createdAt.getTime() >= b.createdAt.getTime() ? a : b;
}

/**
 * מאחד תצוגת בעלים כשיש כמה רשומות Organization עם אותו שם (נפוץ אחרי הרשמות חוזרות / באגים).
 * מפתח קיבוץ: שם מנורמל; נשמר ארגון "טוב יותר" (עם אימייל משתמש ראשון אם קיים, אחרת העדכני ביותר).
 * סכומי חשבוניות מצטברים לשורה אחת.
 */
export function dedupeOrganizationsForCrmDisplay(
  raw: OrganizationRowFromDb[],
  totalByOrgId: Map<string, number>,
): CrmAdminOrganizationRow[] {
  const groupKey = (o: OrganizationRowFromDb) => o.name.trim().toLowerCase();

  type Agg = {
    row: OrganizationRowFromDb;
    invoiceTotal: number;
  };

  const bestByKey = new Map<string, Agg>();

  for (const o of raw) {
    const k = groupKey(o);
    const inv = totalByOrgId.get(o.id) ?? 0;
    const prev = bestByKey.get(k);
    if (!prev) {
      bestByKey.set(k, { row: o, invoiceTotal: inv });
      continue;
    }
    prev.invoiceTotal += inv;
    prev.row = pickCanonicalRow(prev.row, o);
  }

  const rows: CrmAdminOrganizationRow[] = [...bestByKey.values()].map(
    ({ row, invoiceTotal }) => ({
      id: row.id,
      name: row.name,
      plan: row.plan,
      users: row.users,
      invoiceTotalAmount: invoiceTotal,
    }),
  );

  rows.sort((a, b) =>
    a.name.localeCompare(b.name, "he", { sensitivity: "base" }),
  );
  return rows;
}

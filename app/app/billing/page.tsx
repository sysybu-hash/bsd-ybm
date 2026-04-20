import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

function toQueryString(params: Record<string, string | string[] | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => usp.append(key, v));
    } else {
      usp.set(key, val);
    }
  }
  const q = usp.toString();
  return q ? `?${q}` : "";
}

/** תאימות: נתיב ישן — מפנה למרכז ההגדרות */
export default async function AppBillingLegacyRedirect({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  redirect(`/app/settings/billing${toQueryString(sp)}`);
}

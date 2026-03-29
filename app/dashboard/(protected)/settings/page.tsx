import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsPageClient from "./SettingsPageClient";

const VALID_TABS = new Set([
  "account",
  "erp",
  "crm",
  "ai",
  "billing",
  "cloud",
]);

type SearchParams = { tab?: string };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  const sp = await searchParams;
  const tabParam = sp.tab?.trim().toLowerCase() ?? "";
  const initialTab = VALID_TABS.has(tabParam) ? tabParam : undefined;

  let org: {
    name: string;
    type: string;
    companyType: string;
    taxId: string | null;
    address: string | null;
  } | null = null;
  if (session?.user?.organizationId) {
    org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        name: true,
        type: true,
        companyType: true,
        taxId: true,
        address: true,
      },
    });
  }

  return <SettingsPageClient initialOrg={org} initialTab={initialTab} />;
}

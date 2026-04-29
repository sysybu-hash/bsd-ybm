import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppShellV2 from "@/components/app-shell/AppShellV2";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import WorkspacePageMotion from "@/components/workspace/WorkspacePageMotion";
import MainContainer from "@/components/layout/MainContainer";
import { WorkspaceContextProvider } from "@/components/workspace/WorkspaceContext";
import { polishOrganizationState } from "@/app/actions/workspace-polish";
import { needsIndustryConfigPolish } from "@/lib/polish/industry-config";

const workspaceOrgSelect = {
  industry: true,
  constructionTrade: true,
  industryConfigJson: true,
  subscriptionTier: true,
  subscriptionStatus: true,
} as const;

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** אכיפת נתיבי primary לפי מקצוע — ב־`middleware.ts` (getHiddenPrimaryRouteIds) + ניווט מסונן ב־AppShell */
export default async function AppWorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId ?? null;
  const [organizationInitial, hasMeckanoAccess] = await Promise.all([
    organizationId
      ? prisma.organization.findUnique({
          where: { id: organizationId },
          select: workspaceOrgSelect,
        })
      : Promise.resolve(null),
    canAccessMeckano(session),
  ]);

  /** מילוי `industryConfigJson` ברירת מחדל — רק כשחסר; מרונדר מחדש עם נתוני DB אחרי patch */
  let organization = organizationInitial;
  if (
    organizationId &&
    organization &&
    needsIndustryConfigPolish(organization.industryConfigJson)
  ) {
    const polish = await polishOrganizationState(organizationId);
    if (polish.success && polish.data?.patched) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: workspaceOrgSelect,
      });
    }
  }

  // הפניה לonboarding אם עדיין לא נבחר מקצוע (רק בדפים שאינם onboarding עצמו)
  // נבדוק URL מהבקשה — אך ב-RSC אין גישה ישירה ל-pathname, אז בדיקה בצד ה-middleware
  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? session.user.organizationIndustry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade ?? session.user.organizationConstructionTrade,
    messages,
  );

  return (
    <WorkspaceContextProvider>
      <div data-theme="claude" className="min-h-screen bg-[color:var(--cd-bg)]">
        <AppShellV2
          user={{
            name: session.user.name?.trim() || session.user.email.split("@")[0],
            email: session.user.email,
            organizationId,
            role: session.user.role ?? "",
            isPlatformAdmin: isAdmin(session.user.email),
            subscriptionTier: organization?.subscriptionTier ?? "FREE",
            subscriptionStatus: organization?.subscriptionStatus ?? "INACTIVE",
            hasMeckanoAccess,
            industryProfile,
          }}
        >
          <WorkspacePageMotion>
            <MainContainer>{children}</MainContainer>
          </WorkspacePageMotion>
        </AppShellV2>
      </div>
    </WorkspaceContextProvider>
  );
}

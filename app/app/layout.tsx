import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppShellV2 from "@/components/app-shell/AppShellV2";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getMessages } from "@/lib/i18n/load-messages";
import type { MessageTree } from "@/lib/i18n/keys";
import { getIndustryProfile, type IndustryProfile } from "@/lib/professions/runtime";
import WorkspacePageMotion from "@/components/workspace/WorkspacePageMotion";
import MainContainer from "@/components/layout/MainContainer";
import { WorkspaceContextProvider } from "@/components/workspace/WorkspaceContext";
import { needsIndustryConfigPolish } from "@/lib/polish/industry-config";
import { polishOrganizationIndustryConfigFromRsc } from "@/lib/polish/polish-organization-industry-rsc";
import { isGeminiConfigured } from "@/lib/ai-providers";

const workspaceOrgSelect = {
  industry: true,
  constructionTrade: true,
  industryConfigJson: true,
  subscriptionTier: true,
  subscriptionStatus: true,
} as const;

async function fetchWorkspaceOrganization(orgId: string) {
  try {
    return await prisma.organization.findUnique({
      where: { id: orgId },
      select: workspaceOrgSelect,
    });
  } catch (e) {
    console.error("[app/layout] prisma.organization.findUnique failed", e);
    return null;
  }
}

function safeIndustryProfile(
  industry: string | undefined,
  industryConfigJson: unknown,
  constructionTrade: string | null | undefined,
  messages: MessageTree,
): IndustryProfile {
  try {
    return getIndustryProfile(industry, industryConfigJson, constructionTrade, messages);
  } catch (e) {
    console.error("[app/layout] getIndustryProfile failed", e);
    try {
      return getIndustryProfile("CONSTRUCTION", undefined, null, getMessages("he"));
    } catch (e2) {
      console.error("[app/layout] getIndustryProfile fallback (CONSTRUCTION+he) failed", e2);
      return getIndustryProfile("GENERAL", undefined, null, null);
    }
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** אכיפת נתיבי primary לפי מקצוע — ב־`middleware.ts` (getHiddenPrimaryRouteIds) + ניווט מסונן ב־AppShell */
export default async function AppWorkspaceLayout({ children }: { children: ReactNode }) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.error("[app/layout] getServerSession failed", e);
    redirect("/login");
  }

  if (!session?.user?.email) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId ?? null;

  let organizationInitial = null as Awaited<ReturnType<typeof fetchWorkspaceOrganization>>;
  let hasMeckanoAccess = false;
  try {
    const [org, meckano] = await Promise.all([
      organizationId ? fetchWorkspaceOrganization(organizationId) : Promise.resolve(null),
      canAccessMeckano(session),
    ]);
    organizationInitial = org;
    hasMeckanoAccess = meckano;
  } catch (e) {
    console.error("[app/layout] Promise.all(org + meckano) failed", e);
    try {
      hasMeckanoAccess = await canAccessMeckano(session);
    } catch (e2) {
      console.error("[app/layout] canAccessMeckano fallback failed", e2);
      hasMeckanoAccess = false;
    }
  }

  /** מילוי `industryConfigJson` ברירת מחדל — רק כשחסר; מרונדר מחדש עם נתוני DB אחרי patch */
  let organization = organizationInitial;
  if (
    organizationId &&
    organization &&
    needsIndustryConfigPolish(organization.industryConfigJson)
  ) {
    try {
      const uid = session.user.id;
      if (typeof uid === "string" && uid.length > 0) {
        const patched = await polishOrganizationIndustryConfigFromRsc(organizationId, uid);
        if (patched) {
          const refreshed = await fetchWorkspaceOrganization(organizationId);
          if (refreshed) organization = refreshed;
        }
      }
    } catch (e) {
      console.error("[app/layout] polish industry config / refresh failed", e);
    }
  }

  // הפניה לonboarding אם עדיין לא נבחר מקצוע (רק בדפים שאינם onboarding עצמו)
  // נבדוק URL מהבקשה — אך ב-RSC אין גישה ישירה ל-pathname, אז בדיקה בצד ה-middleware
  let messages: MessageTree;
  try {
    messages = await readRequestMessages();
  } catch (e) {
    console.error("[app/layout] readRequestMessages failed", e);
    messages = getMessages("he");
  }

  const industryProfile = safeIndustryProfile(
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
            geminiConfigured: isGeminiConfigured(),
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

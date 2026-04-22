import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NextFetchEvent } from "next/server";
import { negotiateLocale } from "@/lib/i18n/negotiate";
import { COOKIE_LOCALE } from "@/lib/i18n/config";
import {
  shouldBlockWorkspacePrimaryPath,
  workspaceFeatureInputFromJwtClaims,
} from "@/lib/workspace-features";
import { mapDashboardPathToApp } from "@/lib/dashboard-to-app-redirect";
import { API_MSG_UNAUTHORIZED } from "@/lib/api-json";

function hasAuthenticatedToken(token: NextRequestWithAuth["nextauth"]["token"]): boolean {
  if (!token) return false;
  const id = typeof token.id === "string" ? token.id.trim() : "";
  const sub = typeof token.sub === "string" ? token.sub.trim() : "";
  const email = typeof token.email === "string" ? token.email.trim() : "";
  return id.length > 0 || sub.length > 0 || email.length > 0;
}

function hasNextAuthSessionCookie(request: NextRequest): boolean {
  return (
    Boolean(request.cookies.get("next-auth.session-token")?.value) ||
    Boolean(request.cookies.get("__Secure-next-auth.session-token")?.value)
  );
}

function patchLocaleCookie(request: NextRequest, response: NextResponse) {
  if (!request.cookies.get(COOKIE_LOCALE)?.value) {
    const locale = negotiateLocale(request.headers.get("accept-language"));
    response.cookies.set(COOKIE_LOCALE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
}

const authMiddleware = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    /** נתיבים שדורשים סשן — הגנה לפני ה-handler (בנוסף לאימות בתוך ה-route) */
    const protectedApiPrefixes = [
      "/api/ai",
      "/api/crm",
      "/api/erp",
      "/api/assign-user",
      "/api/integrations",
      "/api/scan",
      "/api/org/",
      "/api/admin",
      "/api/meckano",
      "/api/paypal",
      "/api/quotes",
      "/api/user",
      "/api/analyze-queue",
      "/api/reports",
      "/api/telemetry",
      "/api/debug-session",
    ] as const;
    const protectedApi = protectedApiPrefixes.some((p) => pathname.startsWith(p));

    if (protectedApi && !hasAuthenticatedToken(token) && !hasNextAuthSessionCookie(req)) {
      return new NextResponse(
        JSON.stringify({ error: API_MSG_UNAUTHORIZED, code: "unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    /** חסימת גישה ישירה לנתיבי workspace שנחבאו לפי מקצוע/תפקיד (מיושר ל־getHiddenPrimaryRouteIds) */
    if (token && pathname.startsWith("/app") && !pathname.startsWith("/api/")) {
      const featureInput = workspaceFeatureInputFromJwtClaims(token);
      if (featureInput && shouldBlockWorkspacePrimaryPath(pathname, featureInput)) {
        return NextResponse.redirect(new URL("/app", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        const hasUser = hasAuthenticatedToken(token) || hasNextAuthSessionCookie(req);

        if (
          pathname === "/" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/legal") ||
          pathname.startsWith("/privacy") ||
          pathname.startsWith("/terms") ||
          pathname.startsWith("/tutorial") ||
          pathname.startsWith("/sign/") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/locale") ||
          pathname.startsWith("/api/webhooks/")
        ) {
          return true;
        }

        if (pathname.startsWith("/dashboard") || pathname.startsWith("/app")) {
          return hasUser;
        }

        if (pathname.startsWith("/api/")) {
          return true;
        }

        return true;
      },
    },
  },
);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const appTarget = mapDashboardPathToApp(request.nextUrl.pathname);
  if (appTarget) {
    const url = request.nextUrl.clone();
    url.pathname = appTarget;
    const redirectResponse = NextResponse.redirect(url);
    patchLocaleCookie(request, redirectResponse);
    return redirectResponse;
  }

  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = hasNextAuthSessionCookie(request);
  const cookieProtectedApiPrefixes = [
    "/api/ai",
    "/api/crm",
    "/api/erp",
    "/api/assign-user",
    "/api/integrations",
    "/api/scan",
    "/api/org/",
    "/api/admin",
    "/api/meckano",
    "/api/paypal",
    "/api/quotes",
    "/api/user",
    "/api/analyze-queue",
    "/api/reports",
    "/api/telemetry",
    "/api/debug-session",
  ] as const;
  if (
    hasSessionCookie &&
    (pathname.startsWith("/app") ||
      pathname.startsWith("/dashboard") ||
      cookieProtectedApiPrefixes.some((p) => pathname.startsWith(p)))
  ) {
    const response = NextResponse.next();
    patchLocaleCookie(request, response);
    return response;
  }

  const result = authMiddleware(request as NextRequestWithAuth, event);
  if (result instanceof Promise) {
    return result.then((res) => {
      if (res instanceof NextResponse) patchLocaleCookie(request, res);
      return res;
    });
  }
  if (result instanceof NextResponse) patchLocaleCookie(request, result);
  return result;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

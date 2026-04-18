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

    const protectedApi =
      pathname.startsWith("/api/ai") ||
      pathname.startsWith("/api/crm") ||
      pathname.startsWith("/api/erp") ||
      pathname.startsWith("/api/assign-user") ||
      pathname.startsWith("/api/integrations");

    if (protectedApi && (!token || !token.id)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access - נא להתחבר" }),
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
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        const hasUser = !!(token?.id && String(token.id).length > 0);

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

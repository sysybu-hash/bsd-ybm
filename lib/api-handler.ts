import type { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { authOptions } from "@/lib/auth";

export type WorkspaceAuthContext = {
  orgId: string;
  userId: string;
  role: UserRole;
};

type WorkspaceAuthOptionsBase = {
  /** אם מוגדר — רק תפקידים אלה עוברים (אחרת 403) */
  allowedRoles?: UserRole[];
};

export type WorkspaceAuthOptions = WorkspaceAuthOptionsBase & {
  /**
   * סכמת Zod לנתוני הבקשה.
   * כשמוגדר — ה־handler מקבל את `data` המאומת כארגומנט שלישי (או רביעי בנתיב דינמי).
   * גוף הבקשה נקרא פעם אחת כאן — אל תקראו שוב `req.json()` בפנים.
   */
  schema?: z.ZodType<unknown>;
  /**
   * מאיפה לפרסר לפני ה־safeParse:
   * - `body` — JSON מגוף הבקשה
   * - `query` — אובייקט שטוח מ־`searchParams` (כל הערכים מחרוזות)
   * אם לא מוגדר — GET/HEAD משתמשים ב־`query`, שאר הקריאות ב־`body`.
   */
  parseTarget?: "body" | "query";
};

function isWorkspaceContext(
  gate: WorkspaceAuthContext | NextResponse,
): gate is WorkspaceAuthContext {
  return (
    typeof gate === "object" &&
    gate !== null &&
    "orgId" in gate &&
    typeof (gate as WorkspaceAuthContext).orgId === "string"
  );
}

function effectiveParseTarget(req: Request, explicit?: "body" | "query"): "body" | "query" {
  if (explicit) return explicit;
  const m = req.method.toUpperCase();
  return m === "GET" || m === "HEAD" ? "query" : "body";
}

async function parseRawForValidation(
  req: Request,
  target: "body" | "query",
): Promise<{ ok: true; raw: unknown } | { ok: false; response: NextResponse }> {
  if (target === "query") {
    const sp = new URL(req.url).searchParams;
    return { ok: true, raw: Object.fromEntries(sp.entries()) };
  }

  try {
    const text = await req.text();
    if (!text.trim()) {
      return { ok: true, raw: {} };
    }
    const raw = JSON.parse(text) as unknown;
    return { ok: true, raw };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Validation failed",
      issues: error.issues,
    },
    { status: 400 },
  );
}

/**
 * אימות ארגון + משתמש ל־API של מרחב העבודה (NextAuth v4 + JWT).
 * מחזיר הקשר או `NextResponse` לשגיאה — לשימוש ישיר ב-route handlers מורכבים.
 */
export async function requireWorkspaceAuth(
  options?: WorkspaceAuthOptions,
): Promise<WorkspaceAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const orgId = session?.user?.organizationId ?? null;
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role as UserRole;
  if (options?.allowedRoles?.length && !options.allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
  }
  return { orgId, userId, role };
}

type WorkspaceAuthOptionsNoSchema = WorkspaceAuthOptionsBase &
  Pick<WorkspaceAuthOptions, "parseTarget"> & { schema?: never };

/** עם schema — `data` הוא `z.infer<S>` */
export function withWorkspacesAuth<S extends z.ZodType<unknown>>(
  handler: (req: Request, ctx: WorkspaceAuthContext, data: z.infer<S>) => Promise<NextResponse>,
  options: WorkspaceAuthOptionsBase & { schema: S } & Pick<WorkspaceAuthOptions, "parseTarget">,
): (req: Request) => Promise<NextResponse>;

/** בלי schema — לא להעביר `schema` */
export function withWorkspacesAuth(
  handler: (req: Request, ctx: WorkspaceAuthContext) => Promise<NextResponse>,
  options?: WorkspaceAuthOptionsNoSchema,
): (req: Request) => Promise<NextResponse>;

export function withWorkspacesAuth(
  handler:
    | ((req: Request, ctx: WorkspaceAuthContext) => Promise<NextResponse>)
    | ((req: Request, ctx: WorkspaceAuthContext, data: unknown) => Promise<NextResponse>),
  options?: WorkspaceAuthOptions,
) {
  return async (req: Request) => {
    const gate = await requireWorkspaceAuth(options);
    if (!isWorkspaceContext(gate)) return gate;

    if (options?.schema) {
      const target = effectiveParseTarget(req, options.parseTarget);
      const parsed = await parseRawForValidation(req, target);
      if (!parsed.ok) return parsed.response;

      const result = options.schema.safeParse(parsed.raw);
      if (!result.success) {
        return validationErrorResponse(result.error);
      }

      return (handler as (req: Request, ctx: WorkspaceAuthContext, data: unknown) => Promise<NextResponse>)(
        req,
        gate,
        result.data,
      );
    }

    return (handler as (req: Request, ctx: WorkspaceAuthContext) => Promise<NextResponse>)(req, gate);
  };
}

/** נתיב דינמי — עם schema (ארגומנט רביעי: `data`). מומלץ לציין `typeof MySchema` כגנריק שני. */
export function withWorkspacesAuthDynamic<
  P extends Record<string, string>,
  S extends z.ZodType<unknown>,
>(
  handler: (
    req: Request,
    ctx: WorkspaceAuthContext,
    segment: { params: Promise<P> },
    data: z.infer<S>,
  ) => Promise<NextResponse>,
  options: WorkspaceAuthOptionsBase & { schema: S } & Pick<WorkspaceAuthOptions, "parseTarget">,
): (req: Request, segment: { params: Promise<P> }) => Promise<NextResponse>;

export function withWorkspacesAuthDynamic<P extends Record<string, string>>(
  handler: (
    req: Request,
    ctx: WorkspaceAuthContext,
    segment: { params: Promise<P> },
  ) => Promise<NextResponse>,
  options?: WorkspaceAuthOptionsNoSchema,
): (req: Request, segment: { params: Promise<P> }) => Promise<NextResponse>;

export function withWorkspacesAuthDynamic<P extends Record<string, string>>(
  handler:
    | ((
        req: Request,
        ctx: WorkspaceAuthContext,
        segment: { params: Promise<P> },
      ) => Promise<NextResponse>)
    | ((
        req: Request,
        ctx: WorkspaceAuthContext,
        segment: { params: Promise<P> },
        data: unknown,
      ) => Promise<NextResponse>),
  options?: WorkspaceAuthOptions,
) {
  return async (req: Request, segment: { params: Promise<P> }) => {
    const gate = await requireWorkspaceAuth(options);
    if (!isWorkspaceContext(gate)) return gate;

    if (options?.schema) {
      const target = effectiveParseTarget(req, options.parseTarget);
      const parsed = await parseRawForValidation(req, target);
      if (!parsed.ok) return parsed.response;

      const result = options.schema.safeParse(parsed.raw);
      if (!result.success) {
        return validationErrorResponse(result.error);
      }

      return (
        handler as (
          req: Request,
          ctx: WorkspaceAuthContext,
          segment: { params: Promise<P> },
          data: unknown,
        ) => Promise<NextResponse>
      )(req, gate, segment, result.data);
    }

    return (
      handler as (
        req: Request,
        ctx: WorkspaceAuthContext,
        segment: { params: Promise<P> },
      ) => Promise<NextResponse>
    )(req, gate, segment);
  };
}

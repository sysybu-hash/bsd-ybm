import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MECKANO_BASE = "https://app.meckano.co.il/rest";

async function getOrgKey(organizationId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { meckanoApiKey: true },
  });
  return org?.meckanoApiKey ?? null;
}

async function proxyRequest(req: Request, segments: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "אין ארגון מקושר" }, { status: 403 });
  }

  const apiKey = await getOrgKey(orgId);
  if (!apiKey) {
    return NextResponse.json({ error: "מקאנו לא מוגדר — הוסף API key בהגדרות" }, { status: 404 });
  }

  const url = new URL(req.url);
  const meckanoUrl = `${MECKANO_BASE}/${segments.join("/")}${url.search}`;

  let body: string | undefined;
  let contentType = req.headers.get("content-type") ?? "application/json";
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const upstream = await fetch(meckanoUrl, {
    method: req.method,
    headers: {
      key: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body } : {}),
  });

  const data = (await upstream.json().catch(() => ({ status: false }))) as unknown;
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path);
}

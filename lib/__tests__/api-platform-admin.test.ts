/** @jest-environment node */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { requirePlatformAdmin } from "@/lib/api-handler";
import { buildWorkspaceSession, mockGetServerSession } from "@/lib/test-utils";

describe("requirePlatformAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.STEEL_ADMIN_EMAIL;
  });

  it("rejects anonymous requests", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await requirePlatformAdmin();

    expect("status" in res ? res.status : 200).toBe(403);
  });

  it("rejects non-owner users", async () => {
    mockGetServerSession(buildWorkspaceSession({ email: "someone@example.com" }));

    const res = await requirePlatformAdmin();

    expect("status" in res ? res.status : 200).toBe(403);
  });

  it("returns normalized owner context", async () => {
    process.env.STEEL_ADMIN_EMAIL = "owner@example.com";
    mockGetServerSession(buildWorkspaceSession({ email: "OWNER@example.com", id: "owner-id" }));

    const res = await requirePlatformAdmin();

    expect(res).toEqual({ email: "owner@example.com", userId: "owner-id" });
  });
});

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

const mockFindMany = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: {
    document: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET as getDocuments } from "@/app/api/erp/documents/route";
import { getServerSession } from "next-auth";
import {
  buildSessionWithoutOrg,
  buildWorkspaceSession,
  mockGetServerSession,
} from "@/lib/test-utils";

describe("withWorkspacesAuth — ERP documents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  it("מחזיר 401 כשאין organizationId בסשן", async () => {
    mockGetServerSession(buildSessionWithoutOrg());

    const res = await getDocuments(new Request("http://localhost/api/erp/documents"));

    expect(res.status).toBe(401);
  });

  it("מחזיר 401 כשאין משתמש בסשן", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await getDocuments(new Request("http://localhost/api/erp/documents"));

    expect(res.status).toBe(401);
  });

  it("מחזיר מסמכים כשהסשן תקין", async () => {
    mockGetServerSession(buildWorkspaceSession());
    mockFindMany.mockResolvedValue([{ id: "d1", organizationId: "test-org-id" }]);

    const res = await getDocuments(new Request("http://localhost/api/erp/documents"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.documents).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "test-org-id" },
      }),
    );
  });
});

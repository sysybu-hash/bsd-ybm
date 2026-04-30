import { NextResponse } from "next/server";
import { withWorkspacesAuth } from "@/lib/api-handler";
import { jsonServerError } from "@/lib/api-json";
import { prisma } from "@/lib/prisma";

export const GET = withWorkspacesAuth(
  async (_req, { orgId }) => {
    try {
      const logs = await prisma.activityLog.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ logs });
    } catch (error) {
      console.error("Audit log API error:", error);
      return jsonServerError("שגיאת שרת פנימית.");
    }
  },
  { allowedRoles: ["ORG_ADMIN", "SUPER_ADMIN"] },
);

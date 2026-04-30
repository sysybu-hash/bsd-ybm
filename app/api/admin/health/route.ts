import { NextResponse } from "next/server";
import { withPlatformAdmin } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withPlatformAdmin(async () => {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "mocked_ok",
      ai_workers: "mocked_ok",
      pwa_sync: "mocked_ok",
    },
  });
});

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getMarketplaceConnectionStatus } from "@/lib/integrations/marketplace-live";

export async function GET() {
  return NextResponse.json({
    ok: true,
    liveConnections: getMarketplaceConnectionStatus(),
    timestamp: new Date().toISOString(),
  });
}

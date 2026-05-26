
import { NextResponse } from "next/server";
import { getHybridMarketplaceStatus } from "@/src/lib/marketplace/hybrid/engine";

export async function GET() {
  const data = await getHybridMarketplaceStatus();

  return NextResponse.json({
    ok: true,
    mode: "hybrid",
    marketplaces: data,
  });
}

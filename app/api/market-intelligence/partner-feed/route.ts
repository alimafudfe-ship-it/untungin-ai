export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

export async function GET() {
  const tokenReady = Boolean(process.env.MARKET_INTELLIGENCE_PARTNER_TOKEN || process.env.MARKET_INTELLIGENCE_ADMIN_TOKEN);
  const supabaseReady = Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return NextResponse.json({
    ok: true,
    version: "V5 Partner Feed + Import API",
    tokenReady,
    supabaseReady,
    endpoints: [
      "/api/market-intelligence/partner-feed/products",
      "/api/market-intelligence/partner-feed/shops",
      "/api/market-intelligence/partner-feed/creators",
      "/api/market-intelligence/partner-feed/videos",
      "/api/market-intelligence/partner-feed/lives",
      "/api/market-intelligence/partner-feed/categories",
      "/api/market-intelligence/partner-feed/sources"
    ],
    auth: "Authorization: Bearer MARKET_INTELLIGENCE_PARTNER_TOKEN",
  });
}

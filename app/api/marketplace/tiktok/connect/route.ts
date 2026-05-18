import { NextResponse } from "next/server";
import { buildTikTokShopOAuthUrl } from "@/lib/integrations/marketplace";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") || "demo-user";
    const oauthUrl = buildTikTokShopOAuthUrl(userId);
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat OAuth URL TikTok Shop.";
    return NextResponse.json(
      {
        status: "env_missing_or_config_error",
        provider: "tiktok_shop",
        message,
        requiredEnv: ["TIKTOK_SHOP_APP_KEY", "TIKTOK_SHOP_APP_SECRET", "TIKTOK_SHOP_REDIRECT_URL"],
        currentRedirectUrl: process.env.TIKTOK_SHOP_REDIRECT_URL || null,
      },
      { status: 400 }
    );
  }
}

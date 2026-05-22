import { NextResponse } from "next/server";
import { buildTikTokShopOAuthUrl, getTikTokShopAppKey, getTikTokShopRedirectUrl } from "@/lib/integrations/marketplace";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") || "demo-user";
    const oauthUrl = buildTikTokShopOAuthUrl(userId, url.origin);
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat OAuth URL TikTok Shop.";
    return NextResponse.json(
      {
        status: "env_missing_or_config_error",
        provider: "tiktok_shop",
        message,
        requiredEnv: ["TIKTOK_SHOP_APP_KEY"],
        optionalEnv: ["TIKTOK_SHOP_APP_SECRET", "TIKTOK_SHOP_REDIRECT_URL"],
        aliasesAccepted: ["TIKTOK_APP_KEY", "NEXT_PUBLIC_TIKTOK_SHOP_APP_KEY", "NEXT_PUBLIC_TIKTOK_APP_KEY"],
        hasAppKey: !!getTikTokShopAppKey(),
        currentRedirectUrl: getTikTokShopRedirectUrl(url.origin) || null,
      },
      { status: 400 }
    );
  }
}

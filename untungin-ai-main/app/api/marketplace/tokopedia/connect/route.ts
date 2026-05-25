import { NextResponse } from "next/server";
import { buildTokopediaOAuthUrl } from "@/lib/integrations/marketplace";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") || "demo-user";
    return NextResponse.redirect(buildTokopediaOAuthUrl(userId));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat OAuth URL Tokopedia.";

    return NextResponse.json(
      {
        status: "env_missing_or_config_error",
        provider: "tokopedia",
        message,
        requiredEnv: [
          "TOKOPEDIA_CLIENT_ID",
          "TOKOPEDIA_CLIENT_SECRET",
          "TOKOPEDIA_REDIRECT_URL"
        ],
        currentRedirectUrl: process.env.TOKOPEDIA_REDIRECT_URL || null,
      },
      { status: 400 }
    );
  }
}

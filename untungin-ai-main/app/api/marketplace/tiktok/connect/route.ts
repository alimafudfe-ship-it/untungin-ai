import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildTikTokShopOAuthUrl, getTikTokShopAppKey, getTikTokShopRedirectUrl } from "@/lib/integrations/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(value: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function hasExistingTikTokConnection(userId: string | null, workspaceId: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || (!isUuid(userId) && !isUuid(workspaceId))) return false;

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Schema v11/v12: provider column. Skip OAuth if TikTok is already connected.
  try {
    let query = db
      .from("marketplace_connections")
      .select("id,status,access_token,metadata")
      .eq("provider", "tiktok")
      .in("status", ["connected", "active"]);

    query = isUuid(workspaceId) ? query.eq("workspace_id", workspaceId) : query.eq("user_id", userId);

    const { data, error } = await query.limit(1);
    if (!error && data && data.length > 0) return true;
  } catch (error) {
    console.warn("TikTok provider connection check skipped:", error);
  }

  // Production SaaS schema: marketplace column.
  try {
    let query = db
      .from("marketplace_connections")
      .select("id,status,access_token,metadata")
      .eq("marketplace", "tiktok")
      .in("status", ["connected", "active"]);

    query = isUuid(workspaceId) ? query.eq("workspace_id", workspaceId) : query.eq("user_id", userId);

    const { data, error } = await query.limit(1);
    if (!error && data && data.length > 0) return true;
  } catch (error) {
    console.warn("TikTok marketplace connection check skipped:", error);
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const workspaceId = url.searchParams.get("workspace_id");
    const forceReconnect = url.searchParams.get("force") === "1" || url.searchParams.get("reconnect") === "1";

    if (!forceReconnect && await hasExistingTikTokConnection(userId, workspaceId)) {
      return NextResponse.redirect(new URL("/?marketplace=tiktok_already_connected", req.url));
    }

    const oauthUserId = isUuid(userId) ? userId : "anonymous";
    const oauthUrl = buildTikTokShopOAuthUrl(oauthUserId, url.origin, isUuid(workspaceId) ? workspaceId : null);
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    const url = new URL(req.url);
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

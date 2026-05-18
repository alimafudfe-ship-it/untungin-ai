import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TikTokState = {
  provider?: string;
  userId?: string;
  ts?: number;
};

function decodeState(raw: string | null): TikTokState {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

async function exchangeTikTokCode(code: string) {
  const appKey = process.env.TIKTOK_SHOP_APP_KEY;
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET;
  if (!appKey || !appSecret) {
    return { ok: false, skipped: true, error: "TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET belum lengkap." };
  }

  const tokenUrl = process.env.TIKTOK_SHOP_TOKEN_URL || "https://auth.tiktok-shops.com/api/v2/token/get";
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        auth_code: code,
        grant_type: "authorized_code",
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Token exchange gagal." };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || url.searchParams.get("auth_code");
  const state = decodeState(url.searchParams.get("state"));
  const shopId = url.searchParams.get("shop_id") || url.searchParams.get("shop_cipher") || null;
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");

  if (error) {
    return NextResponse.redirect(new URL(`/?marketplace=tiktok_error&message=${encodeURIComponent(error)}`, req.url));
  }
  if (!code) {
    return NextResponse.json({ error: "TikTok callback tidak membawa code/auth_code." }, { status: 400 });
  }

  const tokenResult: any = await exchangeTikTokCode(code);
  const accessToken = tokenResult?.data?.data?.access_token || tokenResult?.data?.access_token || code;
  const refreshToken = tokenResult?.data?.data?.refresh_token || tokenResult?.data?.refresh_token || null;
  const resolvedShopId = shopId || tokenResult?.data?.data?.shop_id || tokenResult?.data?.shop_id || null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const db = createClient(supabaseUrl, serviceKey);
    await db.from("marketplace_connections").upsert({
      user_id: state.userId || "demo-user",
      provider: "tiktok",
      shop_id: resolvedShopId,
      access_token: accessToken,
      refresh_token: refreshToken,
      status: tokenResult?.ok ? "connected" : "auth_code_received",
      connected_at: new Date().toISOString(),
      metadata: tokenResult?.ok ? tokenResult?.data : { token_exchange: tokenResult },
    } as any, { onConflict: "user_id,provider,shop_id" });
  }

  const result = tokenResult?.ok ? "connected" : "code_received";
  return NextResponse.redirect(new URL(`/?marketplace=tiktok_${result}`, req.url));
}

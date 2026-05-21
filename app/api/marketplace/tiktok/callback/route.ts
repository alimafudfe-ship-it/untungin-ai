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
    return {
      ok: false,
      skipped: true,
      error: "TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET belum lengkap.",
    };
  }

  const tokenUrl =
    process.env.TIKTOK_SHOP_TOKEN_URL ||
    "https://auth.tiktok-shops.com/api/v2/token/get";

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        auth_code: code,
        grant_type: "authorized_code",
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    const accessToken =
      data?.data?.access_token ||
      data?.access_token ||
      null;

    const refreshToken =
      data?.data?.refresh_token ||
      data?.refresh_token ||
      null;

    const shopId =
      data?.data?.shop_id ||
      data?.shop_id ||
      null;

    return {
      ok: response.ok && !!accessToken,
      status: response.status,
      data,
      accessToken,
      refreshToken,
      shopId,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Token exchange gagal.",
    };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code =
    url.searchParams.get("code") ||
    url.searchParams.get("auth_code");

  const state = decodeState(url.searchParams.get("state"));

  const shopIdFromUrl =
    url.searchParams.get("shop_id") ||
    url.searchParams.get("shop_cipher") ||
    null;

  const error =
    url.searchParams.get("error") ||
    url.searchParams.get("error_code");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/?marketplace=tiktok_error&message=${encodeURIComponent(error)}`,
        req.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/?marketplace=tiktok_missing_code`, req.url)
    );
  }

  const tokenResult = await exchangeTikTokCode(code);

  const resolvedShopId =
    shopIdFromUrl ||
    tokenResult.shopId ||
    "unknown_shop";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const db = createClient(supabaseUrl, serviceKey);

    await db.from("marketplace_connections").upsert(
      {
        user_id: state.userId || "demo-user",
        provider: "tiktok",
        shop_id: resolvedShopId,

        access_token: tokenResult.ok ? tokenResult.accessToken : null,
        refresh_token: tokenResult.ok ? tokenResult.refreshToken : null,

        status: tokenResult.ok ? "connected" : "auth_code_received",
        connected_at: new Date().toISOString(),

        metadata: {
          callback_params: Object.fromEntries(url.searchParams.entries()),
          token_exchange: tokenResult,
        },
      } as any,
      {
        onConflict: "user_id,provider,shop_id",
      }
    );
  }

  const result = tokenResult.ok ? "connected" : "code_received";

  return NextResponse.redirect(
    new URL(`/?marketplace=tiktok_${result}`, req.url)
  );
}
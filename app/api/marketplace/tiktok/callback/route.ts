import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();

  if (!appKey || !appSecret) {
    return {
      ok: false,
      skipped: true,
      error: "TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET belum lengkap.",
    };
  }

  const tokenUrl =
    process.env.TIKTOK_SHOP_TOKEN_URL?.trim() ||
    "https://auth.tiktok-shops.com/api/v2/token/get";

  try {
    const tokenRequestUrl = new URL(tokenUrl);

    tokenRequestUrl.searchParams.set("app_key", appKey);
    tokenRequestUrl.searchParams.set("app_secret", appSecret);
    tokenRequestUrl.searchParams.set("auth_code", code);
    tokenRequestUrl.searchParams.set("grant_type", "authorized_code");

    console.log("TikTok token exchange request:", {
      tokenUrl,
      appKey,
      hasAppSecret: !!appSecret,
      codeLength: code.length,
    });

    const response = await fetch(tokenRequestUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const rawText = await response.text();

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

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
      data?.data?.seller_id ||
      data?.seller_id ||
      data?.data?.shop_cipher ||
      data?.shop_cipher ||
      null;

    console.log("TikTok token exchange result:", {
      httpStatus: response.status,
      httpOk: response.ok,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      shopId,
      responseData: data,
    });

    return {
      ok: response.ok && !!accessToken,
      status: response.status,
      data,
      accessToken,
      refreshToken,
      shopId,
    };
  } catch (error) {
    console.error("TikTok token exchange exception:", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Token exchange gagal.",
    };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  console.log("TikTok callback params:", Object.fromEntries(url.searchParams.entries()));

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
    console.error("TikTok callback missing code/auth_code");

    return NextResponse.redirect(
      new URL(`/?marketplace=tiktok_missing_code`, req.url)
    );
  }

  const tokenResult = await exchangeTikTokCode(code);

  console.log("TikTok tokenResult FULL:", JSON.stringify(tokenResult, null, 2));

  const resolvedShopId =
    shopIdFromUrl ||
    tokenResult.shopId ||
    "unknown_shop";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase env missing:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
    });
  }

  if (supabaseUrl && serviceKey) {
    const db = createClient(supabaseUrl, serviceKey);

    const { error: upsertError } = await db.from("marketplace_connections").upsert(
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

    if (upsertError) {
      console.error("Supabase marketplace_connections upsert error:", upsertError);
    } else {
      console.log("Supabase marketplace_connections upsert success:", {
        provider: "tiktok",
        shop_id: resolvedShopId,
        status: tokenResult.ok ? "connected" : "auth_code_received",
      });
    }
  }

  const result = tokenResult.ok ? "connected" : "code_received";

  return NextResponse.redirect(
    new URL(`/?marketplace=tiktok_${result}`, req.url)
  );
}
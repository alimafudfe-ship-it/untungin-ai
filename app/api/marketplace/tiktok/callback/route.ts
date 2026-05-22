import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTikTokShopAppKey, getTikTokShopAppSecret } from "@/lib/integrations/marketplace";

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

type TokenExchangeAttempt = {
  label: string;
  url: string;
  method: "GET" | "POST";
  status?: number;
  ok: boolean;
  data: any;
  accessToken: string | null;
  refreshToken: string | null;
  shopId: string | null;
  error?: string;
};

function extractTikTokTokenData(data: any) {
  const payload = data?.data || data?.result || data || {};

  const accessToken =
    payload?.access_token ||
    payload?.accessToken ||
    data?.access_token ||
    null;

  const refreshToken =
    payload?.refresh_token ||
    payload?.refreshToken ||
    data?.refresh_token ||
    null;

  const shopId =
    payload?.shop_id ||
    payload?.seller_id ||
    payload?.shop_cipher ||
    data?.shop_id ||
    data?.seller_id ||
    data?.shop_cipher ||
    null;

  return { accessToken, refreshToken, shopId };
}

async function runTokenExchangeAttempt(
  label: string,
  tokenUrl: string,
  method: "GET" | "POST",
  params: Record<string, string>
): Promise<TokenExchangeAttempt> {
  try {
    let requestUrl = tokenUrl;
    const init: RequestInit = {
      method,
      headers: { Accept: "application/json" },
      cache: "no-store",
    };

    if (method === "GET") {
      const url = new URL(tokenUrl);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      requestUrl = url.toString();
    } else {
      init.headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      init.body = JSON.stringify(params);
    }

    console.log("TikTok token exchange attempt:", {
      label,
      method,
      tokenUrl,
      appKey: params.app_key,
      codeLength: params.auth_code.length,
    });

    const response = await fetch(requestUrl, init);
    const rawText = await response.text();

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    const { accessToken, refreshToken, shopId } = extractTikTokTokenData(data);
    const apiCode = data?.code ?? data?.message_code ?? data?.error_code;
    const apiOk = apiCode === undefined || apiCode === 0 || apiCode === "0";

    return {
      label,
      url: tokenUrl,
      method,
      status: response.status,
      ok: response.ok && apiOk && !!accessToken,
      data,
      accessToken,
      refreshToken,
      shopId,
    };
  } catch (error) {
    return {
      label,
      url: tokenUrl,
      method,
      ok: false,
      data: null,
      accessToken: null,
      refreshToken: null,
      shopId: null,
      error: error instanceof Error ? error.message : "Token exchange gagal.",
    };
  }
}

async function exchangeTikTokCode(code: string) {
  const appKey = getTikTokShopAppKey();
  const appSecret = getTikTokShopAppSecret();

  // OAuth callback is already successful if TikTok sends an auth code. Token exchange
  // can still fail because of env/endpoint/region configuration, so keep that failure
  // in metadata but do not send the user back as tiktok_code_received.
  if (!appKey || !appSecret) {
    return {
      ok: false,
      oauthAccepted: true,
      skipped: true,
      error: "TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET belum lengkap.",
      attempts: [],
      accessToken: null,
      refreshToken: null,
      shopId: null,
    };
  }

  const params = {
    app_key: appKey,
    app_secret: appSecret,
    auth_code: code,
    grant_type: "authorized_code",
  };

  const configuredTokenUrl = process.env.TIKTOK_SHOP_TOKEN_URL?.trim();
  const attempts: Array<{ label: string; url: string; method: "GET" | "POST" }> = [
    {
      label: configuredTokenUrl ? "configured-token-url" : "official-v2-get",
      url: configuredTokenUrl || "https://auth.tiktok-shops.com/api/v2/token/get",
      method: "GET",
    },
    {
      label: "official-v2-post",
      url: configuredTokenUrl || "https://auth.tiktok-shops.com/api/v2/token/get",
      method: "POST",
    },
    {
      label: "open-api-post",
      url: "https://open-api.tiktokglobalshop.com/api/token/getAccessToken",
      method: "POST",
    },
  ];

  const uniqueAttempts = attempts.filter(
    (attempt, index, arr) =>
      arr.findIndex((item) => item.url === attempt.url && item.method === attempt.method) === index
  );

  const results: TokenExchangeAttempt[] = [];

  for (const attempt of uniqueAttempts) {
    const result = await runTokenExchangeAttempt(attempt.label, attempt.url, attempt.method, params);
    results.push(result);

    console.log("TikTok token exchange result:", {
      label: result.label,
      httpStatus: result.status,
      ok: result.ok,
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
      shopId: result.shopId,
      error: result.error,
      responseData: result.data,
    });

    if (result.ok) {
      return {
        ok: true,
        oauthAccepted: true,
        status: result.status,
        data: result.data,
        attempts: results,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        shopId: result.shopId,
      };
    }
  }

  return {
    ok: false,
    oauthAccepted: true,
    error: "Auth code diterima, tetapi token exchange belum berhasil.",
    attempts: results,
    accessToken: null,
    refreshToken: null,
    shopId: null,
  };
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

const workspaceId =
  process.env.DEFAULT_WORKSPACE_ID ||
  "00000000-0000-0000-0000-000000000001";

    const { error: upsertError } = await db.from("marketplace_connections").upsert(
      {
        workspace_id: workspaceId,
        user_id: state.userId || "demo-user",
        provider: "tiktok",
        shop_id: resolvedShopId,

        access_token: tokenResult.ok ? tokenResult.accessToken : null,
        refresh_token: tokenResult.ok ? tokenResult.refreshToken : null,

        status: tokenResult.ok || tokenResult.oauthAccepted ? "connected" : "auth_code_received",
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
        status: tokenResult.ok || tokenResult.oauthAccepted ? "connected" : "auth_code_received",
      });
    }
  }

  const result = tokenResult.ok || tokenResult.oauthAccepted ? "connected" : "code_received";

  return NextResponse.redirect(
    new URL(`/?marketplace=tiktok_${result}`, req.url)
  );
}

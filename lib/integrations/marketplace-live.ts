import crypto from "crypto";

export type MarketplaceProvider = "shopee" | "tiktok" | "tokopedia" | "blibli";

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${key} belum diisi.`);
  }
  return value;
}

function optionalEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getMarketplaceConnectionStatus() {
  return {
    shopee: !!optionalEnv("SHOPEE_PARTNER_ID", "SHOPEE_PARTNER_KEY", "SHOPEE_REDIRECT_URL"),
    tiktok: !!optionalEnv("TIKTOK_SHOP_APP_KEY", "TIKTOK_APP_KEY"),
    tokopedia: !!optionalEnv("TOKOPEDIA_CLIENT_ID", "TOKOPEDIA_CLIENT_SECRET"),
    blibli: !!optionalEnv("BLIBLI_CLIENT_ID", "BLIBLI_CLIENT_SECRET"),
  };
}

export function buildShopeeLiveUrl(userId: string) {
  const partnerId = requiredEnv("SHOPEE_PARTNER_ID");
  const partnerKey = requiredEnv("SHOPEE_PARTNER_KEY");
  const redirect = requiredEnv("SHOPEE_REDIRECT_URL");

  const timestamp = Math.floor(Date.now() / 1000);
  const path = "/api/v2/shop/auth_partner";
  const sign = crypto
    .createHmac("sha256", partnerKey)
    .update(`${partnerId}${path}${timestamp}`)
    .digest("hex");

  const url = new URL(`https://partner.shopeemobile.com${path}`);
  url.searchParams.set("partner_id", partnerId);
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  url.searchParams.set("redirect", redirect);
  url.searchParams.set("state", Buffer.from(userId).toString("base64url"));

  return url.toString();
}

export function buildTikTokLiveUrl(userId: string, origin?: string) {
  const appKey = requiredEnv("TIKTOK_SHOP_APP_KEY");
  const redirect = optionalEnv("TIKTOK_SHOP_REDIRECT_URL") || `${origin}/api/marketplace/tiktok/callback`;

  const url = new URL("https://auth.tiktok-shops.com/oauth/authorize");
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("state", Buffer.from(userId).toString("base64url"));

  return url.toString();
}

export function buildTokopediaLiveUrl(userId: string) {
  const clientId = requiredEnv("TOKOPEDIA_CLIENT_ID");
  const redirect = requiredEnv("TOKOPEDIA_REDIRECT_URL");

  const url = new URL("https://accounts.tokopedia.com/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("scope", "shop:read order:read product:read");
  url.searchParams.set("state", Buffer.from(userId).toString("base64url"));

  return url.toString();
}

export function buildBlibliLiveUrl(userId: string) {
  const clientId = requiredEnv("BLIBLI_CLIENT_ID");
  const redirect = requiredEnv("BLIBLI_REDIRECT_URL");

  const url = new URL("https://api.blibli.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("state", Buffer.from(userId).toString("base64url"));

  return url.toString();
}

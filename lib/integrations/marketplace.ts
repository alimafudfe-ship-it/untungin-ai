import crypto from "crypto";

export function buildShopeeOAuthUrl(userId: string) {
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const redirect = process.env.SHOPEE_REDIRECT_URL;
  if (!partnerId || !partnerKey || !redirect) throw new Error("SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_REDIRECT_URL belum lengkap.");
  const ts = Math.floor(Date.now() / 1000);
  const path = "/api/v2/shop/auth_partner";
  const base = `${partnerId}${path}${ts}`;
  const sign = crypto.createHmac("sha256", partnerKey).update(base).digest("hex");
  const state = Buffer.from(JSON.stringify({ provider: "shopee", userId, ts })).toString("base64url");
  return `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${ts}&sign=${sign}&redirect=${encodeURIComponent(redirect)}&state=${state}`;
}

export function buildTokopediaOAuthUrl(userId: string) {
  const clientId = process.env.TOKOPEDIA_CLIENT_ID;
  const redirect = process.env.TOKOPEDIA_REDIRECT_URL;
  if (!clientId || !redirect) throw new Error("TOKOPEDIA_CLIENT_ID dan TOKOPEDIA_REDIRECT_URL belum lengkap.");
  const state = Buffer.from(JSON.stringify({ provider: "tokopedia", userId, ts: Date.now() })).toString("base64url");
  const scope = encodeURIComponent("fs:shop fs:order fs:product");
  return `https://accounts.tokopedia.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scope}&state=${state}`;
}

export function buildTikTokShopOAuthUrl(userId: string) {
  const appKey = process.env.TIKTOK_SHOP_APP_KEY;
  const redirect = process.env.TIKTOK_SHOP_REDIRECT_URL;
  if (!appKey || !redirect) throw new Error("TIKTOK_SHOP_APP_KEY dan TIKTOK_SHOP_REDIRECT_URL belum lengkap.");
  const state = Buffer.from(JSON.stringify({ provider: "tiktok", userId, ts: Date.now() })).toString("base64url");

  // TikTok Shop Partner Center may use different authorization hosts by region/account.
  // Keep the official URL configurable, but provide a safe default that opens the seller authorization flow.
  const authorizeBase = process.env.TIKTOK_SHOP_AUTHORIZE_URL || "https://auth.tiktok-shops.com/oauth/authorize";
  const url = new URL(authorizeBase);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}


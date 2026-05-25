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

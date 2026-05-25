import { NextResponse } from "next/server";

export async function GET() {
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const redirectUri = process.env.SHOPEE_REDIRECT_URI;
  if (!partnerId || !redirectUri) {
    return NextResponse.json({ status: "env_missing", message: "Set SHOPEE_PARTNER_ID dan SHOPEE_REDIRECT_URI di Vercel untuk mengaktifkan OAuth Shopee." }, { status: 400 });
  }
  const state = crypto.randomUUID();
  const url = new URL("https://partner.shopeemobile.com/api/v2/shop/auth_partner");
  url.searchParams.set("partner_id", partnerId);
  url.searchParams.set("redirect", redirectUri);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}

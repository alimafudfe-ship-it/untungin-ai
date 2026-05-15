import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.TOKOPEDIA_CLIENT_ID;
  const redirectUri = process.env.TOKOPEDIA_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ status: "env_missing", message: "Set TOKOPEDIA_CLIENT_ID dan TOKOPEDIA_REDIRECT_URI di Vercel untuk mengaktifkan OAuth Tokopedia." }, { status: 400 });
  }
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.tokopedia.com/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}

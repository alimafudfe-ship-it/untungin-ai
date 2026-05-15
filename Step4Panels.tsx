import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const shopId = url.searchParams.get("shop_id");
  const stateRaw = url.searchParams.get("state");
  if (!code && !shopId) return NextResponse.json({ error: "OAuth callback tidak membawa code/shop_id." }, { status: 400 });
  let state: any = {};
  try { state = stateRaw ? JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) : {}; } catch {}
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey && state.userId) {
    const db = createClient(supabaseUrl, serviceKey);
    await db.from("marketplace_connections").upsert({
      user_id: state.userId,
      provider: state.provider || "marketplace",
      shop_id: shopId || null,
      access_token: code || "pending_exchange",
      refresh_token: null,
      status: "connected",
      connected_at: new Date().toISOString(),
    } as any, { onConflict: "user_id,provider,shop_id" });
  }
  return NextResponse.redirect(new URL("/?marketplace=connected", req.url));
}

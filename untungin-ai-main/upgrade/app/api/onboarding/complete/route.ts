import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ ok: true, stored: false, reason: "service key belum diset" });
  const db = createClient(supabaseUrl, serviceKey);
  if (body.userId) {
    await db.from("profiles").update({ onboarding_completed_at: new Date().toISOString(), business_type: body.businessType || null, main_marketplace: body.marketplace || null }).eq("id", body.userId);
  }
  return NextResponse.json({ ok: true, stored: !!body.userId });
}

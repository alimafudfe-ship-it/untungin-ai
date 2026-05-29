export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(req: Request) {
  const callbackToken = process.env.XENDIT_CALLBACK_TOKEN;
  const incomingToken = req.headers.get("x-callback-token");
  if (callbackToken && incomingToken !== callbackToken) {
    return NextResponse.json({ error: "Invalid Xendit callback token" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "").toUpperCase();
  const email = String(body.payer_email || body.metadata?.email || "").trim().toLowerCase();
  const plan = String(body.metadata?.plan || "monthly");

  if (!email) return NextResponse.json({ error: "Email kosong" }, { status: 400 });
  if (status !== "PAID" && status !== "SETTLED") return NextResponse.json({ ok: true, status, message: "Invoice belum paid" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Supabase service ENV belum lengkap" }, { status: 500 });

  const supabase = createClient(supabaseUrl, serviceKey);
  const proUntil = plan === "monthly" ? addDays(30) : "2099-12-31T23:59:59.000Z";

  const { data, error } = await supabase
    .from("profiles")
    .update({ plan: "pro", pro_until: proUntil, updated_at: new Date().toISOString() })
    .eq("email", email)
    .select("email, plan, pro_until")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Gagal update profile", detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true, provider: "xendit", email, plan, pro_until: proUntil });
}

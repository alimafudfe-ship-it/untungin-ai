export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getPlanAmount, getPlanName } from "@/lib/billing/providers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const plan = String(body.plan || "monthly");
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  return NextResponse.json({
    ok: true,
    provider: "manual",
    order_id: `MANUAL-${Date.now()}`,
    email,
    plan,
    amount: getPlanAmount(plan),
    product: getPlanName(plan),
    instructions: "Transfer ke rekening bisnis, lalu admin approve workspace menjadi PRO dari Supabase/admin panel.",
  });
}

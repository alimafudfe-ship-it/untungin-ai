export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { buildDailyBriefing } from "@/lib/saas/dailyBriefing";
import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = (body.products || []) as Product[];
    const expenses = (body.expenses || []) as Expense[];
    const metrics = body.metrics as DashboardMetrics;
    if (!metrics) return NextResponse.json({ error: "metrics wajib dikirim" }, { status: 400 });
    return NextResponse.json({ ok: true, briefing: buildDailyBriefing(products, expenses, metrics) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat briefing" }, { status: 500 });
  }
}

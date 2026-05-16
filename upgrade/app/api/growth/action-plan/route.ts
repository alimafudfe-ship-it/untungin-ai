import { NextResponse } from "next/server";
import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { buildFounderActionPlan, buildGrowthMetrics } from "@/lib/saas/actionPlan";

export const runtime = "nodejs";

type Payload = {
  products?: Product[];
  expenses?: Expense[];
  metrics?: DashboardMetrics;
};

const emptyMetrics: DashboardMetrics = {
  totalProfit: 0,
  totalRevenue: 0,
  totalUnits: 0,
  totalStock: 0,
  inventoryValue: 0,
  totalExpenses: 0,
  netCash: 0,
  avgMargin: 0,
  riskScore: 0,
  dailyLeakEstimate: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  lossCount: 0,
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const products = Array.isArray(payload.products) ? payload.products : [];
    const expenses = Array.isArray(payload.expenses) ? payload.expenses : [];
    const metrics = payload.metrics ?? emptyMetrics;

    return NextResponse.json({
      ok: true,
      version: "v8-growth-engine",
      actions: buildFounderActionPlan(products, expenses, metrics),
      growth_metrics: buildGrowthMetrics(products, metrics),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import { parseMarketplaceRow } from "@/lib/dashboard/marketplaceImport";
import { generateRuleBasedInsights } from "@/lib/saas/aiInsights";

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Form data tidak valid." }, { status: 400 });

  const file = formData.get("file");
  const workspaceId = String(formData.get("workspaceId") || "");
  const storeId = String(formData.get("storeId") || "");
  const userId = String(formData.get("userId") || "");
  const marketplace = String(formData.get("marketplace") || "csv").toLowerCase().replace(/\s+/g, "_");

  if (!(file instanceof File)) return NextResponse.json({ error: "Upload file CSV marketplace dulu." }, { status: 400 });
  if (!workspaceId || !userId) return NextResponse.json({ error: "workspaceId dan userId wajib ada." }, { status: 400 });

  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const rows = parsed.data.filter((row) => Object.values(row).some((value) => String(value || "").trim() !== ""));
  const normalized = rows.map((row, index) => ({ ...parseMarketplaceRow(row, userId, index), workspace_id: workspaceId, store_id: storeId || null, marketplace }));
  const errors = parsed.errors.map((e) => ({ row: e.row, message: e.message }));

  const supabase = serverClient();
  if (!supabase) {
    return NextResponse.json({ mode: "preview", totalRows: rows.length, successRows: normalized.length, failedRows: errors.length, products: normalized.slice(0, 20), errors });
  }

  const { data: job } = await supabase.from("import_jobs").insert({ workspace_id: workspaceId, store_id: storeId || null, marketplace, filename: file.name, total_rows: rows.length, status: "processing", created_by: userId }).select("id").single();
  const { data: inserted, error } = await supabase.from("products").insert(normalized).select("*");
  const successRows = inserted?.length || 0;

  await supabase.from("import_jobs").update({ status: error ? "failed" : "completed", success_rows: successRows, failed_rows: error ? rows.length : errors.length, errors, finished_at: new Date().toISOString() }).eq("id", job?.id);

  if (error) return NextResponse.json({ error: error.message, totalRows: rows.length, successRows, failedRows: rows.length }, { status: 500 });

  const insights = generateRuleBasedInsights(normalized.map((p) => ({ name: p.name, profit: p.profit, margin: p.margin, stockRemaining: p.stock_remaining, stockInitial: p.stock_initial, otherCost: p.other_cost, marketplace: p.marketplace })), []);
  await supabase.from("ai_insights").insert(insights.map((item) => ({ workspace_id: workspaceId, store_id: storeId || null, severity: item.severity, title: item.title, body: item.body, action_label: item.actionLabel, metric_snapshot: { source: "csv_import", score: item.score, file: file.name } })));

  return NextResponse.json({ jobId: job?.id, totalRows: rows.length, successRows, failedRows: errors.length, insights });
}

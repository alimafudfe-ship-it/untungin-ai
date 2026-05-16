import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import { detectMarketplace, parseMarketplaceRow } from "@/lib/dashboard/marketplaceImport";
import { generateRuleBasedInsights } from "@/lib/saas/aiInsights";

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_\-\/()]+/g, " ").replace(/[^a-z0-9 .]+/g, "").trim();
}

function valueFrom(row: Record<string, unknown>, keys: string[]) {
  const lookup: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    lookup[normalizeKey(key)] = value;
  });
  for (const key of keys) {
    const value = lookup[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Form data tidak valid." }, { status: 400 });

  const file = formData.get("file");
  const workspaceId = String(formData.get("workspaceId") || "");
  const storeId = String(formData.get("storeId") || "");
  const userId = String(formData.get("userId") || "");
  const selectedMarketplace = String(formData.get("marketplace") || "auto");

  if (!(file instanceof File)) return NextResponse.json({ error: "Upload file CSV marketplace dulu." }, { status: 400 });
  if (!workspaceId || !userId) return NextResponse.json({ error: "workspaceId dan userId wajib ada." }, { status: 400 });

  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const rows: Record<string, unknown>[] = parsed.data.filter((row: Record<string, unknown>) => Object.values(row).some((value) => String(value || "").trim() !== ""));
  const errors = parsed.errors.map((e: { row?: number; message: string }) => ({ row: e.row, message: e.message }));
  const importStartedAt = Date.now();

  const normalized = rows
    .map((row: Record<string, unknown>, index: number) => {
      const detectedMarketplace = detectMarketplace(row, "CSV");
      const rowMarketplace = selectedMarketplace.toLowerCase() === "auto" ? detectedMarketplace : selectedMarketplace;
      return {
        ...parseMarketplaceRow({ ...row, Marketplace: rowMarketplace }, userId, index),
        workspace_id: workspaceId,
        store_id: storeId || null,
        marketplace: rowMarketplace,
      };
    })
    .filter((row: { name: string; selling_price: number; cost_price: number; quantity_sold: number }) => row.name.trim().length > 0 && (row.selling_price > 0 || row.cost_price > 0 || row.quantity_sold > 0));

  const supabase = serverClient();
  if (!supabase) {
    return NextResponse.json({ mode: "preview", totalRows: rows.length, successRows: normalized.length, failedRows: errors.length, products: normalized.slice(0, 20), errors });
  }

  const { data: job } = await supabase
    .from("import_jobs")
    .insert({ workspace_id: workspaceId, store_id: storeId || null, marketplace: selectedMarketplace, filename: file.name, total_rows: rows.length, status: "processing", created_by: userId })
    .select("id")
    .single();

  const { data: insertedProducts, error: productError } = await supabase.from("products").insert(normalized).select("*");
  const successRows = insertedProducts?.length || 0;

  if (productError) {
    await supabase.from("import_jobs").update({ status: "failed", success_rows: successRows, failed_rows: rows.length, errors: [{ message: productError.message }, ...errors], finished_at: new Date().toISOString() }).eq("id", job?.id);
    return NextResponse.json({ error: productError.message, totalRows: rows.length, successRows, failedRows: rows.length }, { status: 500 });
  }

  const orderRows = normalized.map((row, index: number) => {
    const raw = rows[index] || {};
    const grossRevenue = row.selling_price * row.quantity_sold;
    const rawExternalId = valueFrom(raw, ["No. Pesanan", "Nomor Invoice", "Order ID", "Order Id", "Invoice", "Nomor Pesanan"]);
    const externalId = `${rawExternalId || file.name}-${importStartedAt}-${index + 1}`;
    return {
      workspace_id: workspaceId,
      store_id: storeId || null,
      marketplace: row.marketplace,
      external_order_id: externalId,
      status: valueFrom(raw, ["Status Pesanan", "Status", "Order Status"]) || "completed",
      buyer_name: valueFrom(raw, ["Nama Pembeli", "Buyer Name", "Pembeli"]),
      gross_revenue: grossRevenue,
      marketplace_fee: Math.max(0, row.other_cost * 0.45),
      ads_cost: Math.max(0, row.other_cost * 0.3),
      voucher_cost: Math.max(0, row.other_cost * 0.2),
      affiliate_cost: Math.max(0, row.other_cost * 0.05),
      net_revenue: grossRevenue - row.other_cost,
      source_file: file.name,
      raw,
    };
  });

  const { data: insertedOrders } = orderRows.length ? await supabase.from("orders").insert(orderRows).select("id") : { data: [] as { id: string }[] };

  if (insertedOrders?.length && insertedProducts?.length) {
    const orderItems = insertedOrders.map((order: { id: string }, index: number) => {
      const product = insertedProducts[index];
      const normalizedProduct = normalized[index];
      return {
        order_id: order.id,
        product_id: product?.id || null,
        sku: valueFrom(rows[index] || {}, ["SKU", "SKU Induk", "Seller SKU", "Kode SKU"]),
        product_name: normalizedProduct.name,
        quantity: normalizedProduct.quantity_sold,
        unit_price: normalizedProduct.selling_price,
        cost_price: normalizedProduct.cost_price,
        total_fee: normalizedProduct.other_cost,
        profit: normalizedProduct.profit,
        raw: rows[index] || {},
      };
    });
    await supabase.from("order_items").insert(orderItems);
  }

  const insightInputs = normalized.map((p) => ({ name: p.name, profit: p.profit, margin: p.margin, stockRemaining: p.stock_remaining, stockInitial: p.stock_initial, otherCost: p.other_cost, marketplace: p.marketplace }));
  const insights = generateRuleBasedInsights(insightInputs, []);
  await supabase.from("ai_insights").insert(insights.map((item) => ({ workspace_id: workspaceId, store_id: storeId || null, severity: item.severity, title: item.title, body: item.body, action_label: item.actionLabel, metric_snapshot: { source: "csv_import", score: item.score, file: file.name, imported_rows: successRows } })));
  await supabase.from("activation_events").insert({ workspace_id: workspaceId, user_id: userId, event_name: "csv_import_completed", source: "v10_profit_accuracy", metadata: { file: file.name, rows: rows.length, successRows } });
  const { error: workspaceMarkError } = await supabase.rpc("mark_workspace_first_import", { target_workspace: workspaceId });
  if (workspaceMarkError) {
    await supabase.from("workspaces").update({ onboarding_step: 4, onboarding_completed: true, updated_at: new Date().toISOString() }).eq("id", workspaceId);
  }

  await supabase.from("import_jobs").update({ status: "completed", success_rows: successRows, failed_rows: errors.length, errors, finished_at: new Date().toISOString() }).eq("id", job?.id);

  return NextResponse.json({ jobId: job?.id, totalRows: rows.length, successRows, failedRows: errors.length, insights, products: insertedProducts?.slice(0, 20) || [] });
}

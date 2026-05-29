export const runtime = "nodejs";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import { createImportPreview } from "@/lib/dashboard/marketplaceImport";
import { calculateMargin, calculateProfit } from "@/lib/dashboard/calculations";
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

function toNumber(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function productKey(name: string, marketplace: string, storeId: string | null) {
  return `${storeId || "main"}::${marketplace || "Manual"}::${name}`.toLowerCase().replace(/\s+/g, " ").trim();
}

type SavedProduct = {
  id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  quantity_sold: number;
  stock_initial: number;
  stock_remaining: number;
  other_cost: number;
  profit: number;
  margin: number;
  marketplace?: string | null;
};

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
  const preview = createImportPreview(rows, userId, selectedMarketplace || "auto");
  const mappingPreview = (() => {
    try {
      const raw = formData.get("mappingPreview");
      return raw ? JSON.parse(String(raw)) : null;
    } catch {
      return null;
    }
  })();

  const normalized = preview.rows.map((row) => ({
    ...row,
    workspace_id: workspaceId,
    store_id: storeId || null,
    marketplace: preview.detectedMarketplace,
  }));

  const supabase = serverClient();
  if (!supabase) {
    return NextResponse.json({ mode: "preview", totalRows: rows.length, successRows: normalized.length, failedRows: errors.length, products: normalized.slice(0, 20), errors });
  }

  const { data: job } = await supabase
    .from("import_jobs")
    .insert({ workspace_id: workspaceId, store_id: storeId || null, marketplace: preview.detectedMarketplace, filename: file.name, total_rows: rows.length, status: "processing", created_by: userId })
    .select("id")
    .single();

  const existingQuery = supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (storeId) existingQuery.eq("store_id", storeId);

  const { data: existingProducts } = await existingQuery;
  const productMap = new Map<string, SavedProduct>();
  (existingProducts || []).forEach((item: any) => {
    productMap.set(productKey(String(item.name || ""), String(item.marketplace || "Manual"), item.store_id || null), item as SavedProduct);
  });

  const savedProducts: SavedProduct[] = [];
  const saleResults: { product: SavedProduct; normalized: any; raw: Record<string, unknown>; stockBefore: number; stockAfter: number }[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const row: any = normalized[index];
    const raw = rows[index] || {};
    const key = productKey(row.name, row.marketplace || preview.detectedMarketplace, storeId || null);
    const existing = productMap.get(key);

    if (existing) {
      const stockBefore = toNumber(existing.stock_remaining);
      const existingSold = toNumber(existing.quantity_sold);
      const existingCost = toNumber(existing.cost_price);
      const existingSell = toNumber(existing.selling_price);
      const existingOtherCost = toNumber(existing.other_cost);
      const latestCostPrice = row.cost_price > 0 ? row.cost_price : existingCost;
      const latestSellingPrice = row.selling_price > 0 ? row.selling_price : existingSell;
      const quantitySold = existingSold + row.quantity_sold;
      const stockRemaining = Math.max(stockBefore - row.quantity_sold, 0);
      const stockInitial = Math.max(toNumber(existing.stock_initial), stockRemaining + quantitySold, row.stock_initial || 0);
      const otherCost = existingOtherCost + row.other_cost;
      const profit = calculateProfit({ costPrice: latestCostPrice, sellingPrice: latestSellingPrice, quantitySold, otherCost });
      const margin = calculateMargin(latestCostPrice, latestSellingPrice);
      const patch = {
        cost_price: latestCostPrice,
        selling_price: latestSellingPrice,
        quantity_sold: quantitySold,
        stock_initial: stockInitial,
        stock_remaining: stockRemaining,
        other_cost: otherCost,
        profit,
        margin,
        marketplace: row.marketplace,
      };
      const { data: updated, error } = await supabase.from("products").update(patch).eq("id", existing.id).eq("user_id", userId).select("*").single();
      if (error) {
        errors.push({ row: index + 1, message: `Gagal update stok ${row.name}: ${error.message}` });
        continue;
      }
      const saved = updated as SavedProduct;
      productMap.set(key, saved);
      savedProducts.push(saved);
      saleResults.push({ product: saved, normalized: row, raw, stockBefore, stockAfter: stockRemaining });
    } else {
      const payload = { ...row, stock_remaining: Math.max(row.stock_initial - row.quantity_sold, 0) };
      const { data: inserted, error } = await supabase.from("products").insert(payload).select("*").single();
      if (error) {
        errors.push({ row: index + 1, message: `Gagal tambah produk ${row.name}: ${error.message}` });
        continue;
      }
      const saved = inserted as SavedProduct;
      productMap.set(key, saved);
      savedProducts.push(saved);
      saleResults.push({ product: saved, normalized: row, raw, stockBefore: row.stock_initial, stockAfter: payload.stock_remaining });
    }
  }

  const successRows = savedProducts.length;

  if (!successRows && errors.length) {
    await supabase.from("import_jobs").update({ status: "failed", success_rows: 0, failed_rows: rows.length, errors: [...errors, ...preview.warnings.map((message) => ({ message }))], finished_at: new Date().toISOString() }).eq("id", job?.id);
    return NextResponse.json({ error: "Import gagal. Tidak ada produk yang tersimpan.", totalRows: rows.length, successRows: 0, failedRows: rows.length, errors }, { status: 500 });
  }

  const orderRows = saleResults.map(({ normalized: row, raw }, index: number) => {
    const grossRevenue = row.selling_price * row.quantity_sold;
    const rawExternalId = valueFrom(raw, ["No. Pesanan", "Nomor Invoice", "Order ID", "Order Id", "Invoice", "Nomor Pesanan"]);
    const externalId = `${rawExternalId || file.name}-${importStartedAt}-${index + 1}`;
    return {
      workspace_id: workspaceId,
      store_id: storeId || null,
      marketplace: row.marketplace || preview.detectedMarketplace,
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

  if (insertedOrders?.length) {
    const orderItems = insertedOrders.map((order: { id: string }, index: number) => {
      const result = saleResults[index];
      return {
        order_id: order.id,
        product_id: result.product.id,
        sku: valueFrom(result.raw, ["SKU", "SKU Induk", "Seller SKU", "Kode SKU"]),
        product_name: result.normalized.name,
        quantity: result.normalized.quantity_sold,
        unit_price: result.normalized.selling_price,
        cost_price: result.normalized.cost_price,
        total_fee: result.normalized.other_cost,
        profit: result.normalized.profit,
        raw: { ...result.raw, stock_before: result.stockBefore, stock_after: result.stockAfter, auto_stock_deducted: true },
      };
    });
    await supabase.from("order_items").insert(orderItems);
  }

  const insightInputs = savedProducts.map((p) => ({ name: p.name, profit: p.profit, margin: p.margin, stockRemaining: p.stock_remaining, stockInitial: p.stock_initial, otherCost: p.other_cost, marketplace: p.marketplace || preview.detectedMarketplace }));
  const insights = generateRuleBasedInsights(insightInputs, []);
  await supabase.from("ai_insights").insert(insights.map((item) => ({ workspace_id: workspaceId, store_id: storeId || null, severity: item.severity, title: item.title, body: item.body, action_label: item.actionLabel, metric_snapshot: { source: "csv_import_v12_auto_stock", score: item.score, file: file.name, imported_rows: successRows, stock_updates: saleResults.length, mapping_confidence: preview.confidence, detected_marketplace: preview.detectedMarketplace } })));
  await supabase.from("activation_events").insert({ workspace_id: workspaceId, user_id: userId, event_name: "marketplace_sales_import_completed", source: "v12_auto_stock", metadata: { file: file.name, rows: rows.length, successRows, stockUpdates: saleResults.length, mappingConfidence: preview.confidence, detectedMarketplace: preview.detectedMarketplace, warnings: preview.warnings } });
  const { error: workspaceMarkError } = await supabase.rpc("mark_workspace_first_import", { target_workspace: workspaceId });
  if (workspaceMarkError) {
    await supabase.from("workspaces").update({ onboarding_step: 4, onboarding_completed: true, updated_at: new Date().toISOString() }).eq("id", workspaceId);
  }

  await supabase.from("import_jobs").update({ status: "completed", success_rows: successRows, failed_rows: errors.length, errors: [...errors, ...preview.warnings.map((message) => ({ message }))], finished_at: new Date().toISOString() }).eq("id", job?.id);

  return NextResponse.json({
    jobId: job?.id,
    totalRows: rows.length,
    successRows,
    failedRows: errors.length,
    stockUpdates: saleResults.length,
    insights,
    products: savedProducts.slice(0, 20),
    preview: { detectedMarketplace: preview.detectedMarketplace, confidence: preview.confidence, summary: preview.summary, warnings: preview.warnings, mappings: mappingPreview?.mappings || preview.mappings },
  });
}

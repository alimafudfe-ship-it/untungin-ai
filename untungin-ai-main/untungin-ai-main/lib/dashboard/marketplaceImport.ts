import { calculateMargin, calculateProfit } from "./calculations";
import { parseNumber } from "./format";

export type NormalizedImportRow = {
  user_id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  quantity_sold: number;
  stock_initial: number;
  stock_remaining: number;
  other_cost: number;
  profit: number;
  margin: number;
  marketplace: string;
};

export type CanonicalImportField =
  | "marketplace"
  | "orderId"
  | "sku"
  | "name"
  | "status"
  | "quantity"
  | "hpp"
  | "unitPrice"
  | "lineTotal"
  | "settlement"
  | "adminFee"
  | "serviceFee"
  | "commissionFee"
  | "paymentFee"
  | "voucherSeller"
  | "sellerDiscount"
  | "platformDiscount"
  | "shippingBuyerPaid"
  | "shippingSellerSubsidy"
  | "shippingFeeCharged"
  | "tax"
  | "adsCost"
  | "affiliateCost"
  | "stock";

export type ImportMapping = {
  field: CanonicalImportField;
  label: string;
  header: string | null;
  confidence: number;
  required?: boolean;
  costImpact?: "seller_cost" | "buyer_paid" | "informational";
};

export type ImportPreview = {
  detectedMarketplace: string;
  confidence: number;
  headers: string[];
  mappings: ImportMapping[];
  rows: NormalizedImportRow[];
  summary: {
    totalRows: number;
    validRows: number;
    grossRevenue: number;
    estimatedProfit: number;
    sellerCosts: number;
    inventoryValue: number;
    avgMargin: number;
  };
  warnings: string[];
};

type FieldConfig = {
  label: string;
  aliases: string[];
  required?: boolean;
  costImpact?: ImportMapping["costImpact"];
};

const FIELD_CONFIG: Record<CanonicalImportField, FieldConfig> = {
  marketplace: { label: "Marketplace", aliases: ["marketplace", "channel", "platform", "toko", "nama toko", "shop name"] },
  orderId: { label: "Nomor order", aliases: ["no pesanan", "nomor pesanan", "order id", "order number", "nomor invoice", "invoice", "order item id"] },
  sku: { label: "SKU", aliases: ["sku", "sku induk", "seller sku", "kode sku", "merchant sku", "variasi sku", "product sku"] },
  name: { label: "Nama produk", aliases: ["nama produk", "nama barang", "nama barang nama variasi", "product name", "item name", "judul produk", "sku name", "product title"], required: true },
  status: { label: "Status", aliases: ["status pesanan", "status", "order status", "status order"] },
  quantity: { label: "Qty terjual", aliases: ["jumlah", "qty", "quantity", "kuantitas", "jumlah produk", "jumlah produk di pesan", "jumlah dibeli", "ordered quantity"], required: true },
  hpp: { label: "HPP / modal", aliases: ["hpp", "modal", "harga modal", "cost price", "harga pokok", "cogs", "modal per produk", "harga beli"], required: true },
  unitPrice: { label: "Harga jual satuan", aliases: ["harga jual", "harga satuan", "unit price", "selling price", "harga per produk", "harga produk", "harga barang", "harga item", "product price"], required: true },
  lineTotal: { label: "Total harga produk", aliases: ["total harga produk", "total penjualan", "subtotal produk", "subtotal", "gross sales", "gross revenue", "omzet", "total pembayaran", "total dibayar", "harga setelah diskon"] },
  settlement: { label: "Dana diterima / settlement", aliases: ["dana diterima", "settlement amount", "net amount", "total pencairan", "jumlah dana", "amount received", "income", "pendapatan bersih"] },
  adminFee: { label: "Biaya admin", aliases: ["biaya admin", "admin fee", "biaya administrasi", "marketplace fee", "fee admin"], costImpact: "seller_cost" },
  serviceFee: { label: "Biaya layanan", aliases: ["biaya layanan", "service fee", "service charge", "platform fee", "biaya platform", "biaya transaksi"], costImpact: "seller_cost" },
  commissionFee: { label: "Komisi marketplace", aliases: ["komisi", "commission", "commission fee", "komisi marketplace", "lazada commission", "biaya komisi"], costImpact: "seller_cost" },
  paymentFee: { label: "Payment fee", aliases: ["payment fee", "biaya payment", "biaya pembayaran", "payment gateway fee", "biaya penanganan"], costImpact: "seller_cost" },
  voucherSeller: { label: "Voucher seller", aliases: ["voucher ditanggung penjual", "voucher seller", "seller voucher", "diskon penjual", "voucher toko", "promo seller", "diskon toko"], costImpact: "seller_cost" },
  sellerDiscount: { label: "Diskon seller", aliases: ["seller discount", "diskon seller", "seller rebate", "potongan seller", "seller promo"], costImpact: "seller_cost" },
  platformDiscount: { label: "Diskon platform", aliases: ["platform discount", "diskon platform", "voucher platform", "platform voucher", "diskon marketplace"], costImpact: "informational" },
  shippingBuyerPaid: { label: "Ongkir dibayar pembeli", aliases: ["ongkir dibayar pembeli", "shipping paid by buyer", "biaya pengiriman dibayar pembeli", "shipping fee paid by buyer", "ongkos kirim pembeli"], costImpact: "buyer_paid" },
  shippingSellerSubsidy: { label: "Subsidi ongkir seller", aliases: ["subsidi ongkir", "bebas ongkir", "gratis ongkir", "seller shipping discount", "shipping subsidy", "subsidi ongkir penjual", "voucher ongkir seller", "ongkir ditanggung penjual"], costImpact: "seller_cost" },
  shippingFeeCharged: { label: "Biaya pengiriman dipotong", aliases: ["shipping fee", "biaya pengiriman", "ongkir", "ongkos kirim", "shipping charge", "lazada shipping fee"], costImpact: "seller_cost" },
  tax: { label: "Pajak / PPN", aliases: ["pajak", "ppn", "tax", "vat", "pajak penjual", "withholding tax"], costImpact: "seller_cost" },
  adsCost: { label: "Biaya iklan", aliases: ["biaya iklan", "ads fee", "ads cost", "biaya promosi", "iklan", "campaign cost", "marketing fee"], costImpact: "seller_cost" },
  affiliateCost: { label: "Komisi affiliate", aliases: ["komisi affiliate", "affiliate commission", "affiliate fee", "biaya affiliate", "komisi kreator", "creator commission"], costImpact: "seller_cost" },
  stock: { label: "Stok awal", aliases: ["stok awal", "stock", "stok", "initial stock", "jumlah stok", "stok tersedia", "available stock"] },
};

const MARKETPLACE_SIGNATURES: Record<string, string[]> = {
  Shopee: ["no pesanan", "status pesanan", "sku induk", "voucher ditanggung penjual", "biaya admin", "biaya layanan", "total harga produk"],
  Tokopedia: ["nomor invoice", "jumlah produk", "harga barang", "biaya layanan", "bebas ongkir", "total penjualan"],
  "TikTok Shop": ["order id", "product name", "seller discount", "platform discount", "settlement amount", "affiliate commission"],
  Lazada: ["order item id", "seller sku", "item name", "paid price", "shipping fee", "commission", "voucher amount"],
};

export function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[\s_\-\/()\[\].:]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLookup(row: Record<string, unknown>) {
  const lookup: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    lookup[normalizeKey(key)] = value;
  });
  return lookup;
}

function firstValue(lookup: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = lookup[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
}

function includesAlias(header: string, alias: string) {
  const normalizedHeader = normalizeKey(header);
  const normalizedAlias = normalizeKey(alias);
  return normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader);
}

export function detectMarketplaceFromHeaders(headers: string[], fallback = "CSV") {
  const normalizedHeaders = headers.map(normalizeKey).join(" | ");
  const scores = Object.entries(MARKETPLACE_SIGNATURES).map(([marketplace, aliases]) => {
    const score = aliases.reduce((acc, alias) => acc + (normalizedHeaders.includes(normalizeKey(alias)) ? 1 : 0), 0);
    return { marketplace, score, confidence: Math.min(99, Math.round((score / aliases.length) * 100)) };
  }).sort((a, b) => b.score - a.score);
  const best = scores[0];
  return best && best.score > 0 ? { marketplace: best.marketplace, confidence: Math.max(55, best.confidence) } : { marketplace: fallback, confidence: 35 };
}

export function detectMarketplace(row: Record<string, unknown>, fallback = "CSV") {
  return detectMarketplaceFromHeaders(Object.keys(row), fallback).marketplace;
}

function mapHeaders(headers: string[]): ImportMapping[] {
  const used = new Set<string>();
  return (Object.entries(FIELD_CONFIG) as [CanonicalImportField, FieldConfig][]).map(([field, config]) => {
    let best: { header: string; confidence: number } | null = null;
    for (const header of headers) {
      if (used.has(header)) continue;
      const normalizedHeader = normalizeKey(header);
      for (const alias of config.aliases) {
        const normalizedAlias = normalizeKey(alias);
        let confidence = 0;
        if (normalizedHeader === normalizedAlias) confidence = 99;
        else if (normalizedHeader.includes(normalizedAlias)) confidence = 88;
        else if (normalizedAlias.includes(normalizedHeader) && normalizedHeader.length >= 4) confidence = 78;
        else if (includesAlias(header, alias)) confidence = 70;
        if (confidence > (best?.confidence || 0)) best = { header, confidence };
      }
    }
    if (best) used.add(best.header);
    return { field, label: config.label, header: best?.header || null, confidence: best?.confidence || 0, required: config.required, costImpact: config.costImpact };
  });
}

function valueFromMapped(row: Record<string, unknown>, mappings: ImportMapping[], field: CanonicalImportField, fallbackAliases: string[] = []) {
  const mapped = mappings.find((item) => item.field === field)?.header;
  if (mapped && row[mapped] !== undefined && row[mapped] !== null && String(row[mapped]).trim() !== "") return row[mapped];
  const lookup = buildLookup(row);
  return firstValue(lookup, fallbackAliases.length ? fallbackAliases : FIELD_CONFIG[field].aliases);
}

function pickNumberFromMapped(row: Record<string, unknown>, mappings: ImportMapping[], field: CanonicalImportField) {
  return parseNumber(valueFromMapped(row, mappings, field) || 0);
}

function normalizeUnitPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

function normalizeTotalToUnit(total: number, quantitySold: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round(total / Math.max(quantitySold, 1));
}

function sellerCostFields(): CanonicalImportField[] {
  return ["adminFee", "serviceFee", "commissionFee", "paymentFee", "voucherSeller", "sellerDiscount", "shippingSellerSubsidy", "shippingFeeCharged", "tax", "adsCost", "affiliateCost"];
}

export function parseMarketplaceRowWithMapping(row: Record<string, unknown>, userId: string, index: number, mappings: ImportMapping[], marketplaceOverride?: string): NormalizedImportRow {
  const marketplace = String(marketplaceOverride || valueFromMapped(row, mappings, "marketplace") || detectMarketplace(row, "CSV"));
  const name = String(valueFromMapped(row, mappings, "name") || `Produk Import ${index + 1}`);
  const quantitySold = Math.max(1, pickNumberFromMapped(row, mappings, "quantity") || 1);

  const explicitUnitPrice = pickNumberFromMapped(row, mappings, "unitPrice");
  const explicitLineTotal = pickNumberFromMapped(row, mappings, "lineTotal");
  const settlement = pickNumberFromMapped(row, mappings, "settlement");

  const otherCost = sellerCostFields().reduce((total, field) => total + Math.abs(pickNumberFromMapped(row, mappings, field)), 0);
  const inferredGrossFromSettlement = settlement > 0 ? settlement + otherCost : 0;
  const grossLineRevenue = explicitLineTotal > 0 ? explicitLineTotal : explicitUnitPrice > 0 ? explicitUnitPrice * quantitySold : inferredGrossFromSettlement;
  const sellingPrice = explicitUnitPrice > 0 ? normalizeUnitPrice(explicitUnitPrice) : normalizeTotalToUnit(grossLineRevenue, quantitySold);

  const costPrice = pickNumberFromMapped(row, mappings, "hpp");
  const stockInitial = pickNumberFromMapped(row, mappings, "stock") || quantitySold;
  const stockRemaining = Math.max(stockInitial - quantitySold, 0);
  const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
  const margin = calculateMargin(costPrice, sellingPrice);

  return { user_id: userId, name, cost_price: costPrice, selling_price: sellingPrice, quantity_sold: quantitySold, stock_initial: stockInitial, stock_remaining: stockRemaining, other_cost: otherCost, profit, margin, marketplace };
}

export function parseMarketplaceRow(row: Record<string, unknown>, userId: string, index: number): NormalizedImportRow {
  const headers = Object.keys(row);
  const mappings = mapHeaders(headers);
  return parseMarketplaceRowWithMapping(row, userId, index, mappings);
}

export function createImportPreview(rows: Record<string, unknown>[], userId: string, selectedMarketplace = "auto"): ImportPreview {
  const cleanRows = rows.filter((row) => Object.values(row).some((value) => String(value || "").trim() !== ""));
  const headers = Array.from(new Set(cleanRows.flatMap((row) => Object.keys(row))));
  const detected = detectMarketplaceFromHeaders(headers, "CSV");
  const detectedMarketplace = selectedMarketplace.toLowerCase() === "auto" ? detected.marketplace : selectedMarketplace;
  const mappings = mapHeaders(headers);
  const normalizedRows = cleanRows
    .map((row, index) => parseMarketplaceRowWithMapping(row, userId, index, mappings, detectedMarketplace))
    .filter((row) => row.name.trim().length > 0 && (row.selling_price > 0 || row.cost_price > 0 || row.quantity_sold > 0));

  const grossRevenue = normalizedRows.reduce((sum, row) => sum + row.selling_price * row.quantity_sold, 0);
  const estimatedProfit = normalizedRows.reduce((sum, row) => sum + row.profit, 0);
  const sellerCosts = normalizedRows.reduce((sum, row) => sum + row.other_cost, 0);
  const inventoryValue = normalizedRows.reduce((sum, row) => sum + row.cost_price * row.stock_remaining, 0);
  const avgMargin = normalizedRows.length ? normalizedRows.reduce((sum, row) => sum + row.margin, 0) / normalizedRows.length : 0;
  const confidenceValues = mappings.filter((item) => item.header).map((item) => item.confidence);
  const confidence = Math.round(((confidenceValues.reduce((a, b) => a + b, 0) / Math.max(confidenceValues.length, 1)) * 0.65) + (detected.confidence * 0.35));

  const warnings: string[] = [];
  const requiredMissing = mappings.filter((item) => item.required && !item.header);
  if (requiredMissing.length) warnings.push(`Kolom penting belum ditemukan otomatis: ${requiredMissing.map((item) => item.label).join(", ")}.`);
  if (!mappings.find((item) => item.field === "lineTotal")?.header && !mappings.find((item) => item.field === "unitPrice")?.header && !mappings.find((item) => item.field === "settlement")?.header) warnings.push("Kolom omzet/harga/settlement belum ditemukan. Preview profit bisa tidak akurat.");
  if (!mappings.find((item) => item.field === "hpp")?.header) warnings.push("Kolom HPP/modal belum ditemukan. Profit akan terlalu tinggi sampai HPP diisi.");
  const oddMargins = normalizedRows.filter((row) => row.margin > 90 || row.margin < -20).slice(0, 3);
  if (oddMargins.length) warnings.push(`Margin terlihat mencurigakan pada ${oddMargins.map((row) => row.name).join(", ")}. Cek mapping Harga/HPP/Fee sebelum confirm.`);
  const shippingBuyerPaid = mappings.find((item) => item.field === "shippingBuyerPaid" && item.header);
  const shippingSellerCost = mappings.find((item) => (item.field === "shippingSellerSubsidy" || item.field === "shippingFeeCharged") && item.header);
  if (shippingBuyerPaid && !shippingSellerCost) warnings.push("Ongkir pembeli terdeteksi sebagai informasi, bukan beban seller. Ini normal jika subsidi ongkir seller tidak ada.");

  return {
    detectedMarketplace,
    confidence: Math.min(99, Math.max(0, confidence || detected.confidence)),
    headers,
    mappings,
    rows: normalizedRows,
    summary: { totalRows: cleanRows.length, validRows: normalizedRows.length, grossRevenue, estimatedProfit, sellerCosts, inventoryValue, avgMargin },
    warnings,
  };
}

export function getCSVTemplate() {
  return [
    "Marketplace,Nama Produk,HPP,Harga Jual,Jumlah,Stok Awal,Biaya Admin,Biaya Layanan,Voucher Ditanggung Penjual,Subsidi Ongkir,Pajak,Biaya Iklan",
    "Shopee,Kopi Susu Botol 250ml,8200,18000,48,120,86000,22000,30000,18000,0,125000",
    "Tokopedia,Bundling Hampers Mini,41000,89000,12,35,42000,14000,15000,25000,0,65000",
    "Lazada,Serum Brightening 20ml,45000,121000,32,80,96000,30000,0,45000,12000,0",
  ].join("\n");
}

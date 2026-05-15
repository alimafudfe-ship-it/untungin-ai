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

const SHOPEE_KEYS = ["no. pesanan", "status pesanan", "sku induk", "nama produk", "voucher ditanggung penjual", "biaya admin", "biaya layanan", "total harga produk"];
const TOKOPEDIA_KEYS = ["nomor invoice", "nama produk", "jumlah produk", "harga barang", "biaya layanan", "bebas ongkir", "total penjualan"];
const TIKTOK_KEYS = ["order id", "product name", "sku seller", "seller discount", "platform discount", "settlement amount", "affiliate commission"];
const LAZADA_KEYS = ["order item id", "seller sku", "item name", "paid price", "shipping fee", "commission", "voucher amount"];

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_\-\/()]+/g, " ").replace(/[^a-z0-9 .]+/g, "").trim();
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

export function detectMarketplace(row: Record<string, unknown>, fallback = "CSV") {
  const keys = Object.keys(row).map(normalizeKey).join(" | ");
  if (SHOPEE_KEYS.some((key) => keys.includes(normalizeKey(key)))) return "Shopee";
  if (TOKOPEDIA_KEYS.some((key) => keys.includes(normalizeKey(key)))) return "Tokopedia";
  if (TIKTOK_KEYS.some((key) => keys.includes(normalizeKey(key)))) return "TikTok Shop";
  if (LAZADA_KEYS.some((key) => keys.includes(normalizeKey(key)))) return "Lazada";
  return fallback;
}

export function parseMarketplaceRow(row: Record<string, unknown>, userId: string, index: number): NormalizedImportRow {
  const lookup = buildLookup(row);
  const marketplace = String(firstValue(lookup, ["Marketplace", "Channel", "Platform", "Toko"] ) || detectMarketplace(row, "CSV"));
  const name = String(firstValue(lookup, [
    "Nama Barang", "Nama Barang / Nama Variasi", "Nama Produk", "Product Name", "Item Name", "Nama", "Judul Produk", "SKU Name"
  ]) || `Produk Import ${index + 1}`);

  const quantitySold = parseNumber(firstValue(lookup, [
    "Jumlah", "Jumlah Produk di Pesan", "Jumlah Produk", "Quantity", "Qty", "Kuantitas", "Ordered Quantity"
  ]) || 1) || 1;

  const grossRevenue = parseNumber(firstValue(lookup, [
    "Harga Setelah Diskon", "Harga Jual", "Total Harga Produk", "Subtotal Produk", "Total Penjualan", "Harga Barang", "Paid Price", "Settlement Amount", "Revenue", "Omzet"
  ]) || 0);

  const perItemPrice = parseNumber(firstValue(lookup, ["Harga Satuan", "Unit Price", "Selling Price"]) || 0);
  const sellingPrice = perItemPrice > 0 ? perItemPrice : Math.round(grossRevenue / Math.max(quantitySold, 1));
  const costPrice = parseNumber(firstValue(lookup, ["Modal", "Harga Modal", "HPP", "Cost Price", "Harga Pokok", "COGS"]) || 0);
  const stockInitial = parseNumber(firstValue(lookup, ["Stok Awal", "Stock", "Stok", "Initial Stock", "Jumlah Stok", "Stok Tersedia"]) || quantitySold) || quantitySold;

  const feeKeys = [
    "Biaya Admin", "Biaya Layanan", "Voucher Ditanggung Penjual", "Biaya Iklan", "Komisi Affiliate", "Affiliate Commission",
    "Commission", "Service Fee", "Seller Discount", "Bebas Ongkir", "Gratis Ongkir", "Subsidi Ongkir", "Admin Fee", "Platform Fee"
  ];
  const otherCost = feeKeys.reduce((total, key) => total + Math.abs(parseNumber(firstValue(lookup, [key]) || 0)), 0);
  const stockRemaining = Math.max(stockInitial - quantitySold, 0);
  const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
  const margin = calculateMargin(costPrice, sellingPrice);

  return { user_id: userId, name, cost_price: costPrice, selling_price: sellingPrice, quantity_sold: quantitySold, stock_initial: stockInitial, stock_remaining: stockRemaining, other_cost: otherCost, profit, margin, marketplace };
}

export function getCSVTemplate() {
  return [
    "Marketplace,Nama Produk,HPP,Harga Jual,Jumlah,Stok Awal,Biaya Admin,Biaya Iklan,Voucher Ditanggung Penjual",
    "Shopee,Kopi Susu Botol 250ml,8200,18000,48,120,86000,125000,30000",
    "Tokopedia,Bundling Hampers Mini,41000,89000,12,35,42000,65000,15000",
  ].join("\n");
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: Record<string, unknown>) => void;
    };
  }
}

const db: any = supabase;

type Product = {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantitySold: number;
  stockInitial: number;
  stockRemaining: number;
  otherCost: number;
  profit: number;
  margin: number;
  marketplace?: string;
};

type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  cost_price: number | string | null;
  selling_price: number | string | null;
  quantity_sold: number | string | null;
  stock_initial: number | string | null;
  stock_remaining: number | string | null;
  other_cost: number | string | null;
  profit: number | string | null;
  margin: number | string | null;
  marketplace?: string | null;
  created_at?: string;
};

type Profile = {
  role?: string | null;
  plan?: string | null;
  pro_until?: string | null;
  email?: string | null;
};

type Expense = { id: string; label: string; category: string; amount: number; date: string };
type Goal = { id: string; label: string; target: number; current: number; period: string };
type UpgradePlan = "monthly" | "lifetime";
type TabKey = "overview" | "products" | "cashflow" | "inventory" | "sales" | "ai" | "goals" | "pricing";
type ProductFilter = "all" | "loss" | "fix" | "scale" | "stock";
type StockMoveType = "in" | "out" | "adjust";

const FREE_PRODUCT_LIMIT = 3;
const MONTHLY_PRICE = "Rp29.000/bulan";
const LIFETIME_PRICE = "Rp99.000 sekali bayar";
const MIDTRANS_REVIEW_MODE = false;

const DEMO_PRODUCTS: Product[] = [
  { id: "demo-1", name: "Kopi Susu 250ml", costPrice: 10800, sellingPrice: 20000, quantitySold: 250, stockInitial: 1000, stockRemaining: 750, otherCost: 0, profit: 2300000, margin: 46, marketplace: "Shopee" },
  { id: "demo-2", name: "Jahe Instan", costPrice: 1012, sellingPrice: 2000, quantitySold: 100, stockInitial: 2000, stockRemaining: 1900, otherCost: 20, profit: 98780, margin: 49.4, marketplace: "Tokopedia" },
];

const DEMO_EXPENSES: Expense[] = [
  { id: "exp-1", label: "Iklan marketplace", category: "Ads", amount: 320000, date: new Date().toISOString().slice(0, 10) },
  { id: "exp-2", label: "Packing", category: "Ops", amount: 85000, date: new Date().toISOString().slice(0, 10) },
];

const DEMO_GOALS: Goal[] = [
  { id: "goal-1", label: "Target profit bulanan", target: 5000000, current: 2398780, period: "Bulan ini" },
  { id: "goal-2", label: "Target omzet bulanan", target: 12000000, current: 5200000, period: "Bulan ini" },
];

function money(value: number) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

function percent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/Rp/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculateProfit(item: Pick<Product, "costPrice" | "sellingPrice" | "quantitySold" | "otherCost">) {
  return (item.sellingPrice - item.costPrice) * item.quantitySold - item.otherCost;
}

function calculateMargin(costPrice: number, sellingPrice: number) {
  return sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
}

function mapProductRow(row: ProductRow): Product {
  const quantitySold = parseNumber(row.quantity_sold);
  const stockInitial = parseNumber(row.stock_initial) || quantitySold;
  const stockRemaining = row.stock_remaining === null || row.stock_remaining === undefined ? Math.max(stockInitial - quantitySold, 0) : parseNumber(row.stock_remaining);
  const costPrice = parseNumber(row.cost_price);
  const sellingPrice = parseNumber(row.selling_price);
  const otherCost = parseNumber(row.other_cost);
  const profit = row.profit === null || row.profit === undefined ? calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost }) : parseNumber(row.profit);
  const margin = row.margin === null || row.margin === undefined ? calculateMargin(costPrice, sellingPrice) : parseNumber(row.margin);
  return { id: row.id, name: row.name || "Produk Tanpa Nama", costPrice, sellingPrice, quantitySold, stockInitial, stockRemaining, otherCost, profit, margin, marketplace: row.marketplace || "Manual" };
}

function isProfilePro(profile: Profile | null) {
  return profile?.plan === "pro" && (!profile.pro_until || new Date(profile.pro_until) > new Date());
}

function isProfileExpired(profile: Profile | null) {
  return profile?.plan === "pro" && !!profile.pro_until && new Date(profile.pro_until) <= new Date();
}

function getPlanAmount(plan: UpgradePlan) {
  return plan === "monthly" ? 29000 : 99000;
}

function getErrorMessage(error: unknown) {
  if (!error) return "Terjadi error.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error, null, 2); } catch { return "Terjadi error tidak dikenal."; }
}

function getHealth(item: Product) {
  if (item.profit < 0) return { label: "Rugi", tone: "danger" as const };
  if (item.margin < 10) return { label: "Kritis", tone: "warning" as const };
  if (item.margin < 20) return { label: "Perlu optimasi", tone: "warning" as const };
  return { label: "Sehat", tone: "success" as const };
}

function getStockStatus(item: Product) {
  if (item.stockInitial <= 0) return { label: "Belum diisi", tone: "muted" as const };
  const rate = (item.stockRemaining / Math.max(item.stockInitial, 1)) * 100;
  if (item.stockRemaining <= 0) return { label: "Habis", tone: "danger" as const };
  if (item.stockRemaining <= 5 || rate <= 15) return { label: "Menipis", tone: "warning" as const };
  return { label: "Aman", tone: "success" as const };
}

function getRestockRecommendation(item: Product) {
  if (item.profit < 0 || item.margin < 10) return "Tahan restock";
  if (item.stockRemaining <= 0 && item.margin >= 20) return "Restock segera";
  if ((item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) && item.margin >= 20) return "Restock";
  if (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) return "Optimasi dulu";
  return "Pantau stok";
}

function daysUntilOut(item: Product) {
  if (item.quantitySold <= 0) return null;
  const dailySales = Math.max(item.quantitySold / 30, 0.1);
  return Math.max(0, Math.ceil(item.stockRemaining / dailySales));
}

function recommendedPrice(item: Product) {
  const unitOtherCost = item.otherCost / Math.max(item.quantitySold, 1);
  return Math.ceil((item.costPrice + unitOtherCost) / 0.75);
}

function productDecision(item: Product) {
  if (item.profit < 0) return "Stop / evaluasi";
  if (item.margin < 10) return "Naikkan harga";
  if (item.margin < 20) return "Optimasi";
  return "Scale bertahap";
}

function Badge({ label, tone = "muted" }: { label: string; tone?: "success" | "warning" | "danger" | "blue" | "muted" }) {
  const palette = {
    success: { color: "#86efac", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.22)" },
    warning: { color: "#fbbf24", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" },
    danger: { color: "#fca5a5", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)" },
    blue: { color: "#93c5fd", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.22)" },
    muted: { color: "#cbd5e1", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.14)" },
  }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 9px", color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`, fontSize: 12, fontWeight: 800 }}>{label}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}><h3 style={{ color: "#f8fafc", margin: "0 0 8px" }}>{title}</h3><p style={{ margin: 0, lineHeight: 1.7 }}>{description}</p></div>;
}

function Progress({ value }: { value: number }) {
  const width = clamp(value, 0, 100);
  return <div style={{ height: 8, borderRadius: 999, background: "rgba(148,163,184,0.12)", overflow: "hidden" }}><div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22c55e,#14b8a6)" }} /></div>;
}

function Sparkline({ data }: { data: number[] }) {
  const width = 260;
  const height = 72;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData.map((value, index) => `${(index / Math.max(safeData.length - 1, 1)) * width},${height - ((value - min) / range) * height}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}><polyline fill="none" stroke="rgba(34,197,94,0.16)" strokeWidth="10" points={points} strokeLinecap="round" strokeLinejoin="round" /><polyline fill="none" stroke="#22c55e" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [goals, setGoals] = useState<Goal[]>(DEMO_GOALS);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>("all");
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>("lifetime");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("Pilih pertanyaan atau klik Generate untuk mendapatkan insight berbasis data produk, stok, cashflow, dan margin.");
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "", otherCost: "" });
  const [expenseForm, setExpenseForm] = useState({ label: "", category: "Ops", amount: "" });
  const [form, setForm] = useState({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "Shopee" });

  const isPro = isProfilePro(profile);
  const proExpired = isProfileExpired(profile);
  const totalProfit = products.reduce((acc, item) => acc + item.profit, 0);
  const totalRevenue = products.reduce((acc, item) => acc + item.sellingPrice * item.quantitySold, 0);
  const totalUnits = products.reduce((acc, item) => acc + item.quantitySold, 0);
  const totalStock = products.reduce((acc, item) => acc + item.stockRemaining, 0);
  const inventoryValue = products.reduce((acc, item) => acc + item.stockRemaining * item.costPrice, 0);
  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
  const netCash = totalProfit - totalExpenses;
  const avgMargin = products.length ? products.reduce((acc, item) => acc + item.margin, 0) / products.length : 0;
  const lowStockProducts = products.filter((item) => item.stockInitial > 0 && item.stockRemaining > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  const outOfStockProducts = products.filter((item) => item.stockInitial > 0 && item.stockRemaining <= 0);
  const lossProducts = products.filter((item) => item.profit < 0);
  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.profit - a.profit), [products]);
  const bestProduct = sortedProducts[0] ?? null;
  const worstProduct = products.length ? [...products].sort((a, b) => a.profit - b.profit)[0] : null;

  const actionPlan = useMemo(() => products.map((item) => ({ ...item, recommendedPrice: recommendedPrice(item), decision: productDecision(item), restock: getRestockRecommendation(item), daysLeft: daysUntilOut(item) })), [products]);

  const filteredProducts = useMemo(() => {
    if (selectedFilter === "loss") return sortedProducts.filter((item) => item.profit < 0);
    if (selectedFilter === "fix") return sortedProducts.filter((item) => item.profit >= 0 && item.margin < 20);
    if (selectedFilter === "scale") return sortedProducts.filter((item) => item.profit > 0 && item.margin >= 20);
    if (selectedFilter === "stock") return sortedProducts.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15);
    return sortedProducts;
  }, [selectedFilter, sortedProducts]);

  const profitLeak = products.reduce((acc, item) => {
    if (item.margin >= 20) return acc;
    const safeProfit = item.sellingPrice * item.quantitySold * 0.2 - item.otherCost;
    return acc + Math.max(0, safeProfit - item.profit);
  }, 0);
  const dailyLeakEstimate = Math.max(Math.round(Math.max(profitLeak * 4, products.length * 50000) / 30), products.length * 2500);
  const riskScore = clamp(Math.round((lossProducts.length / Math.max(products.length, 1)) * 40 + (products.filter((item) => item.margin < 15).length / Math.max(products.length, 1)) * 28 + (lowStockProducts.length + outOfStockProducts.length > 0 ? 16 : 0) + (netCash < 0 ? 16 : 0)), 0, 100);
  const oneThingAction = lossProducts[0] ? `Evaluasi ${lossProducts[0].name} sebelum tambah stok.` : lowStockProducts[0] ? `Siapkan restock ${lowStockProducts[0].name}.` : bestProduct ? `Scale bertahap ${bestProduct.name}.` : "Tambahkan produk pertama untuk mulai analisis.";
  const sparklineData = [0, totalProfit * 0.3, totalProfit * 0.58, totalProfit * 0.76, totalProfit];

  const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 14, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(2,6,23,0.66)", color: "#f8fafc", outline: "none", fontSize: 14 };
  const cardStyle: React.CSSProperties = { background: "linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.94))", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 24, padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.24)" };
  const ctaButtonStyle: React.CSSProperties = { padding: "12px 16px", background: "linear-gradient(135deg,#22c55e,#14b8a6)", color: "#03130b", border: "0", borderRadius: 14, cursor: "pointer", fontWeight: 900, fontSize: 14 };
  const ghostButtonStyle: React.CSSProperties = { padding: "10px 13px", background: "rgba(15,23,42,0.74)", color: "#f8fafc", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 13, cursor: "pointer", fontWeight: 800 };

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return;
    const snapScriptSrc = "https://app.midtrans.com/snap/snap.js";
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${snapScriptSrc}"]`);
    if (existingScript) return;
    const script = document.createElement("script");
    script.src = snapScriptSrc;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadUserAndProducts() {
      if (isMounted) setPageLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (sessionError || !user) {
        if (!isMounted) return;
        setCurrentUserId("demo-user"); setUserEmail(null); setProducts(DEMO_PRODUCTS); setProfile({ role: "user", plan: "free", pro_until: null, email: null }); setIsDemoMode(true); setPageLoading(false); return;
      }
      if (!isMounted) return;
      setCurrentUserId(user.id); setUserEmail(user.email ?? null); setIsDemoMode(false);
      const { data: profileData } = await db.from("profiles").select("role, plan, pro_until, email").eq("email", user.email).maybeSingle();
      if (!isMounted) return;
      setProfile((profileData as Profile | null) ?? { role: "user", plan: "free", pro_until: null, email: user.email });
      const { data: productData, error: productError } = await db.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!isMounted) return;
      if (productError) { console.error(productError); alert("Gagal mengambil data produk dari database."); } else { setProducts(((productData || []) as ProductRow[]).map(mapProductRow)); }
      setPageLoading(false);
    }
    loadUserAndProducts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") { loadUserAndProducts(); return; }
      if (event === "SIGNED_OUT" || !session?.user) { setCurrentUserId("demo-user"); setUserEmail(null); setProducts(DEMO_PRODUCTS); setProfile({ role: "user", plan: "free", pro_until: null, email: null }); setIsDemoMode(true); setPageLoading(false); }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [router]);

  function ensureLoggedIn() {
    if (!currentUserId) { alert("Harus login dulu supaya data tersimpan."); return false; }
    return true;
  }

  function openUpgradeModal(plan: UpgradePlan = "lifetime") { setSelectedPlan(plan); setShowUpgradeModal(true); }

  async function handleUpgradeMidtrans(plan: UpgradePlan = selectedPlan) {
    if (!ensureLoggedIn()) return;
    if (MIDTRANS_REVIEW_MODE) { alert("Midtrans sedang review. Silakan coba lagi nanti."); return; }
    if (!userEmail) { alert("Email user tidak ditemukan. Coba logout lalu login ulang."); return; }
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/create-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail, plan, amount: getPlanAmount(plan) }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(data?.error || data));
      if (!data?.token) throw new Error("Token pembayaran Midtrans tidak ditemukan dari server.");
      if (!window.snap?.pay) throw new Error("Midtrans Snap belum siap. Refresh halaman lalu coba lagi.");
      window.snap.pay(data.token, { onSuccess: () => { alert("Pembayaran berhasil. PRO akan aktif otomatis setelah webhook diproses."); window.location.reload(); }, onPending: () => { alert("Pembayaran masih pending. Selesaikan pembayaran lalu refresh dashboard."); setUpgradeLoading(false); }, onError: (error: unknown) => { alert(`Pembayaran gagal: ${getErrorMessage(error)}`); setUpgradeLoading(false); }, onClose: () => setUpgradeLoading(false) });
    } catch (error) { console.error(error); alert(getErrorMessage(error)); setUpgradeLoading(false); }
  }

  async function persistProductUpdate(productId: string, patch: Partial<Product>) {
    if (isDemoMode) { setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, ...patch } : item))); return true; }
    const payload: Record<string, number | string> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.costPrice !== undefined) payload.cost_price = patch.costPrice;
    if (patch.sellingPrice !== undefined) payload.selling_price = patch.sellingPrice;
    if (patch.quantitySold !== undefined) payload.quantity_sold = patch.quantitySold;
    if (patch.stockInitial !== undefined) payload.stock_initial = patch.stockInitial;
    if (patch.stockRemaining !== undefined) payload.stock_remaining = patch.stockRemaining;
    if (patch.otherCost !== undefined) payload.other_cost = patch.otherCost;
    if (patch.profit !== undefined) payload.profit = patch.profit;
    if (patch.margin !== undefined) payload.margin = patch.margin;
    if (patch.marketplace !== undefined) payload.marketplace = patch.marketplace;
    const { error } = await db.from("products").update(payload as any).eq("id", productId).eq("user_id", currentUserId);
    if (error) { console.error(error); alert("Gagal update database."); return false; }
    setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, ...patch } : item)));
    return true;
  }

  async function handleLogout() { await supabase.auth.signOut(); setCurrentUserId(null); setUserEmail(null); setProducts([]); setProfile(null); router.replace("/login"); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureLoggedIn()) return;
    if (!isPro && products.length >= FREE_PRODUCT_LIMIT) { openUpgradeModal("lifetime"); return; }
    const name = form.productName.trim();
    const costPrice = parseNumber(form.costPrice);
    const sellingPrice = parseNumber(form.sellingPrice);
    const stockInitial = parseNumber(form.stockInitial);
    const quantitySold = parseNumber(form.quantitySold);
    const otherCost = parseNumber(form.otherCost);
    if (!name || costPrice < 0 || sellingPrice <= 0 || stockInitial < 0 || quantitySold < 0 || quantitySold > stockInitial || otherCost < 0) { alert("Cek lagi input. Nama, harga jual, stok, dan terjual harus valid."); return; }
    const stockRemaining = Math.max(stockInitial - quantitySold, 0);
    const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
    const margin = calculateMargin(costPrice, sellingPrice);
    setLoading(true);
    try {
      if (isDemoMode) {
        setProducts((prev) => [{ id: `demo-${Date.now()}`, name, costPrice, sellingPrice, stockInitial, stockRemaining, quantitySold, otherCost, profit, margin, marketplace: form.marketplace }, ...prev]);
      } else {
        const { data, error } = await db.from("products").insert([{ user_id: currentUserId, name, cost_price: costPrice, selling_price: sellingPrice, stock_initial: stockInitial, stock_remaining: stockRemaining, quantity_sold: quantitySold, other_cost: otherCost, profit, margin, marketplace: form.marketplace } as any]).select("*").single();
        if (error) throw error;
        if (data) setProducts((prev) => [mapProductRow(data as ProductRow), ...prev]);
      }
      setForm({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "Shopee" }); setActiveTab("overview");
    } catch (error) { console.error(error); alert("Gagal menyimpan produk."); } finally { setLoading(false); }
  }

  async function recordSale(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((item) => item.id === saleForm.productId);
    if (!product) { alert("Pilih produk dulu."); return; }
    const qty = parseNumber(saleForm.qty);
    const extraCost = parseNumber(saleForm.otherCost);
    if (qty <= 0) { alert("Qty penjualan harus lebih dari 0."); return; }
    if (qty > product.stockRemaining) { alert("Qty penjualan melebihi stok tersedia."); return; }
    const quantitySold = product.quantitySold + qty;
    const stockRemaining = Math.max(product.stockRemaining - qty, 0);
    const otherCost = product.otherCost + extraCost;
    const profit = calculateProfit({ costPrice: product.costPrice, sellingPrice: product.sellingPrice, quantitySold, otherCost });
    const margin = calculateMargin(product.costPrice, product.sellingPrice);
    const ok = await persistProductUpdate(product.id, { quantitySold, stockRemaining, otherCost, profit, margin });
    if (ok) { setSaleForm({ productId: product.id, qty: "", otherCost: "" }); alert("Penjualan tersimpan. Stok otomatis berkurang dan profit ikut update."); }
  }

  async function applyStockMove(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((item) => item.id === stockMove.productId);
    if (!product) { alert("Pilih produk dulu."); return; }
    const qty = parseNumber(stockMove.qty);
    if (qty < 0 || (stockMove.type !== "adjust" && qty <= 0)) { alert("Jumlah stok tidak valid."); return; }
    let stockInitial = product.stockInitial;
    let stockRemaining = product.stockRemaining;
    if (stockMove.type === "in") { stockInitial += qty; stockRemaining += qty; } else if (stockMove.type === "out") { stockRemaining = Math.max(stockRemaining - qty, 0); } else { stockRemaining = qty; stockInitial = Math.max(stockInitial, qty + product.quantitySold); }
    const ok = await persistProductUpdate(product.id, { stockInitial, stockRemaining });
    if (ok) { setStockMove({ productId: product.id, type: "in", qty: "", note: "" }); alert("Stok berhasil diperbarui."); }
  }

  async function deleteProduct(id: string) {
    if (!ensureLoggedIn()) return;
    if (!window.confirm("Hapus produk ini?")) return;
    if (isDemoMode) { setProducts((prev) => prev.filter((item) => item.id !== id)); return; }
    const { error } = await db.from("products").delete().eq("id", id).eq("user_id", currentUserId);
    if (error) { console.error(error); alert("Gagal menghapus produk."); return; }
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseNumber(expenseForm.amount);
    if (!expenseForm.label.trim() || amount <= 0) { alert("Isi nama dan nominal biaya."); return; }
    setExpenses((prev) => [{ id: `exp-${Date.now()}`, label: expenseForm.label.trim(), category: expenseForm.category, amount, date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setExpenseForm({ label: "", category: "Ops", amount: "" });
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ensureLoggedIn()) { e.target.value = ""; return; }
    setSyncing(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, unknown>[];
        const remainingSlot = isPro ? rows.length : FREE_PRODUCT_LIMIT - products.length;
        if (remainingSlot <= 0) { openUpgradeModal("lifetime"); e.target.value = ""; setSyncing(false); return; }
        const imported = rows.slice(0, remainingSlot).map((row, index) => {
          const marketplace = String(row["Marketplace"] || row["marketplace"] || "CSV");
          const name = String(row["Nama Barang"] || row["Nama Barang / Nama Variasi"] || row["Product Name"] || row["Nama Produk"] || `Produk ${index + 1}`);
          const sellingPrice = parseNumber(row["Harga Setelah Diskon"] || row["Harga Jual"] || row["Total Harga Produk"] || row["Subtotal Produk"] || 0);
          const quantitySold = parseNumber(row["Jumlah"] || row["Jumlah Produk di Pesan"] || row["Quantity"] || 1) || 1;
          const stockInitial = parseNumber(row["Stok Awal"] || row["Stock"] || row["Stok"] || row["Initial Stock"] || row["Jumlah Stok"] || quantitySold) || quantitySold;
          const otherCost = parseNumber(row["Biaya Admin"] || row["Biaya Layanan"] || row["Voucher Ditanggung Penjual"] || row["Biaya Iklan"] || 0);
          const costPrice = parseNumber(row["Modal"] || row["Harga Modal"] || row["HPP"] || row["Cost Price"] || row["Harga Pokok"] || 0);
          const stockRemaining = Math.max(stockInitial - quantitySold, 0);
          const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
          const margin = calculateMargin(costPrice, sellingPrice);
          return { user_id: currentUserId, name, cost_price: costPrice, selling_price: sellingPrice, quantity_sold: quantitySold, stock_initial: stockInitial, stock_remaining: stockRemaining, other_cost: otherCost, profit, margin, marketplace };
        });
        try {
          if (isDemoMode) setProducts((prev) => [...imported.map((row, index) => mapProductRow({ id: `demo-csv-${Date.now()}-${index}`, ...row } as ProductRow)), ...prev]);
          else { const { data, error } = await db.from("products").insert(imported as any).select("*"); if (error) throw error; if (data) setProducts((prev) => [...(data as ProductRow[]).map(mapProductRow), ...prev]); }
          setLastSync(new Date().toLocaleString("id-ID")); alert(`Berhasil import ${imported.length} produk.`);
        } catch (error) { console.error(error); alert("Gagal import CSV ke database."); } finally { e.target.value = ""; setSyncing(false); }
      },
      error: (error) => { console.error(error); alert("Gagal membaca file CSV."); e.target.value = ""; setSyncing(false); },
    });
  }

  function exportReportCSV() {
    if (!isPro) { openUpgradeModal("lifetime"); return; }
    if (products.length === 0) { alert("Belum ada produk untuk export."); return; }
    const headers = ["Nama Produk", "Marketplace", "Modal", "Harga Jual", "Terjual", "Stok", "Biaya Lain", "Profit", "Margin", "Keputusan", "Harga Aman", "Restock"];
    const rows = actionPlan.map((item) => [item.name, item.marketplace || "Manual", item.costPrice, item.sellingPrice, item.quantitySold, item.stockRemaining, item.otherCost, item.profit, `${item.margin.toFixed(1)}%`, item.decision, item.recommendedPrice, item.restock]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `untungin-ai-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  function askAiCfo() {
    if (products.length === 0) { setAiAnswer("Tambahkan minimal 1 produk dulu agar insight bisa membaca profit, stok, margin, dan cashflow."); return; }
    const stockLines = [...lowStockProducts, ...outOfStockProducts].slice(0, 5).map((item) => `- ${item.name}: stok ${item.stockRemaining}, saran ${getRestockRecommendation(item)}`).join("\n") || "- Tidak ada stok kritis.";
    const priceLines = actionPlan.slice(0, 6).map((item) => `- ${item.name}: ${item.decision}; harga aman ${money(item.recommendedPrice)}; margin ${percent(item.margin)}; ${item.restock}.`).join("\n");
    const lossLine = worstProduct ? `${worstProduct.name} adalah produk dengan performa terendah (${money(worstProduct.profit)}).` : "Belum ada produk terendah.";
    const question = aiQuestion.trim() || "Buat ringkasan bisnis hari ini.";
    setAiAnswer(`Pertanyaan:\n${question}\n\nRingkasan eksekutif:\nOmzet ${money(totalRevenue)}, profit kotor ${money(totalProfit)}, biaya operasional ${money(totalExpenses)}, cashflow bersih ${money(netCash)}, margin rata-rata ${percent(avgMargin)}, inventory value ${money(inventoryValue)}.\n\nPrioritas hari ini:\n${oneThingAction}\n\nRisiko utama:\nRisk score ${riskScore}/100. ${lossLine} Estimasi profit leak ${money(dailyLeakEstimate)} per hari jika produk margin tipis tidak diperbaiki.\n\nKontrol stok:\n${stockLines}\n\nPricing dan scale plan:\n${priceLines}\n\nKeputusan:\nScale hanya produk profit positif dengan margin minimal 20%. Tahan restock produk rugi atau margin di bawah 10%. Catat semua biaya operasional agar cashflow tidak terlihat semu.`);
  }

  function StatCard({ label, value, helper, tone = "green" }: { label: string; value: React.ReactNode; helper: string; tone?: "green" | "red" | "yellow" | "blue" | "neutral" }) {
    const color = tone === "red" ? "#fca5a5" : tone === "yellow" ? "#fbbf24" : tone === "blue" ? "#93c5fd" : tone === "neutral" ? "#f8fafc" : "#86efac";
    return <div style={cardStyle}><p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{label}</p><h2 style={{ margin: "10px 0", color, fontSize: 28, letterSpacing: -0.6 }}>{value}</h2><small style={{ color: "#64748b", lineHeight: 1.5 }}>{helper}</small></div>;
  }

  function renderProductTable(mode: "product" | "inventory" = "product") {
    if (filteredProducts.length === 0) return <EmptyState title="Belum ada produk" description="Tambahkan produk manual atau import CSV untuk mulai membaca profit dan stok." />;
    return <div style={{ overflowX: "auto", borderRadius: 18, border: "1px solid rgba(148,163,184,0.10)", background: "rgba(2,6,23,0.42)" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: mode === "inventory" ? 940 : 980 }}><thead><tr style={{ background: "rgba(15,23,42,0.82)", textAlign: "left" }}>{["Produk", "Marketplace", "Harga", "Profit", "Stok", "Terjual", mode === "inventory" ? "Estimasi" : "Margin", "Status", "Aksi"].map((head) => <th key={head} style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", borderBottom: "1px solid rgba(148,163,184,0.08)", whiteSpace: "nowrap" }}>{head}</th>)}</tr></thead><tbody>{filteredProducts.map((item) => {
      const health = getHealth(item); const stock = getStockStatus(item); const dayLeft = daysUntilOut(item); const safePrice = recommendedPrice(item);
      return <tr key={item.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.06)" }}><td style={{ padding: 16, minWidth: 230 }}><strong>{item.name}</strong><div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}><Badge label={health.label} tone={health.tone} /><Badge label={stock.label} tone={stock.tone} /></div><small style={{ display: "block", marginTop: 9, color: "#94a3b8" }}>{productDecision(item)} · Harga aman <b style={{ color: "#cbd5e1" }}>{money(safePrice)}</b></small></td><td style={{ padding: 16 }}><Badge label={item.marketplace || "Manual"} tone="blue" /></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>Jual</small><br /><strong>{money(item.sellingPrice)}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>Profit</small><br /><strong style={{ color: item.profit >= 0 ? "#86efac" : "#fca5a5" }}>{money(item.profit)}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>Stok</small><br /><strong>{item.stockRemaining}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>Sold</small><br /><strong>{item.quantitySold}</strong></td><td style={{ padding: 16, minWidth: 140 }}>{mode === "inventory" ? <><small style={{ color: "#64748b" }}>Habis</small><br /><strong style={{ color: dayLeft !== null && dayLeft <= 7 ? "#fbbf24" : "#cbd5e1" }}>{dayLeft === null ? "-" : `${dayLeft} hari`}</strong></> : <><small style={{ color: "#64748b" }}>Margin</small><br /><strong>{percent(item.margin)}</strong><div style={{ marginTop: 8 }}><Progress value={Math.min(item.margin, 60) / 60 * 100} /></div></>}</td><td style={{ padding: 16, minWidth: 130 }}><Badge label={getRestockRecommendation(item)} tone={getRestockRecommendation(item).toLowerCase().includes("restock") ? "success" : "muted"} /></td><td style={{ padding: 16, minWidth: 160 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => { setStockMove((prev) => ({ ...prev, productId: item.id })); setActiveTab("inventory"); }} style={{ ...ghostButtonStyle, padding: "8px 11px", fontSize: 12 }}>Stok</button><button onClick={() => { setSaleForm((prev) => ({ ...prev, productId: item.id })); setActiveTab("sales"); }} style={{ ...ghostButtonStyle, padding: "8px 11px", fontSize: 12 }}>Jual</button><button onClick={() => deleteProduct(item.id)} style={{ padding: "8px 11px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.18)", background: "rgba(127,29,29,0.14)", color: "#fca5a5", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>Hapus</button></div></td></tr>;
    })}</tbody></table></div>;
  }

  function renderMobileProductCards() {
    if (filteredProducts.length === 0) return <EmptyState title="Belum ada produk" description="Tambah produk atau import CSV." />;
    return <div className="mobile-cards" style={{ display: "none", gap: 12 }}>{filteredProducts.map((item) => <div key={item.id} style={{ ...cardStyle, padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{item.name}</strong><Badge label={item.marketplace || "Manual"} tone="blue" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}><div><small style={{ color: "#64748b" }}>Profit</small><br /><b style={{ color: item.profit >= 0 ? "#86efac" : "#fca5a5" }}>{money(item.profit)}</b></div><div><small style={{ color: "#64748b" }}>Margin</small><br /><b>{percent(item.margin)}</b></div><div><small style={{ color: "#64748b" }}>Stok</small><br /><b>{item.stockRemaining}</b></div><div><small style={{ color: "#64748b" }}>Keputusan</small><br /><b>{productDecision(item)}</b></div></div><div style={{ marginTop: 14, display: "flex", gap: 8 }}><button style={ghostButtonStyle} onClick={() => setActiveTab("inventory")}>Stok</button><button style={ghostButtonStyle} onClick={() => setActiveTab("sales")}>Jual</button></div></div>)}</div>;
  }

  if (pageLoading) return <main style={{ minHeight: "100vh", background: "#070A12", color: "#f8fafc", display: "grid", placeItems: "center", fontFamily: "Inter, Arial" }}><div style={{ textAlign: "center" }}><div style={{ width: 44, height: 44, borderRadius: 999, border: "4px solid rgba(34,197,94,0.18)", borderTopColor: "#22c55e", margin: "0 auto 16px" }} /><p>Loading Untungin.ai...</p></div></main>;

  return <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top left,rgba(20,184,166,0.12),transparent 30%),linear-gradient(180deg,#070A12,#020617 48%,#010409)", color: "#f8fafc", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", padding: 24 }}><style>{`
    * { box-sizing: border-box; } html { scroll-behavior: smooth; } button { transition: 160ms ease; } button:hover { transform: translateY(-1px); filter: brightness(1.04); } input::placeholder, textarea::placeholder { color: rgba(203,213,225,0.38); } select { color-scheme: dark; }
    @media (max-width: 980px) { main { padding: 14px !important; } .top-grid, .main-grid, .metrics-grid, .two-grid, .three-grid { grid-template-columns: 1fr !important; } .hero-title { font-size: 38px !important; letter-spacing: -1.4px !important; } .desktop-table { display: none !important; } .mobile-cards { display: grid !important; } .sticky-tabs { position: fixed !important; left: 12px; right: 12px; bottom: 12px; top: auto !important; justify-content: space-between; overflow-x: auto; } .sticky-spacer { height: 78px; } .nav-actions { width: 100%; justify-content: flex-start !important; } }
  `}</style>

    {showUpgradeModal && <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.78)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ ...cardStyle, maxWidth: 650, width: "100%", border: "1px solid rgba(34,197,94,0.32)" }}><button onClick={() => setShowUpgradeModal(false)} style={{ float: "right", background: "transparent", color: "#f8fafc", border: "none", fontSize: 24, cursor: "pointer" }}>×</button><Badge label="Untungin.ai PRO" tone="success" /><h2 style={{ fontSize: 30, margin: "14px 0 8px" }}>Buka insight lengkap untuk profit, cashflow, stok, dan pricing</h2><p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>PRO membuka unlimited produk, multi marketplace import, AI insights, export laporan, goal tracker, dan analisis cashflow.</p><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>{([ ["monthly", "PRO Bulanan", MONTHLY_PRICE], ["lifetime", "PRO Lifetime", LIFETIME_PRICE] ] as const).map(([key, title, price]) => <button key={key} onClick={() => setSelectedPlan(key)} style={{ padding: 18, textAlign: "left", borderRadius: 18, border: selectedPlan === key ? "1px solid #22c55e" : "1px solid rgba(148,163,184,0.18)", background: selectedPlan === key ? "rgba(34,197,94,0.10)" : "rgba(2,6,23,0.62)", color: "#f8fafc" }}><strong>{title}</strong><br /><span style={{ color: "#86efac", fontWeight: 900 }}>{price}</span></button>)}</div><button onClick={() => handleUpgradeMidtrans(selectedPlan)} disabled={upgradeLoading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 18, opacity: upgradeLoading ? 0.7 : 1 }}>{upgradeLoading ? "Membuka pembayaran..." : "Bayar dengan Midtrans"}</button></div></div>}

    <section style={{ maxWidth: 1320, margin: "0 auto" }}><nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#22c55e,#14b8a6)", color: "#03130b", fontWeight: 950 }}>U</div><div><strong>Untungin.ai</strong><div style={{ color: "#94a3b8", fontSize: 12 }}>Profit, sales, inventory, cashflow</div></div></div><div className="nav-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}><Badge label={isPro ? "PRO Aktif" : proExpired ? "PRO Expired" : "Paket Free"} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /><button onClick={exportReportCSV} style={ghostButtonStyle}>Export</button>{!isPro && <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>Upgrade</button>}<button onClick={handleLogout} style={{ ...ghostButtonStyle, background: "rgba(127,29,29,0.34)", borderColor: "rgba(248,113,113,0.22)" }}>Logout</button></div></nav>

      <header className="top-grid" style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 24, alignItems: "center", marginBottom: 18, border: "1px solid rgba(20,184,166,0.20)", background: "linear-gradient(135deg,rgba(6,78,59,0.34),rgba(2,6,23,0.94))" }}><div><Badge label="Dashboard Operasional Seller" tone="success" /><h1 className="hero-title" style={{ fontSize: 54, lineHeight: 1.04, letterSpacing: -2, margin: "16px 0 10px" }}>Profit jelas. Stok aman. Cashflow terkendali.</h1><p style={{ color: "#cbd5e1", fontSize: 17, lineHeight: 1.7, maxWidth: 760 }}>Satu dashboard untuk membaca margin, inventory, pengeluaran, target, dan rekomendasi tindakan harian.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}><button onClick={() => setActiveTab("products")} style={ctaButtonStyle}>Tambah produk</button><button onClick={() => setActiveTab("cashflow")} style={ghostButtonStyle}>Catat cashflow</button><label style={{ ...ghostButtonStyle, display: "inline-flex", cursor: "pointer" }}>{syncing ? "Importing..." : "Import CSV"}<input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} /></label></div>{lastSync && <p style={{ color: "#64748b", fontSize: 12 }}>Last import: {lastSync}</p>}</div><div style={{ padding: 20, borderRadius: 22, background: "rgba(2,6,23,0.70)", border: "1px solid rgba(148,163,184,0.10)" }}><p style={{ margin: 0, color: "#94a3b8" }}>Cashflow bersih</p><h2 style={{ fontSize: 40, margin: "6px 0", color: netCash >= 0 ? "#86efac" : "#fca5a5" }}>{money(netCash)}</h2><Sparkline data={sparklineData} /><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}><div><small style={{ color: "#94a3b8" }}>Omzet</small><br /><strong>{money(totalRevenue)}</strong></div><div><small style={{ color: "#94a3b8" }}>Inventory value</small><br /><strong>{money(inventoryValue)}</strong></div></div></div></header>

      <div className="sticky-tabs" style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, padding: 10, borderRadius: 20, background: "rgba(2,6,23,0.78)", border: "1px solid rgba(148,163,184,0.12)", backdropFilter: "blur(16px)" }}>{([ ["overview", "Overview"], ["products", "Produk"], ["cashflow", "Cashflow"], ["inventory", "Inventory"], ["sales", "Penjualan"], ["ai", "Insight"], ["goals", "Target"], ["pricing", "Plans"] ] as const).map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} style={{ ...ghostButtonStyle, background: activeTab === key ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.50)", color: activeTab === key ? "#86efac" : "#f8fafc", borderColor: activeTab === key ? "rgba(34,197,94,0.32)" : "rgba(148,163,184,0.12)", whiteSpace: "nowrap" }}>{label}</button>)}</div>

      {activeTab === "overview" && <div style={{ display: "grid", gap: 18 }}><section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}><StatCard label="Omzet" value={money(totalRevenue)} helper={`${totalUnits} unit terjual`} tone="blue" /><StatCard label="Profit produk" value={money(totalProfit)} helper={`Margin rata-rata ${percent(avgMargin)}`} tone={totalProfit >= 0 ? "green" : "red"} /><StatCard label="Cashflow bersih" value={money(netCash)} helper={`Biaya operasional ${money(totalExpenses)}`} tone={netCash >= 0 ? "green" : "red"} /><StatCard label="Risk score" value={`${riskScore}/100`} helper={`Estimasi bocor ${money(dailyLeakEstimate)} per hari`} tone={riskScore >= 50 ? "red" : riskScore >= 25 ? "yellow" : "green"} /></section><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}><div style={cardStyle}><Badge label="Rekomendasi Hari Ini" tone="success" /><h2 style={{ margin: "12px 0", lineHeight: 1.35 }}>{oneThingAction}</h2><p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Prioritas ditentukan dari profit, margin, stok, dan cashflow agar keputusan tidak hanya berdasarkan omzet.</p><button onClick={() => setActiveTab("ai")} style={ctaButtonStyle}>Lihat insight</button></div><div style={cardStyle}><Badge label="Inventory Health" tone="warning" /><h2 style={{ margin: "12px 0" }}>{money(inventoryValue)} modal tertahan di stok</h2><p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Produk habis: {outOfStockProducts.length}. Stok menipis: {lowStockProducts.length}. Produk rugi: {lossProducts.length}.</p><button onClick={() => setActiveTab("inventory")} style={ghostButtonStyle}>Kelola stok</button></div></section><section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}><div><Badge label="Performa Produk" tone="blue" /><h2 style={{ margin: "8px 0 0" }}>Profit, risiko, marketplace, dan stok</h2></div><button onClick={() => setActiveTab("products")} style={ghostButtonStyle}>Lihat semua</button></div><div className="desktop-table">{renderProductTable("product")}</div>{renderMobileProductCards()}</section></div>}

      {activeTab === "products" && <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.35fr", gap: 18 }}><section style={cardStyle}><Badge label="Input Produk" tone="success" /><h2>Tambah produk</h2><form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}><select value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })} style={inputStyle}><option>Shopee</option><option>Tokopedia</option><option>TikTok Shop</option><option>Lazada</option><option>Manual</option></select><input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Nama produk" style={inputStyle} /><input value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} type="number" min="0" placeholder="Modal per produk" style={inputStyle} /><input value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} type="number" min="0" placeholder="Harga jual" style={inputStyle} /><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><input value={form.stockInitial} onChange={(e) => setForm({ ...form, stockInitial: e.target.value })} type="number" min="0" placeholder="Stok awal" style={inputStyle} /><input value={form.quantitySold} onChange={(e) => setForm({ ...form, quantitySold: e.target.value })} type="number" min="0" placeholder="Terjual" style={inputStyle} /></div><input value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya lain" style={inputStyle} /><button disabled={loading} style={{ ...ctaButtonStyle, opacity: loading ? 0.7 : 1 }}>{loading ? "Menyimpan..." : "Simpan produk"}</button></form></section><section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><div><Badge label="Daftar Produk" tone="blue" /><h2 style={{ margin: "8px 0 0" }}>Ranking profit dan risiko</h2></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{([ ["all", "Semua"], ["loss", "Rugi"], ["fix", "Optimasi"], ["scale", "Scale"], ["stock", "Stok"] ] as const).map(([key, label]) => <button key={key} onClick={() => setSelectedFilter(key)} style={{ ...ghostButtonStyle, color: selectedFilter === key ? "#86efac" : "#f8fafc" }}>{label}</button>)}</div></div><div className="desktop-table">{renderProductTable("product")}</div>{renderMobileProductCards()}</section></div>}

      {activeTab === "cashflow" && <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 18 }}><section style={cardStyle}><Badge label="Expense Tracker" tone="warning" /><h2>Catat biaya operasional</h2><form onSubmit={addExpense} style={{ display: "grid", gap: 12 }}><input value={expenseForm.label} onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })} placeholder="Nama biaya" style={inputStyle} /><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} style={inputStyle}><option>Ads</option><option>Fee marketplace</option><option>Packing</option><option>Gaji</option><option>Ops</option></select><input value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} type="number" min="0" placeholder="Nominal" style={inputStyle} /><button style={ctaButtonStyle}>Tambah biaya</button></form></section><section style={cardStyle}><Badge label="Cashflow" tone={netCash >= 0 ? "success" : "danger"} /><h2 style={{ margin: "10px 0" }}>{money(netCash)} cashflow bersih</h2><div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}><StatCard label="Uang masuk" value={money(totalRevenue)} helper="Dari sales produk" tone="blue" /><StatCard label="Profit produk" value={money(totalProfit)} helper="Sebelum biaya operasional" tone="green" /><StatCard label="Uang keluar" value={money(totalExpenses)} helper="Ads, fee, packing, ops" tone="yellow" /></div><div style={{ display: "grid", gap: 10 }}>{expenses.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: 14, borderRadius: 14, background: "rgba(2,6,23,0.52)", border: "1px solid rgba(148,163,184,0.10)" }}><div><strong>{item.label}</strong><div style={{ color: "#94a3b8", fontSize: 12 }}>{item.category} · {item.date}</div></div><strong>{money(item.amount)}</strong></div>)}</div></section></div>}

      {activeTab === "inventory" && <div style={{ display: "grid", gap: 18 }}><section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}><StatCard label="Total SKU" value={products.length} helper="Produk aktif" tone="blue" /><StatCard label="Total stok" value={totalStock} helper="Unit tersedia" tone="green" /><StatCard label="Stok kritis" value={lowStockProducts.length + outOfStockProducts.length} helper="Perlu perhatian" tone={lowStockProducts.length + outOfStockProducts.length ? "yellow" : "green"} /><StatCard label="Nilai inventory" value={money(inventoryValue)} helper="Modal di stok" tone="neutral" /></section><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.65fr 1.35fr", gap: 18 }}><div style={cardStyle}><Badge label="Stock Movement" tone="success" /><h2>Update stok</h2><p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Stok masuk, keluar manual, atau stok opname.</p><form onSubmit={applyStockMove} style={{ display: "grid", gap: 12 }}><select value={stockMove.productId} onChange={(e) => setStockMove({ ...stockMove, productId: e.target.value })} style={inputStyle}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={stockMove.type} onChange={(e) => setStockMove({ ...stockMove, type: e.target.value as StockMoveType })} style={inputStyle}><option value="in">Stok masuk / restock</option><option value="out">Stok keluar manual</option><option value="adjust">Set stok aktual</option></select><input value={stockMove.qty} onChange={(e) => setStockMove({ ...stockMove, qty: e.target.value })} type="number" min="0" placeholder="Jumlah" style={inputStyle} /><input value={stockMove.note} onChange={(e) => setStockMove({ ...stockMove, note: e.target.value })} placeholder="Catatan opsional" style={inputStyle} /><button style={ctaButtonStyle}>Update stok</button></form></div><div style={cardStyle}><Badge label="Inventory List" tone="blue" /><h2>Pantau stok kapan saja</h2><div className="desktop-table">{renderProductTable("inventory")}</div>{renderMobileProductCards()}</div></section></div>}

      {activeTab === "sales" && <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 18 }}><section style={cardStyle}><Badge label="Sales" tone="success" /><h2>Catat penjualan</h2><p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Penjualan otomatis mengurangi stok dan update profit.</p><form onSubmit={recordSale} style={{ display: "grid", gap: 12 }}><select value={saleForm.productId} onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })} style={inputStyle}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} - stok {item.stockRemaining}</option>)}</select><input value={saleForm.qty} onChange={(e) => setSaleForm({ ...saleForm, qty: e.target.value })} type="number" min="1" placeholder="Qty terjual" style={inputStyle} /><input value={saleForm.otherCost} onChange={(e) => setSaleForm({ ...saleForm, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya tambahan transaksi" style={inputStyle} /><button style={ctaButtonStyle}>Simpan penjualan</button></form></section><section style={cardStyle}><Badge label="Sales Performance" tone="blue" /><h2>{totalUnits} unit terjual</h2><div className="desktop-table">{renderProductTable("product")}</div>{renderMobileProductCards()}</section></div>}

      {activeTab === "ai" && <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18 }}><div style={cardStyle}><Badge label="Real Business Insights" tone="success" /><h2>Tanya keputusan bisnis</h2><textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} rows={7} placeholder="Contoh: produk mana yang harus saya restock, stop, atau scale minggu ini?" style={{ ...inputStyle, resize: "vertical" }} /><button onClick={askAiCfo} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Generate Action Plan</button>{!isPro && <p style={{ color: "#94a3b8", fontSize: 13 }}>Free melihat ringkasan. PRO membuka diagnosis lengkap dan export.</p>}</div><div style={cardStyle}><Badge label="Jawaban Insight" tone="blue" /><pre style={{ whiteSpace: "pre-wrap", color: "#dbeafe", lineHeight: 1.72, fontFamily: "inherit", margin: "16px 0 0" }}>{aiAnswer}</pre></div></section>}

      {activeTab === "goals" && <section style={cardStyle}><Badge label="Goal Tracker" tone="success" /><h2>Target bisnis bulan ini</h2><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{goals.map((goal) => { const value = (goal.current / Math.max(goal.target, 1)) * 100; return <div key={goal.id} style={{ padding: 18, borderRadius: 18, background: "rgba(2,6,23,0.52)", border: "1px solid rgba(148,163,184,0.10)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><div><strong>{goal.label}</strong><div style={{ color: "#94a3b8", fontSize: 12 }}>{goal.period}</div></div><strong>{Math.round(value)}%</strong></div><div style={{ margin: "18px 0 10px" }}><Progress value={value} /></div><small style={{ color: "#94a3b8" }}>{money(goal.current)} dari {money(goal.target)}</small></div>; })}</div></section>}

      {activeTab === "pricing" && <section style={cardStyle}><Badge label="Plans" tone="success" /><h2 style={{ margin: "12px 0", fontSize: 32 }}>Untungin.ai PRO untuk seller online</h2><p style={{ color: "#cbd5e1", lineHeight: 1.75, maxWidth: 820 }}>Akses unlimited produk, multi marketplace import, cashflow, AI insights, inventory center, export laporan, dan goal tracker.</p><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}><div style={{ padding: 20, borderRadius: 20, background: "rgba(2,6,23,0.64)", border: "1px solid rgba(148,163,184,0.12)" }}><h3>PRO Bulanan</h3><h2 style={{ color: "#86efac" }}>{MONTHLY_PRICE}</h2><p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Cocok untuk mulai pakai fitur lengkap selama 1 bulan.</p><button onClick={() => openUpgradeModal("monthly")} style={ctaButtonStyle}>Pilih Bulanan</button></div><div style={{ padding: 20, borderRadius: 20, background: "rgba(6,78,59,0.24)", border: "1px solid rgba(34,197,94,0.22)" }}><h3>PRO Lifetime</h3><h2 style={{ color: "#86efac" }}>{LIFETIME_PRICE}</h2><p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>Sekali bayar untuk membuka fitur PRO tanpa biaya bulanan.</p><button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>Pilih Lifetime</button></div></div></section>}

      <footer style={{ marginTop: 30, padding: "24px 0", borderTop: "1px solid rgba(148,163,184,0.08)", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", color: "#64748b", fontSize: 14 }}><div>© 2026 Untungin.ai · Built for Indonesian marketplace sellers</div><div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}><span>Privacy</span><span>Terms</span><span>Support</span><span>Midtrans Payment</span></div></footer><div className="sticky-spacer" /></section></main>;
}

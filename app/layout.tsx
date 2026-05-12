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
type Tone = "success" | "warning" | "danger" | "blue" | "muted" | "neutral";

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

const navItems: { key: TabKey; label: string; icon: string; desc: string }[] = [
  { key: "overview", label: "Overview", icon: "◎", desc: "Ringkasan bisnis" },
  { key: "products", label: "Produk", icon: "□", desc: "Produk & margin" },
  { key: "cashflow", label: "Cashflow", icon: "↕", desc: "Masuk & keluar" },
  { key: "inventory", label: "Inventory", icon: "▦", desc: "Stok & restock" },
  { key: "sales", label: "Penjualan", icon: "✓", desc: "Catat order" },
  { key: "ai", label: "Insight", icon: "✦", desc: "Rekomendasi" },
  { key: "goals", label: "Target", icon: "◌", desc: "Goal tracker" },
  { key: "pricing", label: "Plans", icon: "◇", desc: "Upgrade PRO" },
];

function money(value: number) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

function compactMoney(value: number) {
  const abs = Math.abs(value || 0);
  if (abs >= 1000000000) return `Rp${(value / 1000000000).toFixed(1).replace(".0", "")}M`;
  if (abs >= 1000000) return `Rp${(value / 1000000).toFixed(1).replace(".0", "")}jt`;
  if (abs >= 1000) return `Rp${(value / 1000).toFixed(0)}rb`;
  return money(value);
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

  return {
    id: row.id,
    name: row.name || "Produk Tanpa Nama",
    costPrice,
    sellingPrice,
    quantitySold,
    stockInitial,
    stockRemaining,
    otherCost,
    profit,
    margin,
    marketplace: row.marketplace || "Manual",
  };
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
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "Terjadi error tidak dikenal.";
  }
}

function getHealth(item: Product) {
  if (item.profit < 0) return { label: "Rugi", tone: "danger" as Tone };
  if (item.margin < 10) return { label: "Kritis", tone: "warning" as Tone };
  if (item.margin < 20) return { label: "Optimasi", tone: "warning" as Tone };
  return { label: "Sehat", tone: "success" as Tone };
}

function getStockStatus(item: Product) {
  if (item.stockInitial <= 0) return { label: "Belum diisi", tone: "muted" as Tone };
  const rate = (item.stockRemaining / Math.max(item.stockInitial, 1)) * 100;
  if (item.stockRemaining <= 0) return { label: "Habis", tone: "danger" as Tone };
  if (item.stockRemaining <= 5 || rate <= 15) return { label: "Menipis", tone: "warning" as Tone };
  return { label: "Aman", tone: "success" as Tone };
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

function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const palette = {
    success: { color: "#16a34a", bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.22)" },
    warning: { color: "#ca8a04", bg: "rgba(202,138,4,0.10)", border: "rgba(202,138,4,0.22)" },
    danger: { color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.22)" },
    blue: { color: "#2563eb", bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.22)" },
    neutral: { color: "#334155", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.16)" },
    muted: { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.14)" },
  }[tone];
  return (
    <span className="badge" style={{ color: palette.color, background: palette.bg, borderColor: palette.border }}>
      {label}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◇</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const width = clamp(value, 0, 100);
  return (
    <div className="progress">
      <div style={{ width: `${width}%` }} />
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 280;
  const height = 88;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData.map((value, index) => `${(index / Math.max(safeData.length - 1, 1)) * width},${height - ((value - min) / range) * height}`).join(" ");
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <polygon points={fillPoints} fill="url(#sparkFill)" />
      <polyline fill="none" stroke="rgba(15,23,42,0.12)" strokeWidth="10" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="none" stroke="#0f766e" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(20,184,166,0.18)" />
          <stop offset="100%" stopColor="rgba(20,184,166,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-meta">
            <span>{item.label}</span>
            <strong>{compactMoney(item.value)}</strong>
          </div>
          <div className="bar-track">
            <div className={item.value < 0 ? "negative" : "positive"} style={{ width: `${Math.max((Math.abs(item.value) / max) * 100, 4)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ value, label }: { value: number; label: string }) {
  const safe = clamp(value, 0, 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dash = (safe / 100) * circumference;
  return (
    <div className="donut-card">
      <svg viewBox="0 0 100 100" className="donut">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="9" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#0f766e" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} transform="rotate(-90 50 50)" />
      </svg>
      <div>
        <strong>{Math.round(safe)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [goals] = useState<Goal[]>(DEMO_GOALS);
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
  const [aiAnswer, setAiAnswer] = useState("Klik Generate untuk mendapatkan insight berbasis profit, stok, cashflow, margin, dan target.");
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "", otherCost: "" });
  const [expenseForm, setExpenseForm] = useState({ label: "", category: "Ops", amount: "" });
  const [form, setForm] = useState({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "Shopee" });

  const isPro = isProfilePro(profile);
  const proExpired = isProfileExpired(profile);
  const activeNav = navItems.find((item) => item.key === activeTab) ?? navItems[0];

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

  const marketplaceData = useMemo(() => {
    const totals = products.reduce<Record<string, number>>((acc, item) => {
      const key = item.marketplace || "Manual";
      acc[key] = (acc[key] || 0) + item.profit;
      return acc;
    }, {});
    const rows = Object.entries(totals).map(([label, value]) => ({ label, value }));
    return rows.length ? rows : [{ label: "Belum ada data", value: 0 }];
  }, [products]);

  const profitLeak = products.reduce((acc, item) => {
    if (item.margin >= 20) return acc;
    const safeProfit = item.sellingPrice * item.quantitySold * 0.2 - item.otherCost;
    return acc + Math.max(0, safeProfit - item.profit);
  }, 0);
  const dailyLeakEstimate = Math.max(Math.round(Math.max(profitLeak * 4, products.length * 50000) / 30), products.length * 2500);
  const riskScore = clamp(Math.round((lossProducts.length / Math.max(products.length, 1)) * 40 + (products.filter((item) => item.margin < 15).length / Math.max(products.length, 1)) * 28 + (lowStockProducts.length + outOfStockProducts.length > 0 ? 16 : 0) + (netCash < 0 ? 16 : 0)), 0, 100);
  const oneThingAction = lossProducts[0] ? `Evaluasi ${lossProducts[0].name} sebelum tambah stok.` : lowStockProducts[0] ? `Siapkan restock ${lowStockProducts[0].name}.` : bestProduct ? `Scale bertahap ${bestProduct.name}.` : "Tambahkan produk pertama untuk mulai analisis.";
  const sparklineData = [0, totalProfit * 0.3, totalProfit * 0.58, totalProfit * 0.76, totalProfit];

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
        setCurrentUserId("demo-user");
        setUserEmail(null);
        setProducts(DEMO_PRODUCTS);
        setProfile({ role: "user", plan: "free", pro_until: null, email: null });
        setIsDemoMode(true);
        setPageLoading(false);
        return;
      }

      if (!isMounted) return;
      setCurrentUserId(user.id);
      setUserEmail(user.email ?? null);
      setIsDemoMode(false);

      const { data: profileData } = await db.from("profiles").select("role, plan, pro_until, email").eq("email", user.email).maybeSingle();
      if (!isMounted) return;
      setProfile((profileData as Profile | null) ?? { role: "user", plan: "free", pro_until: null, email: user.email });

      const { data: productData, error: productError } = await db.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!isMounted) return;
      if (productError) {
        console.error(productError);
        alert("Gagal mengambil data produk dari database.");
      } else {
        setProducts(((productData || []) as ProductRow[]).map(mapProductRow));
      }
      setPageLoading(false);
    }

    loadUserAndProducts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        loadUserAndProducts();
        return;
      }
      if (event === "SIGNED_OUT" || !session?.user) {
        setCurrentUserId("demo-user");
        setUserEmail(null);
        setProducts(DEMO_PRODUCTS);
        setProfile({ role: "user", plan: "free", pro_until: null, email: null });
        setIsDemoMode(true);
        setPageLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  function ensureLoggedIn() {
    if (!currentUserId) {
      alert("Harus login dulu supaya data tersimpan.");
      return false;
    }
    return true;
  }

  function openUpgradeModal(plan: UpgradePlan = "lifetime") {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  }

  async function handleUpgradeMidtrans(plan: UpgradePlan = selectedPlan) {
    if (!ensureLoggedIn()) return;
    if (MIDTRANS_REVIEW_MODE) {
      alert("Midtrans sedang review. Silakan coba lagi nanti.");
      return;
    }
    if (!userEmail) {
      alert("Email user tidak ditemukan. Coba logout lalu login ulang.");
      return;
    }

    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, plan, amount: getPlanAmount(plan) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(data?.error || data));
      if (!data?.token) throw new Error("Token pembayaran Midtrans tidak ditemukan dari server.");
      if (!window.snap?.pay) throw new Error("Midtrans Snap belum siap. Refresh halaman lalu coba lagi.");
      window.snap.pay(data.token, {
        onSuccess: () => {
          alert("Pembayaran berhasil. PRO akan aktif otomatis setelah webhook diproses.");
          window.location.reload();
        },
        onPending: () => {
          alert("Pembayaran masih pending. Selesaikan pembayaran lalu refresh dashboard.");
          setUpgradeLoading(false);
        },
        onError: (error: unknown) => {
          alert(`Pembayaran gagal: ${getErrorMessage(error)}`);
          setUpgradeLoading(false);
        },
        onClose: () => setUpgradeLoading(false),
      });
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
      setUpgradeLoading(false);
    }
  }

  async function persistProductUpdate(productId: string, patch: Partial<Product>) {
    if (isDemoMode) {
      setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, ...patch } : item)));
      return true;
    }
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
    if (error) {
      console.error(error);
      alert("Gagal update database.");
      return false;
    }
    setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, ...patch } : item)));
    return true;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setUserEmail(null);
    setProducts([]);
    setProfile(null);
    router.replace("/login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureLoggedIn()) return;
    if (!isPro && products.length >= FREE_PRODUCT_LIMIT) {
      openUpgradeModal("lifetime");
      return;
    }
    const name = form.productName.trim();
    const costPrice = parseNumber(form.costPrice);
    const sellingPrice = parseNumber(form.sellingPrice);
    const stockInitial = parseNumber(form.stockInitial);
    const quantitySold = parseNumber(form.quantitySold);
    const otherCost = parseNumber(form.otherCost);
    if (!name || costPrice < 0 || sellingPrice <= 0 || stockInitial < 0 || quantitySold < 0 || quantitySold > stockInitial || otherCost < 0) {
      alert("Cek lagi input. Nama, harga jual, stok, dan terjual harus valid.");
      return;
    }
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
      setForm({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "Shopee" });
      setActiveTab("overview");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan produk.");
    } finally {
      setLoading(false);
    }
  }

  async function recordSale(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((item) => item.id === saleForm.productId);
    if (!product) {
      alert("Pilih produk dulu.");
      return;
    }
    const qty = parseNumber(saleForm.qty);
    const extraCost = parseNumber(saleForm.otherCost);
    if (qty <= 0) {
      alert("Qty penjualan harus lebih dari 0.");
      return;
    }
    if (qty > product.stockRemaining) {
      alert("Qty penjualan melebihi stok tersedia.");
      return;
    }
    const quantitySold = product.quantitySold + qty;
    const stockRemaining = Math.max(product.stockRemaining - qty, 0);
    const otherCost = product.otherCost + extraCost;
    const profit = calculateProfit({ costPrice: product.costPrice, sellingPrice: product.sellingPrice, quantitySold, otherCost });
    const margin = calculateMargin(product.costPrice, product.sellingPrice);
    const ok = await persistProductUpdate(product.id, { quantitySold, stockRemaining, otherCost, profit, margin });
    if (ok) {
      setSaleForm({ productId: product.id, qty: "", otherCost: "" });
      alert("Penjualan tersimpan. Stok otomatis berkurang dan profit ikut update.");
    }
  }

  async function applyStockMove(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((item) => item.id === stockMove.productId);
    if (!product) {
      alert("Pilih produk dulu.");
      return;
    }
    const qty = parseNumber(stockMove.qty);
    if (qty < 0 || (stockMove.type !== "adjust" && qty <= 0)) {
      alert("Jumlah stok tidak valid.");
      return;
    }
    let stockInitial = product.stockInitial;
    let stockRemaining = product.stockRemaining;
    if (stockMove.type === "in") {
      stockInitial += qty;
      stockRemaining += qty;
    } else if (stockMove.type === "out") {
      stockRemaining = Math.max(stockRemaining - qty, 0);
    } else {
      stockRemaining = qty;
      stockInitial = Math.max(stockInitial, qty + product.quantitySold);
    }
    const ok = await persistProductUpdate(product.id, { stockInitial, stockRemaining });
    if (ok) {
      setStockMove({ productId: product.id, type: "in", qty: "", note: "" });
      alert("Stok berhasil diperbarui.");
    }
  }

  async function deleteProduct(id: string) {
    if (!ensureLoggedIn()) return;
    if (!window.confirm("Hapus produk ini?")) return;
    if (isDemoMode) {
      setProducts((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    const { error } = await db.from("products").delete().eq("id", id).eq("user_id", currentUserId);
    if (error) {
      console.error(error);
      alert("Gagal menghapus produk.");
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseNumber(expenseForm.amount);
    if (!expenseForm.label.trim() || amount <= 0) {
      alert("Isi nama dan nominal biaya.");
      return;
    }
    setExpenses((prev) => [{ id: `exp-${Date.now()}`, label: expenseForm.label.trim(), category: expenseForm.category, amount, date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setExpenseForm({ label: "", category: "Ops", amount: "" });
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ensureLoggedIn()) {
      e.target.value = "";
      return;
    }
    setSyncing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, unknown>[];
        const remainingSlot = isPro ? rows.length : FREE_PRODUCT_LIMIT - products.length;
        if (remainingSlot <= 0) {
          openUpgradeModal("lifetime");
          e.target.value = "";
          setSyncing(false);
          return;
        }
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
          else {
            const { data, error } = await db.from("products").insert(imported as any).select("*");
            if (error) throw error;
            if (data) setProducts((prev) => [...(data as ProductRow[]).map(mapProductRow), ...prev]);
          }
          setLastSync(new Date().toLocaleString("id-ID"));
          alert(`Berhasil import ${imported.length} produk.`);
        } catch (error) {
          console.error(error);
          alert("Gagal import CSV ke database.");
        } finally {
          e.target.value = "";
          setSyncing(false);
        }
      },
      error: (error) => {
        console.error(error);
        alert("Gagal membaca file CSV.");
        e.target.value = "";
        setSyncing(false);
      },
    });
  }

  function exportReportCSV() {
    if (!isPro) {
      openUpgradeModal("lifetime");
      return;
    }
    if (products.length === 0) {
      alert("Belum ada produk untuk export.");
      return;
    }
    const headers = ["Nama Produk", "Marketplace", "Modal", "Harga Jual", "Terjual", "Stok", "Biaya Lain", "Profit", "Margin", "Keputusan", "Harga Aman", "Restock"];
    const rows = actionPlan.map((item) => [item.name, item.marketplace || "Manual", item.costPrice, item.sellingPrice, item.quantitySold, item.stockRemaining, item.otherCost, item.profit, `${item.margin.toFixed(1)}%`, item.decision, item.recommendedPrice, item.restock]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `untungin-ai-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function askAiCfo() {
    if (products.length === 0) {
      setAiAnswer("Tambahkan minimal 1 produk dulu agar insight bisa membaca profit, stok, margin, dan cashflow.");
      return;
    }
    const stockLines = [...lowStockProducts, ...outOfStockProducts].slice(0, 5).map((item) => `- ${item.name}: stok ${item.stockRemaining}, saran ${getRestockRecommendation(item)}`).join("\n") || "- Tidak ada stok kritis.";
    const priceLines = actionPlan.slice(0, 6).map((item) => `- ${item.name}: ${item.decision}; harga aman ${money(item.recommendedPrice)}; margin ${percent(item.margin)}; ${item.restock}.`).join("\n");
    const lossLine = worstProduct ? `${worstProduct.name} adalah produk dengan performa terendah (${money(worstProduct.profit)}).` : "Belum ada produk terendah.";
    const question = aiQuestion.trim() || "Buat ringkasan bisnis hari ini.";
    setAiAnswer(`Pertanyaan:\n${question}\n\nRingkasan eksekutif:\nOmzet ${money(totalRevenue)}, profit produk ${money(totalProfit)}, biaya operasional ${money(totalExpenses)}, cashflow bersih ${money(netCash)}, margin rata-rata ${percent(avgMargin)}, inventory value ${money(inventoryValue)}.\n\nPrioritas hari ini:\n${oneThingAction}\n\nRisiko utama:\nRisk score ${riskScore}/100. ${lossLine} Estimasi profit leak ${money(dailyLeakEstimate)} per hari jika produk margin tipis tidak diperbaiki.\n\nKontrol stok:\n${stockLines}\n\nPricing dan scale plan:\n${priceLines}\n\nKeputusan:\nScale hanya produk profit positif dengan margin minimal 20%. Tahan restock produk rugi atau margin di bawah 10%. Catat semua biaya operasional agar cashflow tidak terlihat semu.`);
  }

  function StatCard({ label, value, helper, tone = "success" }: { label: string; value: React.ReactNode; helper: string; tone?: Tone }) {
    return (
      <article className={`stat-card tone-${tone}`}>
        <p>{label}</p>
        <h2>{value}</h2>
        <small>{helper}</small>
      </article>
    );
  }

  function renderProductTable(mode: "product" | "inventory" = "product") {
    if (filteredProducts.length === 0) return <EmptyState title="Belum ada produk" description="Tambahkan produk manual atau import CSV untuk mulai membaca profit dan stok." />;
    return (
      <div className="table-wrap desktop-table">
        <table>
          <thead>
            <tr>
              {["Produk", "Marketplace", "Harga", "Profit", "Stok", "Terjual", mode === "inventory" ? "Estimasi" : "Margin", "Status", "Aksi"].map((head) => (
                <th key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => {
              const health = getHealth(item);
              const stock = getStockStatus(item);
              const dayLeft = daysUntilOut(item);
              const safePrice = recommendedPrice(item);
              const restock = getRestockRecommendation(item);
              return (
                <tr key={item.id}>
                  <td className="product-cell">
                    <strong>{item.name}</strong>
                    <div className="row-badges">
                      <Badge label={health.label} tone={health.tone} />
                      <Badge label={stock.label} tone={stock.tone} />
                    </div>
                    <small>{productDecision(item)} · Harga aman <b>{money(safePrice)}</b></small>
                  </td>
                  <td><Badge label={item.marketplace || "Manual"} tone="blue" /></td>
                  <td><span>Jual</span><strong>{money(item.sellingPrice)}</strong></td>
                  <td><span>Profit</span><strong className={item.profit >= 0 ? "positive-text" : "negative-text"}>{money(item.profit)}</strong></td>
                  <td><span>Stok</span><strong>{item.stockRemaining}</strong></td>
                  <td><span>Sold</span><strong>{item.quantitySold}</strong></td>
                  <td className="metric-cell">
                    {mode === "inventory" ? (
                      <><span>Habis</span><strong>{dayLeft === null ? "-" : `${dayLeft} hari`}</strong></>
                    ) : (
                      <><span>Margin</span><strong>{percent(item.margin)}</strong><Progress value={(Math.min(item.margin, 60) / 60) * 100} /></>
                    )}
                  </td>
                  <td><Badge label={restock} tone={restock.toLowerCase().includes("restock") ? "success" : "muted"} /></td>
                  <td>
                    <div className="actions">
                      <button onClick={() => { setStockMove((prev) => ({ ...prev, productId: item.id })); setActiveTab("inventory"); }}>Stok</button>
                      <button onClick={() => { setSaleForm((prev) => ({ ...prev, productId: item.id })); setActiveTab("sales"); }}>Jual</button>
                      <button className="danger" onClick={() => deleteProduct(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderMobileProductCards() {
    if (filteredProducts.length === 0) return <EmptyState title="Belum ada produk" description="Tambah produk atau import CSV." />;
    return (
      <div className="mobile-cards">
        {filteredProducts.map((item) => (
          <article className="mobile-product" key={item.id}>
            <div className="mobile-product-head">
              <div>
                <strong>{item.name}</strong>
                <small>{item.marketplace || "Manual"}</small>
              </div>
              <Badge label={getHealth(item).label} tone={getHealth(item).tone} />
            </div>
            <div className="mobile-metrics">
              <div><span>Profit</span><b className={item.profit >= 0 ? "positive-text" : "negative-text"}>{money(item.profit)}</b></div>
              <div><span>Margin</span><b>{percent(item.margin)}</b></div>
              <div><span>Stok</span><b>{item.stockRemaining}</b></div>
              <div><span>Keputusan</span><b>{productDecision(item)}</b></div>
            </div>
            <div className="mobile-actions">
              <button onClick={() => setActiveTab("inventory")}>Update stok</button>
              <button onClick={() => setActiveTab("sales")}>Catat jual</button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (pageLoading) {
    return (
      <main className="loading-screen">
        <div>
          <div className="loader" />
          <p>Loading Untungin.ai...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <style>{`
        :root {
          --bg: #f7f8fb;
          --panel: #ffffff;
          --panel-soft: #f1f5f9;
          --ink: #0f172a;
          --muted: #64748b;
          --muted-2: #94a3b8;
          --line: #e2e8f0;
          --line-soft: #edf2f7;
          --green: #0f766e;
          --green-2: #14b8a6;
          --red: #dc2626;
          --amber: #ca8a04;
          --blue: #2563eb;
          --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
          --radius: 22px;
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: var(--bg); }
        button, input, select, textarea { font: inherit; }
        button { transition: 150ms ease; }
        button:hover { transform: translateY(-1px); }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        .app-shell { min-height: 100vh; background: radial-gradient(circle at 10% 0%, rgba(20,184,166,0.08), transparent 32%), var(--bg); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
        .dashboard-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
        .sidebar { position: sticky; top: 0; height: 100vh; padding: 24px 18px; background: rgba(255,255,255,0.84); border-right: 1px solid var(--line); backdrop-filter: blur(18px); display: flex; flex-direction: column; gap: 20px; }
        .brand { display: flex; align-items: center; gap: 12px; padding: 0 8px; }
        .logo { width: 42px; height: 42px; border-radius: 14px; background: linear-gradient(135deg, var(--green), var(--green-2)); color: white; display: grid; place-items: center; font-weight: 900; box-shadow: 0 10px 25px rgba(15,118,110,0.18); }
        .brand strong { display: block; letter-spacing: -0.02em; }
        .brand span, .user-card span, .nav-item span, .section-kicker, .helper-text { color: var(--muted); font-size: 12px; }
        .sidebar-nav { display: grid; gap: 6px; }
        .nav-item { border: 0; background: transparent; color: var(--muted); padding: 11px 12px; border-radius: 14px; display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: center; text-align: left; cursor: pointer; }
        .nav-item:hover { background: var(--panel-soft); color: var(--ink); transform: none; }
        .nav-item.active { background: #0f172a; color: #ffffff; box-shadow: 0 14px 28px rgba(15,23,42,0.14); }
        .nav-item.active span { color: rgba(255,255,255,0.62); }
        .nav-icon { width: 28px; height: 28px; border-radius: 10px; background: rgba(100,116,139,0.12); display: grid; place-items: center; font-weight: 900; }
        .nav-copy strong { display: block; font-size: 14px; }
        .user-card { margin-top: auto; background: var(--panel-soft); border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: grid; gap: 12px; }
        .user-card strong { display: block; font-size: 14px; }
        .sidebar-cta { background: #0f172a; color: #fff; border: 0; border-radius: 14px; padding: 11px 12px; cursor: pointer; font-weight: 800; }
        .main { min-width: 0; padding: 22px; }
        .topbar { height: 66px; border: 1px solid var(--line); border-radius: 22px; background: rgba(255,255,255,0.86); backdrop-filter: blur(18px); display: flex; align-items: center; justify-content: space-between; padding: 0 18px; margin-bottom: 18px; position: sticky; top: 16px; z-index: 30; box-shadow: 0 12px 40px rgba(15,23,42,0.05); }
        .top-title strong { display: block; font-size: 15px; }
        .top-title span { color: var(--muted); font-size: 12px; }
        .top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .primary-btn, .secondary-btn, .danger-btn, .icon-btn { border-radius: 13px; padding: 10px 13px; font-weight: 800; cursor: pointer; border: 1px solid transparent; }
        .primary-btn { background: #0f172a; color: white; }
        .secondary-btn { background: white; color: var(--ink); border-color: var(--line); }
        .danger-btn { background: rgba(220,38,38,0.08); color: var(--red); border-color: rgba(220,38,38,0.16); }
        .icon-btn { width: 42px; height: 42px; padding: 0; background: white; color: var(--ink); border-color: var(--line); display: none; }
        .page-grid { display: grid; gap: 18px; }
        .hero-panel { background: linear-gradient(135deg, #0f172a, #133f3a); color: white; border-radius: 30px; padding: 28px; box-shadow: var(--shadow); display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 24px; align-items: center; overflow: hidden; position: relative; }
        .hero-panel:after { content: ''; position: absolute; width: 320px; height: 320px; border-radius: 999px; right: -120px; top: -160px; background: rgba(20,184,166,0.20); filter: blur(10px); }
        .hero-panel > * { position: relative; z-index: 2; }
        .hero-copy h1 { margin: 14px 0 10px; font-size: clamp(32px, 4vw, 58px); line-height: 0.98; letter-spacing: -0.06em; font-weight: 760; max-width: 720px; }
        .hero-copy p { margin: 0; color: rgba(255,255,255,0.74); font-size: 16px; line-height: 1.7; max-width: 640px; }
        .hero-actions { display: flex; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
        .hero-actions .primary-btn { background: white; color: #0f172a; }
        .hero-actions .secondary-btn { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.18); }
        .hero-chart { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); border-radius: 24px; padding: 20px; }
        .hero-chart p { margin: 0; color: rgba(255,255,255,0.62); font-size: 13px; }
        .hero-chart h2 { margin: 6px 0 8px; font-size: 36px; letter-spacing: -0.05em; font-weight: 720; }
        .hero-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .hero-chart-grid span { color: rgba(255,255,255,0.58); font-size: 12px; display: block; }
        .hero-chart-grid strong { color: #fff; }
        .badge { display: inline-flex; align-items: center; width: max-content; border-radius: 999px; padding: 5px 9px; border: 1px solid; font-size: 12px; font-weight: 760; line-height: 1; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .stat-card, .panel, .mobile-product { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
        .stat-card { padding: 18px; min-height: 126px; }
        .stat-card p { margin: 0; color: var(--muted); font-size: 13px; }
        .stat-card h2 { margin: 12px 0 10px; font-size: 28px; line-height: 1.1; letter-spacing: -0.04em; font-weight: 720; }
        .stat-card small { color: var(--muted); line-height: 1.45; }
        .tone-success h2 { color: var(--green); } .tone-danger h2 { color: var(--red); } .tone-warning h2 { color: var(--amber); } .tone-blue h2 { color: var(--blue); } .tone-neutral h2, .tone-muted h2 { color: var(--ink); }
        .content-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); gap: 18px; }
        .two-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .panel { padding: 20px; min-width: 0; }
        .panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .panel-title h2, .form-panel h2 { margin: 8px 0 0; font-size: 22px; letter-spacing: -0.04em; }
        .panel-title p { margin: 6px 0 0; color: var(--muted); line-height: 1.5; }
        .chart-grid { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 16px; align-items: center; }
        .bar-chart { display: grid; gap: 13px; }
        .bar-row { display: grid; gap: 6px; }
        .bar-meta { display: flex; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 13px; }
        .bar-meta strong { color: var(--ink); }
        .bar-track { height: 9px; background: var(--panel-soft); border-radius: 999px; overflow: hidden; }
        .bar-track div { height: 100%; border-radius: 999px; }
        .bar-track .positive { background: linear-gradient(90deg, var(--green), var(--green-2)); }
        .bar-track .negative { background: linear-gradient(90deg, #ef4444, #f97316); }
        .donut-card { display: grid; grid-template-columns: 92px 1fr; gap: 10px; align-items: center; background: var(--panel-soft); border: 1px solid var(--line); padding: 12px; border-radius: 18px; }
        .donut { width: 92px; height: 92px; }
        .donut-card strong { display: block; font-size: 24px; letter-spacing: -0.04em; }
        .donut-card span { color: var(--muted); font-size: 13px; }
        .sparkline { width: 100%; height: 88px; overflow: visible; }
        .table-toolbar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .table-toolbar button, .actions button, .mobile-actions button { border: 1px solid var(--line); background: white; color: var(--ink); border-radius: 12px; padding: 8px 11px; font-weight: 760; cursor: pointer; }
        .table-toolbar button.active { color: var(--green); border-color: rgba(15,118,110,0.26); background: rgba(15,118,110,0.08); }
        .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 18px; background: white; }
        table { width: 100%; min-width: 980px; border-collapse: collapse; }
        th { text-align: left; padding: 14px 16px; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid var(--line); white-space: nowrap; }
        td { padding: 16px; border-bottom: 1px solid var(--line-soft); vertical-align: middle; }
        tbody tr:hover { background: #fbfdff; }
        td span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
        td strong { display: block; }
        .product-cell { min-width: 240px; }
        .product-cell small { display: block; color: var(--muted); margin-top: 8px; line-height: 1.45; }
        .product-cell small b { color: var(--ink); }
        .row-badges { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 8px; }
        .metric-cell { min-width: 150px; }
        .actions { display: flex; gap: 7px; flex-wrap: wrap; }
        .actions button { padding: 7px 10px; font-size: 12px; }
        .actions button.danger { color: var(--red); background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.16); }
        .positive-text { color: var(--green); } .negative-text { color: var(--red); }
        .progress { height: 8px; border-radius: 999px; background: var(--panel-soft); overflow: hidden; margin-top: 8px; }
        .progress div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--green), var(--green-2)); }
        .form-panel { background: white; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; }
        .form-panel form { display: grid; gap: 12px; margin-top: 16px; }
        .input { width: 100%; padding: 12px 13px; border-radius: 13px; border: 1px solid var(--line); background: white; color: var(--ink); outline: none; font-size: 14px; }
        .input:focus { border-color: rgba(15,118,110,0.42); box-shadow: 0 0 0 4px rgba(20,184,166,0.10); }
        textarea.input { resize: vertical; line-height: 1.6; }
        .expense-list { display: grid; gap: 10px; }
        .expense-item { display: flex; justify-content: space-between; gap: 14px; padding: 14px; border: 1px solid var(--line); background: #fbfdff; border-radius: 16px; }
        .expense-item small { color: var(--muted); }
        .mobile-cards { display: none; gap: 12px; }
        .mobile-product { padding: 16px; }
        .mobile-product-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
        .mobile-product-head small { display: block; margin-top: 4px; color: var(--muted); }
        .mobile-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .mobile-metrics span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
        .mobile-actions { display: flex; gap: 8px; margin-top: 14px; }
        .mobile-actions button { flex: 1; }
        .empty-state { padding: 46px 18px; text-align: center; color: var(--muted); }
        .empty-icon { width: 44px; height: 44px; border-radius: 15px; margin: 0 auto 12px; display: grid; place-items: center; background: var(--panel-soft); color: var(--green); }
        .empty-state h3 { margin: 0 0 8px; color: var(--ink); }
        .empty-state p { margin: 0; line-height: 1.6; }
        .modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(15,23,42,0.60); display: grid; place-items: center; padding: 20px; backdrop-filter: blur(10px); }
        .modal { width: min(650px, 100%); background: white; border-radius: 26px; border: 1px solid var(--line); box-shadow: 0 28px 80px rgba(15,23,42,0.24); padding: 22px; }
        .modal-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .modal h2 { margin: 12px 0 8px; letter-spacing: -0.04em; }
        .modal p { color: var(--muted); line-height: 1.65; }
        .plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .plan-card { border: 1px solid var(--line); background: #fbfdff; border-radius: 18px; padding: 16px; cursor: pointer; text-align: left; }
        .plan-card.active { border-color: rgba(15,118,110,0.42); background: rgba(20,184,166,0.08); }
        .close-btn { border: 0; background: transparent; font-size: 26px; cursor: pointer; color: var(--muted); }
        .bottom-nav { display: none; }
        .loading-screen { min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--ink); font-family: Inter, Arial, sans-serif; }
        .loading-screen > div { text-align: center; }
        .loader { width: 44px; height: 44px; border-radius: 999px; border: 4px solid rgba(20,184,166,0.16); border-top-color: var(--green); margin: 0 auto 16px; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        footer { padding: 24px 0; color: var(--muted); font-size: 13px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
        footer div:last-child { display: flex; gap: 18px; flex-wrap: wrap; }
        @media (max-width: 1180px) { .dashboard-layout { grid-template-columns: 86px minmax(0, 1fr); } .sidebar { padding: 20px 12px; } .brand-copy, .nav-copy span, .user-card div, .user-card .sidebar-cta { display: none; } .nav-item { grid-template-columns: 1fr; justify-items: center; padding: 11px 8px; } .nav-copy strong { display: none; } .user-card { padding: 10px; } }
        @media (max-width: 980px) { .dashboard-layout { display: block; } .sidebar { display: none; } .main { padding: 14px; padding-bottom: 94px; } .topbar { top: 10px; height: auto; min-height: 60px; border-radius: 18px; padding: 10px 12px; } .icon-btn { display: grid; place-items: center; } .top-actions .secondary-btn, .top-actions .danger-btn { display: none; } .hero-panel, .content-grid, .two-grid, .chart-grid { grid-template-columns: 1fr; } .metrics-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } .hero-panel { padding: 22px; border-radius: 24px; } .hero-copy h1 { font-size: 38px; } .desktop-table { display: none; } .mobile-cards { display: grid; } .bottom-nav { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 80; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; background: rgba(255,255,255,0.88); border: 1px solid var(--line); border-radius: 20px; padding: 8px; box-shadow: 0 18px 50px rgba(15,23,42,0.18); backdrop-filter: blur(18px); } .bottom-nav button { border: 0; background: transparent; border-radius: 14px; padding: 9px 4px; display: grid; gap: 4px; justify-items: center; color: var(--muted); font-size: 11px; font-weight: 800; } .bottom-nav button.active { background: #0f172a; color: #fff; } .bottom-nav span { font-size: 15px; } }
        @media (max-width: 640px) { .metrics-grid { grid-template-columns: 1fr; } .hero-chart-grid, .plan-grid { grid-template-columns: 1fr; } .top-title span { display: none; } .stat-card h2 { font-size: 25px; } .panel, .form-panel { padding: 16px; border-radius: 18px; } .panel-header { display: grid; } .table-toolbar { justify-content: flex-start; } }
      `}</style>

      {showUpgradeModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <Badge label="Untungin.ai PRO" tone="success" />
                <h2>Buka insight lengkap untuk profit, cashflow, stok, dan pricing</h2>
              </div>
              <button className="close-btn" onClick={() => setShowUpgradeModal(false)}>×</button>
            </div>
            <p>PRO membuka unlimited produk, multi marketplace import, AI insights, export laporan, goal tracker, dan analisis cashflow.</p>
            <div className="plan-grid">
              {([
                ["monthly", "PRO Bulanan", MONTHLY_PRICE],
                ["lifetime", "PRO Lifetime", LIFETIME_PRICE],
              ] as const).map(([key, title, price]) => (
                <button key={key} onClick={() => setSelectedPlan(key)} className={`plan-card ${selectedPlan === key ? "active" : ""}`}>
                  <strong>{title}</strong><br />
                  <span className="positive-text">{price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => handleUpgradeMidtrans(selectedPlan)} disabled={upgradeLoading} className="primary-btn" style={{ width: "100%", marginTop: 16, opacity: upgradeLoading ? 0.7 : 1 }}>
              {upgradeLoading ? "Membuka pembayaran..." : "Bayar dengan Midtrans"}
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">U</div>
            <div className="brand-copy">
              <strong>Untungin.ai</strong>
              <span>Seller operating system</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button key={item.key} className={`nav-item ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
                <div className="nav-icon">{item.icon}</div>
                <div className="nav-copy">
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="user-card">
            <div>
              <span>Status akun</span>
              <strong>{isPro ? "PRO aktif" : proExpired ? "PRO expired" : "Free plan"}</strong>
            </div>
            {!isPro && <button className="sidebar-cta" onClick={() => openUpgradeModal("lifetime")}>Upgrade PRO</button>}
          </div>
        </aside>

        <section className="main">
          <header className="topbar">
            <div className="top-title">
              <strong>{activeNav.label}</strong>
              <span>{activeNav.desc} · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div className="top-actions">
              <Badge label={isPro ? "PRO" : proExpired ? "Expired" : "Free"} tone={isPro ? "success" : proExpired ? "danger" : "warning"} />
              <button className="secondary-btn" onClick={exportReportCSV}>Export</button>
              {!isPro && <button className="primary-btn" onClick={() => openUpgradeModal("lifetime")}>Upgrade</button>}
              <button className="danger-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          <div className="page-grid">
            <section className="hero-panel">
              <div className="hero-copy">
                <Badge label="Dashboard Operasional Seller" tone="success" />
                <h1>Profit jelas. Stok aman. Cashflow terkendali.</h1>
                <p>Satu workspace untuk membaca margin, inventory, pengeluaran, target, dan rekomendasi tindakan harian.</p>
                <div className="hero-actions">
                  <button className="primary-btn" onClick={() => setActiveTab("products")}>Tambah produk</button>
                  <button className="secondary-btn" onClick={() => setActiveTab("cashflow")}>Catat cashflow</button>
                  <label className="secondary-btn" style={{ cursor: "pointer" }}>
                    {syncing ? "Importing..." : "Import CSV"}
                    <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
                  </label>
                </div>
                {lastSync && <p style={{ marginTop: 12, fontSize: 12 }}>Last import: {lastSync}</p>}
              </div>
              <div className="hero-chart">
                <p>Cashflow bersih</p>
                <h2>{money(netCash)}</h2>
                <Sparkline data={sparklineData} />
                <div className="hero-chart-grid">
                  <div><span>Omzet</span><strong>{money(totalRevenue)}</strong></div>
                  <div><span>Inventory value</span><strong>{money(inventoryValue)}</strong></div>
                </div>
              </div>
            </section>

            {activeTab === "overview" && (
              <>
                <section className="metrics-grid">
                  <StatCard label="Omzet" value={money(totalRevenue)} helper={`${totalUnits} unit terjual`} tone="blue" />
                  <StatCard label="Profit produk" value={money(totalProfit)} helper={`Margin rata-rata ${percent(avgMargin)}`} tone={totalProfit >= 0 ? "success" : "danger"} />
                  <StatCard label="Cashflow bersih" value={money(netCash)} helper={`Biaya operasional ${money(totalExpenses)}`} tone={netCash >= 0 ? "success" : "danger"} />
                  <StatCard label="Risk score" value={`${riskScore}/100`} helper={`Estimasi bocor ${money(dailyLeakEstimate)} per hari`} tone={riskScore >= 50 ? "danger" : riskScore >= 25 ? "warning" : "success"} />
                </section>

                <section className="content-grid">
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title">
                        <Badge label="Rekomendasi Hari Ini" tone="success" />
                        <h2>{oneThingAction}</h2>
                        <p>Prioritas dihitung dari profit, margin, stok, dan cashflow agar keputusan tidak hanya berdasarkan omzet.</p>
                      </div>
                      <button className="secondary-btn" onClick={() => setActiveTab("ai")}>Lihat insight</button>
                    </div>
                    <div className="chart-grid">
                      <BarChart data={marketplaceData} />
                      <DonutChart value={100 - riskScore} label="Health score" />
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-title">
                      <Badge label="Inventory Health" tone="warning" />
                      <h2>{money(inventoryValue)} modal di stok</h2>
                      <p>Produk habis: {outOfStockProducts.length}. Stok menipis: {lowStockProducts.length}. Produk rugi: {lossProducts.length}.</p>
                    </div>
                    <div style={{ marginTop: 18 }}>
                      <BarChart data={[
                        { label: "Stock value", value: inventoryValue },
                        { label: "Profit", value: totalProfit },
                        { label: "Expenses", value: totalExpenses },
                      ]} />
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Badge label="Performa Produk" tone="blue" />
                      <h2>Profit, risiko, marketplace, dan stok</h2>
                    </div>
                    <button className="secondary-btn" onClick={() => setActiveTab("products")}>Lihat semua</button>
                  </div>
                  {renderProductTable("product")}
                  {renderMobileProductCards()}
                </section>
              </>
            )}

            {activeTab === "products" && (
              <section className="content-grid">
                <div className="form-panel">
                  <Badge label="Input Produk" tone="success" />
                  <h2>Tambah produk</h2>
                  <form onSubmit={handleSubmit}>
                    <select className="input" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })}>
                      <option>Shopee</option><option>Tokopedia</option><option>TikTok Shop</option><option>Lazada</option><option>Manual</option>
                    </select>
                    <input className="input" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Nama produk" />
                    <input className="input" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} type="number" min="0" placeholder="Modal per produk" />
                    <input className="input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} type="number" min="0" placeholder="Harga jual" />
                    <div className="two-grid"><input className="input" value={form.stockInitial} onChange={(e) => setForm({ ...form, stockInitial: e.target.value })} type="number" min="0" placeholder="Stok awal" /><input className="input" value={form.quantitySold} onChange={(e) => setForm({ ...form, quantitySold: e.target.value })} type="number" min="0" placeholder="Terjual" /></div>
                    <input className="input" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya lain" />
                    <button disabled={loading} className="primary-btn" style={{ opacity: loading ? 0.7 : 1 }}>{loading ? "Menyimpan..." : "Simpan produk"}</button>
                  </form>
                </div>
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title"><Badge label="Daftar Produk" tone="blue" /><h2>Ranking profit dan risiko</h2></div>
                    <div className="table-toolbar">
                      {([ ["all", "Semua"], ["loss", "Rugi"], ["fix", "Optimasi"], ["scale", "Scale"], ["stock", "Stok"] ] as const).map(([key, label]) => <button key={key} className={selectedFilter === key ? "active" : ""} onClick={() => setSelectedFilter(key)}>{label}</button>)}
                    </div>
                  </div>
                  {renderProductTable("product")}
                  {renderMobileProductCards()}
                </div>
              </section>
            )}

            {activeTab === "cashflow" && (
              <section className="content-grid">
                <div className="form-panel">
                  <Badge label="Expense Tracker" tone="warning" />
                  <h2>Catat biaya operasional</h2>
                  <form onSubmit={addExpense}>
                    <input className="input" value={expenseForm.label} onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })} placeholder="Nama biaya" />
                    <select className="input" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                      <option>Ads</option><option>Fee marketplace</option><option>Packing</option><option>Gaji</option><option>Ops</option>
                    </select>
                    <input className="input" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} type="number" min="0" placeholder="Nominal" />
                    <button className="primary-btn">Tambah biaya</button>
                  </form>
                </div>
                <div className="panel">
                  <div className="panel-title"><Badge label="Cashflow" tone={netCash >= 0 ? "success" : "danger"} /><h2>{money(netCash)} cashflow bersih</h2></div>
                  <div className="metrics-grid" style={{ margin: "16px 0", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                    <StatCard label="Uang masuk" value={compactMoney(totalRevenue)} helper="Dari sales produk" tone="blue" />
                    <StatCard label="Profit produk" value={compactMoney(totalProfit)} helper="Sebelum biaya ops" tone="success" />
                    <StatCard label="Uang keluar" value={compactMoney(totalExpenses)} helper="Ads, fee, packing" tone="warning" />
                  </div>
                  <div className="expense-list">
                    {expenses.map((item) => <div className="expense-item" key={item.id}><div><strong>{item.label}</strong><br /><small>{item.category} · {item.date}</small></div><strong>{money(item.amount)}</strong></div>)}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "inventory" && (
              <>
                <section className="metrics-grid">
                  <StatCard label="Total SKU" value={products.length} helper="Produk aktif" tone="blue" />
                  <StatCard label="Total stok" value={totalStock} helper="Unit tersedia" tone="success" />
                  <StatCard label="Stok kritis" value={lowStockProducts.length + outOfStockProducts.length} helper="Perlu perhatian" tone={lowStockProducts.length + outOfStockProducts.length ? "warning" : "success"} />
                  <StatCard label="Nilai inventory" value={money(inventoryValue)} helper="Modal di stok" tone="neutral" />
                </section>
                <section className="content-grid">
                  <div className="form-panel">
                    <Badge label="Stock Movement" tone="success" />
                    <h2>Update stok</h2>
                    <form onSubmit={applyStockMove}>
                      <select className="input" value={stockMove.productId} onChange={(e) => setStockMove({ ...stockMove, productId: e.target.value })}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                      <select className="input" value={stockMove.type} onChange={(e) => setStockMove({ ...stockMove, type: e.target.value as StockMoveType })}><option value="in">Stok masuk / restock</option><option value="out">Stok keluar manual</option><option value="adjust">Set stok aktual</option></select>
                      <input className="input" value={stockMove.qty} onChange={(e) => setStockMove({ ...stockMove, qty: e.target.value })} type="number" min="0" placeholder="Jumlah" />
                      <input className="input" value={stockMove.note} onChange={(e) => setStockMove({ ...stockMove, note: e.target.value })} placeholder="Catatan opsional" />
                      <button className="primary-btn">Update stok</button>
                    </form>
                  </div>
                  <div className="panel"><div className="panel-title"><Badge label="Inventory List" tone="blue" /><h2>Pantau stok kapan saja</h2></div><br />{renderProductTable("inventory")}{renderMobileProductCards()}</div>
                </section>
              </>
            )}

            {activeTab === "sales" && (
              <section className="content-grid">
                <div className="form-panel">
                  <Badge label="Sales" tone="success" />
                  <h2>Catat penjualan</h2>
                  <form onSubmit={recordSale}>
                    <select className="input" value={saleForm.productId} onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} - stok {item.stockRemaining}</option>)}</select>
                    <input className="input" value={saleForm.qty} onChange={(e) => setSaleForm({ ...saleForm, qty: e.target.value })} type="number" min="1" placeholder="Qty terjual" />
                    <input className="input" value={saleForm.otherCost} onChange={(e) => setSaleForm({ ...saleForm, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya tambahan transaksi" />
                    <button className="primary-btn">Simpan penjualan</button>
                  </form>
                </div>
                <div className="panel"><div className="panel-title"><Badge label="Sales Performance" tone="blue" /><h2>{totalUnits} unit terjual</h2></div><br />{renderProductTable("product")}{renderMobileProductCards()}</div>
              </section>
            )}

            {activeTab === "ai" && (
              <section className="content-grid">
                <div className="form-panel">
                  <Badge label="Real Business Insights" tone="success" />
                  <h2>Tanya keputusan bisnis</h2>
                  <form onSubmit={(e) => { e.preventDefault(); askAiCfo(); }}>
                    <textarea className="input" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} rows={7} placeholder="Contoh: produk mana yang harus saya restock, stop, atau scale minggu ini?" />
                    <button className="primary-btn">Generate Action Plan</button>
                  </form>
                  {!isPro && <p className="helper-text">Free melihat ringkasan. PRO membuka diagnosis lengkap dan export.</p>}
                </div>
                <div className="panel"><div className="panel-title"><Badge label="Jawaban Insight" tone="blue" /><h2>Action plan</h2></div><pre style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.72, fontFamily: "inherit", margin: "16px 0 0" }}>{aiAnswer}</pre></div>
              </section>
            )}

            {activeTab === "goals" && (
              <section className="panel">
                <div className="panel-title"><Badge label="Goal Tracker" tone="success" /><h2>Target bisnis bulan ini</h2></div><br />
                <div className="two-grid">
                  {goals.map((goal) => {
                    const value = (goal.current / Math.max(goal.target, 1)) * 100;
                    return <div key={goal.id} className="expense-item" style={{ display: "block" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><div><strong>{goal.label}</strong><br /><small>{goal.period}</small></div><strong>{Math.round(value)}%</strong></div><div style={{ margin: "18px 0 10px" }}><Progress value={value} /></div><small>{money(goal.current)} dari {money(goal.target)}</small></div>;
                  })}
                </div>
              </section>
            )}

            {activeTab === "pricing" && (
              <section className="panel">
                <div className="panel-title"><Badge label="Plans" tone="success" /><h2>Untungin.ai PRO untuk seller online</h2><p>Akses unlimited produk, multi marketplace import, cashflow, AI insights, inventory center, export laporan, dan goal tracker.</p></div>
                <div className="plan-grid">
                  <div className="plan-card"><h3>PRO Bulanan</h3><h2 className="positive-text">{MONTHLY_PRICE}</h2><p>Fitur lengkap selama 1 bulan.</p><button onClick={() => openUpgradeModal("monthly")} className="primary-btn">Pilih Bulanan</button></div>
                  <div className="plan-card active"><h3>PRO Lifetime</h3><h2 className="positive-text">{LIFETIME_PRICE}</h2><p>Sekali bayar untuk membuka fitur PRO tanpa biaya bulanan.</p><button onClick={() => openUpgradeModal("lifetime")} className="primary-btn">Pilih Lifetime</button></div>
                </div>
              </section>
            )}
          </div>

          <footer>
            <div>© 2026 Untungin.ai · Built for Indonesian marketplace sellers</div>
            <div><span>Privacy</span><span>Terms</span><span>Support</span><span>Midtrans Payment</span></div>
          </footer>
        </section>
      </div>

      <nav className="bottom-nav">
        {navItems.slice(0, 5).map((item) => (
          <button key={item.key} className={activeTab === item.key ? "active" : ""} onClick={() => setActiveTab(item.key)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}

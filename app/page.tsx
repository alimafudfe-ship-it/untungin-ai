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
  created_at?: string;
};

type Profile = {
  role?: string | null;
  plan?: string | null;
  pro_until?: string | null;
  email?: string | null;
};

type UpgradePlan = "monthly" | "lifetime";
type TabKey = "overview" | "products" | "inventory" | "sales" | "ai" | "pricing";
type ProductFilter = "all" | "loss" | "fix" | "scale" | "stock";
type StockMoveType = "in" | "out" | "adjust";

const FREE_PRODUCT_LIMIT = 3;
const MONTHLY_PRICE = "Rp29.000/bulan";
const LIFETIME_PRICE = "Rp99.000 sekali bayar";
const MIDTRANS_REVIEW_MODE = false;

const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    name: "Bundle Skincare Shopee",
    costPrice: 72000,
    sellingPrice: 99000,
    quantitySold: 48,
    stockInitial: 80,
    stockRemaining: 32,
    otherCost: 420000,
    profit: (99000 - 72000) * 48 - 420000,
    margin: ((99000 - 72000) / 99000) * 100,
  },
  {
    id: "demo-2",
    name: "Produk Viral Dropship",
    costPrice: 61000,
    sellingPrice: 69000,
    quantitySold: 35,
    stockInitial: 35,
    stockRemaining: 0,
    otherCost: 185000,
    profit: (69000 - 61000) * 35 - 185000,
    margin: ((69000 - 61000) / 69000) * 100,
  },
  {
    id: "demo-3",
    name: "Aksesoris HP Tokopedia",
    costPrice: 18000,
    sellingPrice: 35000,
    quantitySold: 120,
    stockInitial: 180,
    stockRemaining: 60,
    otherCost: 310000,
    profit: (35000 - 18000) * 120 - 310000,
    margin: ((35000 - 18000) / 35000) * 100,
  },
];

function money(value: number) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

function percent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(
    String(value)
      .replace(/Rp/gi, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, "")
      .trim()
  );
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
  const stockRemaining =
    row.stock_remaining === null || row.stock_remaining === undefined
      ? Math.max(stockInitial - quantitySold, 0)
      : parseNumber(row.stock_remaining);
  const costPrice = parseNumber(row.cost_price);
  const sellingPrice = parseNumber(row.selling_price);
  const otherCost = parseNumber(row.other_cost);
  const profit = row.profit === null || row.profit === undefined
    ? calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost })
    : parseNumber(row.profit);
  const margin = row.margin === null || row.margin === undefined
    ? calculateMargin(costPrice, sellingPrice)
    : parseNumber(row.margin);

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

function getPlanLabel(plan: UpgradePlan) {
  return plan === "monthly" ? `PRO Bulanan ${MONTHLY_PRICE}` : `PRO Lifetime ${LIFETIME_PRICE}`;
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

function getRiskBadge(item: Product) {
  if (item.profit < 0) return { label: "RUGI", color: "#fca5a5", bg: "rgba(127,29,29,0.32)" };
  if (item.margin < 10) return { label: "MARGIN KRITIS", color: "#fdba74", bg: "rgba(154,52,18,0.28)" };
  if (item.margin < 20) return { label: "PERLU OPTIMASI", color: "#fde68a", bg: "rgba(113,63,18,0.28)" };
  return { label: "SEHAT", color: "#86efac", bg: "rgba(20,83,45,0.28)" };
}

function getStockStatus(item: Product) {
  if (item.stockInitial <= 0) return { label: "Belum diisi", color: "#cbd5e1", bg: "rgba(148,163,184,0.12)" };
  const rate = (item.stockRemaining / Math.max(item.stockInitial, 1)) * 100;
  if (item.stockRemaining <= 0) return { label: "Stok habis", color: "#fca5a5", bg: "rgba(127,29,29,0.32)" };
  if (item.stockRemaining <= 5 || rate <= 15) return { label: "Stok menipis", color: "#fdba74", bg: "rgba(154,52,18,0.28)" };
  return { label: "Stok aman", color: "#86efac", bg: "rgba(20,83,45,0.28)" };
}

function getRestockRecommendation(item: Product) {
  if (item.profit < 0 || item.margin < 10) return "Jangan restock dulu";
  if (item.stockRemaining <= 0 && item.profit > 0 && item.margin >= 20) return "Restock segera";
  if ((item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) && item.profit > 0 && item.margin >= 20) return "Restock";
  if (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) return "Optimasi dulu";
  return "Pantau stok";
}

function daysUntilOut(item: Product) {
  if (item.quantitySold <= 0) return null;
  const dailySales = Math.max(item.quantitySold / 30, 0.1);
  return Math.max(0, Math.ceil(item.stockRemaining / dailySales));
}

function Sparkline({ data }: { data: number[] }) {
  const width = 240;
  const height = 72;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData
    .map((value, index) => {
      const x = (index / Math.max(safeData.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <polyline fill="none" stroke="rgba(34,197,94,0.18)" strokeWidth="12" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="none" stroke="#22c55e" strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarginBar({ value }: { value: number }) {
  const safe = clamp(value, 0, 60);
  const color = value < 10 ? "#ef4444" : value < 20 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ height: 9, borderRadius: 999, background: "rgba(15,23,42,0.86)", overflow: "hidden", border: "1px solid rgba(148,163,184,0.12)" }}>
      <div style={{ width: `${(safe / 60) * 100}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: "inline-flex", padding: "7px 10px", borderRadius: 999, color, background: bg, border: `1px solid ${color}33`, fontSize: 12, fontWeight: 900 }}>
      {label}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: "52px 20px", textAlign: "center", color: "#94a3b8" }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>...</div>
      <h3 style={{ margin: "0 0 8px", color: "white" }}>{title}</h3>
      <p style={{ margin: 0, lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [products, setProducts] = useState<Product[]>([]);
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
  const [aiAnswer, setAiAnswer] = useState("AI CFO siap membaca profit, stok, margin, dan keputusan scale/stop.");
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "", otherCost: "" });
  const [form, setForm] = useState({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "" });

  const isPro = isProfilePro(profile);
  const proExpired = isProfileExpired(profile);
  const effectiveIsPro = isPro;

  const totalProfit = products.reduce((acc, item) => acc + item.profit, 0);
  const totalRevenue = products.reduce((acc, item) => acc + item.sellingPrice * item.quantitySold, 0);
  const totalUnits = products.reduce((acc, item) => acc + item.quantitySold, 0);
  const totalStock = products.reduce((acc, item) => acc + item.stockRemaining, 0);
  const inventoryValue = products.reduce((acc, item) => acc + item.stockRemaining * item.costPrice, 0);
  const avgMargin = products.length ? products.reduce((acc, item) => acc + item.margin, 0) / products.length : 0;
  const lowStockProducts = products.filter((item) => item.stockInitial > 0 && item.stockRemaining > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  const outOfStockProducts = products.filter((item) => item.stockInitial > 0 && item.stockRemaining <= 0);
  const lossProducts = products.filter((item) => item.profit < 0);
  const healthyProducts = products.filter((item) => item.profit > 0 && item.margin >= 20);
  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.profit - a.profit), [products]);
  const bestProduct = sortedProducts[0] ?? null;
  const worstProduct = products.length ? [...products].sort((a, b) => a.profit - b.profit)[0] : null;

  const proActionPlan = useMemo(
    () => products.map((item) => {
      const unitOtherCost = item.otherCost / Math.max(item.quantitySold, 1);
      const recommendedPrice = Math.ceil((item.costPrice + unitOtherCost) / 0.75);
      const decision = item.profit < 0 ? "Stop / evaluasi" : item.margin < 10 ? "Naikkan harga" : item.margin < 20 ? "Optimasi" : "Scale";
      const reason = item.profit < 0
        ? "Profit minus. Jangan tambah stok sebelum harga dan biaya diperbaiki."
        : item.margin < 10
        ? "Margin terlalu tipis. Diskon kecil atau biaya admin bisa menghapus profit."
        : item.margin < 20
        ? "Masih bisa jalan, tapi belum aman untuk scale besar."
        : "Profit positif dan margin sehat. Layak didorong bertahap.";
      return { ...item, recommendedPrice, decision, reason, priceGap: Math.max(0, recommendedPrice - item.sellingPrice) };
    }),
    [products]
  );

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
  const riskScore = clamp(
    Math.round(
      (lossProducts.length / Math.max(products.length, 1)) * 38 +
        (products.filter((item) => item.margin < 10).length / Math.max(products.length, 1)) * 30 +
        (avgMargin < 10 ? 24 : avgMargin < 20 ? 14 : avgMargin < 25 ? 7 : 0) +
        (lowStockProducts.length + outOfStockProducts.length > 0 ? 10 : 0) +
        (totalProfit <= 0 && products.length > 0 ? 18 : 0)
    ),
    0,
    100
  );

  const sparklineData = [0, totalProfit * 0.35, totalProfit * 0.62, totalProfit];
  const oneThingAction =
    proActionPlan.find((item) => item.profit < 0)?.name
      ? `Stop dulu ${proActionPlan.find((item) => item.profit < 0)?.name}. Jangan tambah stok sebelum harga aman.`
      : lowStockProducts[0]
      ? `Restock ${lowStockProducts[0].name} karena stok mulai menipis.`
      : proActionPlan.find((item) => item.margin < 20)?.name
      ? `Optimasi harga ${proActionPlan.find((item) => item.margin < 20)?.name} sebelum scale.`
      : bestProduct
      ? `Scale bertahap ${bestProduct.name}.`
      : "Tambahkan produk pertama untuk mulai analisis.";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.72)",
    color: "white",
    outline: "none",
    fontSize: 14,
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(15,23,42,0.90), rgba(2,6,23,0.94))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 26px 80px rgba(0,0,0,0.40)",
  };

  const ctaButtonStyle: React.CSSProperties = {
    padding: "13px 18px",
    background: "linear-gradient(135deg, #84cc16, #22c55e, #14b8a6)",
    color: "#02130a",
    border: "1px solid rgba(190,242,100,0.45)",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 14,
  };

  const ghostButtonStyle: React.CSSProperties = {
    padding: "11px 14px",
    background: "rgba(15,23,42,0.78)",
    color: "white",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  };

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

      const { data: profileData } = await db
        .from("profiles")
        .select("role, plan, pro_until, email")
        .eq("email", user.email)
        .maybeSingle();

      if (!isMounted) return;
      setProfile((profileData as Profile | null) ?? { role: "user", plan: "free", pro_until: null, email: user.email });

      const { data: productData, error: productError } = await db
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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
        onSuccess: function () {
          alert("Pembayaran berhasil. PRO akan aktif otomatis setelah webhook diproses.");
          window.location.reload();
        },
        onPending: function () {
          alert("Pembayaran masih pending. Selesaikan pembayaran lalu refresh dashboard.");
          setUpgradeLoading(false);
        },
        onError: function (error: unknown) {
          alert(`Pembayaran gagal: ${getErrorMessage(error)}`);
          setUpgradeLoading(false);
        },
        onClose: function () {
          setUpgradeLoading(false);
        },
      });
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
      setUpgradeLoading(false);
    }
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
        const localProduct = { id: `demo-${Date.now()}`, name, costPrice, sellingPrice, stockInitial, stockRemaining, quantitySold, otherCost, profit, margin };
        setProducts((prev) => [localProduct, ...prev]);
        setForm({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "" });
        setActiveTab("overview");
        return;
      }

      const { data, error } = await db
        .from("products")
        .insert([{ user_id: currentUserId, name, cost_price: costPrice, selling_price: sellingPrice, stock_initial: stockInitial, stock_remaining: stockRemaining, quantity_sold: quantitySold, other_cost: otherCost, profit, margin } as any])
        .select("*")
        .single();

      if (error) throw error;
      if (data) setProducts((prev) => [mapProductRow(data as ProductRow), ...prev]);
      setForm({ productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "" });
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
    const confirmed = window.confirm("Hapus produk ini?");
    if (!confirmed) return;

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
          const name = String(row["Nama Barang"] || row["Nama Barang / Nama Variasi"] || row["Product Name"] || `Produk ${index + 1}`);
          const sellingPrice = parseNumber(row["Harga Setelah Diskon"] || row["Harga Jual"] || row["Total Harga Produk"] || row["Subtotal Produk"] || 0);
          const quantitySold = parseNumber(row["Jumlah"] || row["Jumlah Produk di Pesan"] || row["Quantity"] || 1) || 1;
          const stockInitial = parseNumber(row["Stok Awal"] || row["Stock"] || row["Stok"] || row["Initial Stock"] || row["Jumlah Stok"] || quantitySold) || quantitySold;
          const otherCost = parseNumber(row["Biaya Admin"] || row["Biaya Layanan"] || row["Voucher Ditanggung Penjual"] || row["Biaya Iklan"] || 0);
          const costPrice = parseNumber(row["Modal"] || row["Harga Modal"] || row["HPP"] || row["Cost Price"] || row["Harga Pokok"] || 0);
          const stockRemaining = Math.max(stockInitial - quantitySold, 0);
          const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
          const margin = calculateMargin(costPrice, sellingPrice);
          return { user_id: currentUserId, name, cost_price: costPrice, selling_price: sellingPrice, quantity_sold: quantitySold, stock_initial: stockInitial, stock_remaining: stockRemaining, other_cost: otherCost, profit, margin };
        });

        try {
          if (isDemoMode) {
            setProducts((prev) => [...imported.map((row, index) => mapProductRow({ id: `demo-csv-${Date.now()}-${index}`, ...row } as ProductRow)), ...prev]);
          } else {
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
    if (!effectiveIsPro) {
      openUpgradeModal("lifetime");
      return;
    }
    if (products.length === 0) {
      alert("Belum ada produk untuk export.");
      return;
    }
    const headers = ["Nama Produk", "Modal", "Harga Jual", "Terjual", "Stok", "Biaya Lain", "Profit", "Margin", "Keputusan", "Harga Aman", "Restock"];
    const rows = proActionPlan.map((item) => [item.name, item.costPrice, item.sellingPrice, item.quantitySold, item.stockRemaining, item.otherCost, item.profit, `${item.margin.toFixed(1)}%`, item.decision, item.recommendedPrice, getRestockRecommendation(item)]);
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
      setAiAnswer("Tambahkan minimal 1 produk dulu agar AI CFO bisa membaca profit, stok, dan margin.");
      return;
    }
    if (!effectiveIsPro) {
      setAiAnswer(`AI sudah menemukan sinyal bisnis:\n\n- Estimasi bocor: ${money(dailyLeakEstimate)} hari ini\n- Produk stok menipis: ${lowStockProducts.length + outOfStockProducts.length}\n- Produk rugi: ${lossProducts.length}\n\nBuka PRO untuk melihat detail produk, harga aman, dan action plan lengkap.`);
      openUpgradeModal("lifetime");
      return;
    }

    const stockLines = [...lowStockProducts, ...outOfStockProducts].slice(0, 4).map((item) => `- ${item.name}: stok ${item.stockRemaining}, saran: ${getRestockRecommendation(item)}`).join("\n") || "- Tidak ada stok kritis.";
    const priceLines = proActionPlan.slice(0, 5).map((item) => `- ${item.name}: ${item.decision}, harga aman ${money(item.recommendedPrice)}, margin ${percent(item.margin)}`).join("\n");
    const question = aiQuestion.trim() || "Buat ringkasan bisnis hari ini.";
    setAiAnswer(`Pertanyaan:\n${question}\n\nRingkasan CFO:\nProfit bersih ${money(totalProfit)}, omzet ${money(totalRevenue)}, margin rata-rata ${percent(avgMargin)}, nilai inventory ${money(inventoryValue)}.\n\nPrioritas hari ini:\n${oneThingAction}\n\nKontrol stok:\n${stockLines}\n\nHarga dan produk:\n${priceLines}\n\nKeputusan CFO:\nScale hanya produk profit positif dan margin minimal 20%. Jangan restock produk rugi sebelum harga dan biaya aman.`);
  }

  function StatCard({ label, value, helper, tone = "green" }: { label: string; value: React.ReactNode; helper: string; tone?: "green" | "red" | "yellow" | "blue" }) {
    const color = tone === "red" ? "#fca5a5" : tone === "yellow" ? "#fde68a" : tone === "blue" ? "#93c5fd" : "#86efac";
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{label}</p>
        <h2 style={{ margin: "8px 0", color, fontSize: 30 }}>{value}</h2>
        <small style={{ color: "#64748b", lineHeight: 1.5 }}>{helper}</small>
      </div>
    );
  }

  function renderProductTable(mode: "product" | "inventory" = "product") {
    if (filteredProducts.length === 0) {
      return <EmptyState title="Belum ada produk" description="Tambahkan produk manual atau import CSV untuk mulai membaca profit dan stok." />;
    }

    return (
      <div style={{ display: "grid", gap: 12 }}>
        {filteredProducts.map((item, index) => {
          const risk = getRiskBadge(item);
          const stock = getStockStatus(item);
          const dayLeft = daysUntilOut(item);
          const action = proActionPlan.find((plan) => plan.id === item.id);
          return (
            <div key={item.id} className="product-row" style={{ display: "grid", gridTemplateColumns: mode === "inventory" ? "1.2fr 0.8fr 0.8fr 0.8fr auto" : "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr auto", gap: 14, alignItems: "center", padding: 16, borderRadius: 20, background: "rgba(2,6,23,0.64)", border: "1px solid rgba(148,163,184,0.12)" }}>
              <div>
                <small style={{ color: "#64748b" }}>#{index + 1}</small>
                <h3 style={{ margin: "4px 0" }}>{item.name}</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge {...risk} />
                  <Badge {...stock} />
                </div>
              </div>
              <div>
                <small style={{ color: "#94a3b8" }}>Harga jual</small><br />
                <strong>{money(item.sellingPrice)}</strong>
              </div>
              <div>
                <small style={{ color: "#94a3b8" }}>Profit</small><br />
                <strong style={{ color: item.profit >= 0 ? "#86efac" : "#fca5a5" }}>{money(item.profit)}</strong>
              </div>
              <div>
                <small style={{ color: "#94a3b8" }}>Stok / Terjual</small><br />
                <strong>{item.stockRemaining} / {item.quantitySold}</strong>
                {dayLeft !== null && <div style={{ color: dayLeft <= 7 ? "#fdba74" : "#94a3b8", fontSize: 12 }}>Estimasi habis {dayLeft} hari</div>}
              </div>
              {mode === "product" && (
                <div>
                  <small style={{ color: "#94a3b8" }}>Margin</small><br />
                  <strong>{percent(item.margin)}</strong>
                  <MarginBar value={item.margin} />
                </div>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                <button onClick={() => { setStockMove((prev) => ({ ...prev, productId: item.id })); setActiveTab("inventory"); }} style={ghostButtonStyle}>Kelola stok</button>
                <button onClick={() => { setSaleForm((prev) => ({ ...prev, productId: item.id })); setActiveTab("sales"); }} style={ghostButtonStyle}>Catat jual</button>
                <button onClick={() => deleteProduct(item.id)} style={{ ...ghostButtonStyle, background: "rgba(127,29,29,0.48)", borderColor: "rgba(248,113,113,0.24)" }}>Hapus</button>
              </div>
              {mode === "product" && action && (
                <div style={{ gridColumn: "1 / -1", paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.10)", color: "#cbd5e1", lineHeight: 1.6 }}>
                  <b style={{ color: "#86efac" }}>AI CFO:</b> {action.reason} Harga aman: <b>{money(action.recommendedPrice)}</b>. Restock: <b>{getRestockRecommendation(item)}</b>.
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (pageLoading) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "white", display: "grid", placeItems: "center", fontFamily: "Inter, Arial" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, border: "4px solid #064e3b", borderTopColor: "#22c55e", margin: "0 auto 16px" }} />
          <p>Loading Untungin.ai...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 32%), radial-gradient(circle at top right, rgba(20,184,166,0.16), transparent 32%), linear-gradient(135deg, #020617, #050816 48%, #000)", color: "white", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", padding: 24 }}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        button { transition: 160ms ease; }
        button:hover { transform: translateY(-1px); filter: brightness(1.04); }
        input::placeholder, textarea::placeholder { color: rgba(203,213,225,0.45); }
        select { color-scheme: dark; }
        @media (max-width: 980px) {
          .top-grid, .main-grid, .metrics-grid, .two-grid, .three-grid, .product-row { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 42px !important; }
          .sticky-nav { position: static !important; }
        }
      `}</style>

      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.76)", display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ ...cardStyle, maxWidth: 620, width: "100%", border: "1px solid rgba(34,197,94,0.45)" }}>
            <button onClick={() => setShowUpgradeModal(false)} style={{ float: "right", background: "transparent", color: "white", border: "none", fontSize: 26, cursor: "pointer" }}>x</button>
            <p style={{ color: "#86efac", fontWeight: 900, marginTop: 0 }}>Upgrade Untungin.ai PRO</p>
            <h2 style={{ fontSize: 32, margin: "8px 0" }}>Buka keputusan lengkap untuk profit, harga, dan stok</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>PRO membuka unlimited produk, AI CFO lengkap, export laporan, smart pricing, dan inventory decision.</p>
            <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {([
                ["monthly", "PRO Bulanan", MONTHLY_PRICE],
                ["lifetime", "PRO Lifetime", LIFETIME_PRICE],
              ] as const).map(([key, title, price]) => (
                <button key={key} onClick={() => setSelectedPlan(key)} style={{ padding: 18, textAlign: "left", borderRadius: 18, border: selectedPlan === key ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.22)", background: selectedPlan === key ? "rgba(34,197,94,0.12)" : "rgba(2,6,23,0.72)", color: "white" }}>
                  <strong>{title}</strong><br />
                  <span style={{ color: "#86efac", fontWeight: 900 }}>{price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => handleUpgradeMidtrans(selectedPlan)} disabled={upgradeLoading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 18, opacity: upgradeLoading ? 0.7 : 1 }}>
              {upgradeLoading ? "Membuka pembayaran..." : "Bayar dengan Midtrans"}
            </button>
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Pembayaran diproses oleh Midtrans.</p>
          </div>
        </div>
      )}

      <section style={{ maxWidth: 1240, margin: "0 auto" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#22c55e,#14b8a6)", fontWeight: 950 }}>U</div>
            <div>
              <strong>Untungin.ai</strong>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>Profit, sales, and inventory OS</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ padding: "8px 12px", borderRadius: 999, color: isPro ? "#86efac" : proExpired ? "#fca5a5" : "#fbbf24", background: isPro ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", border: "1px solid rgba(148,163,184,0.16)", fontWeight: 900, fontSize: 13 }}>
              {isPro ? "PRO Aktif" : proExpired ? "PRO Expired" : "Paket Free"}
            </span>
            <button onClick={exportReportCSV} style={ghostButtonStyle}>Export laporan</button>
            {!isPro && <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>Pilih PRO</button>}
            <button onClick={handleLogout} style={{ ...ghostButtonStyle, background: "rgba(127,29,29,0.45)", borderColor: "rgba(248,113,113,0.24)" }}>Logout</button>
          </div>
        </nav>

        <header className="top-grid" style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 26, alignItems: "center", marginBottom: 18, border: "1px solid rgba(34,197,94,0.24)", background: "radial-gradient(circle at 10% 0%, rgba(34,197,94,0.20), transparent 34%), linear-gradient(135deg, rgba(6,78,59,0.46), rgba(2,6,23,0.94))" }}>
          <div>
            <p style={{ color: "#86efac", fontWeight: 950, margin: 0 }}>AI CFO untuk seller marketplace</p>
            <h1 className="hero-title" style={{ fontSize: 60, lineHeight: 1.02, letterSpacing: -2.4, margin: "12px 0" }}>Seller ramai order belum tentu untung.</h1>
            <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.8, maxWidth: 760 }}>
              Untungin.ai membaca profit real, biaya bocor, stok kritis, harga aman, dan keputusan restock dalam satu dashboard yang siap dipakai harian.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button onClick={() => setActiveTab("products")} style={ctaButtonStyle}>Tambah produk</button>
              <button onClick={() => setActiveTab("inventory")} style={ghostButtonStyle}>Buka Inventory Center</button>
              <label style={{ ...ghostButtonStyle, display: "inline-flex", cursor: "pointer" }}>
                {syncing ? "Importing..." : "Import CSV"}
                <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
              </label>
            </div>
            {lastSync && <p style={{ color: "#64748b", fontSize: 12 }}>Last import: {lastSync}</p>}
          </div>
          <div style={{ padding: 20, borderRadius: 24, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.12)" }}>
            <p style={{ margin: 0, color: "#94a3b8" }}>Profit bersih</p>
            <h2 style={{ fontSize: 42, margin: "6px 0", color: totalProfit >= 0 ? "#86efac" : "#fca5a5" }}>{money(totalProfit)}</h2>
            <Sparkline data={sparklineData} />
            <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div><small style={{ color: "#94a3b8" }}>Omzet</small><br /><strong>{money(totalRevenue)}</strong></div>
              <div><small style={{ color: "#94a3b8" }}>Inventory value</small><br /><strong>{money(inventoryValue)}</strong></div>
            </div>
          </div>
        </header>

        <div className="sticky-nav" style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, padding: 10, borderRadius: 20, background: "rgba(2,6,23,0.76)", border: "1px solid rgba(148,163,184,0.12)", backdropFilter: "blur(16px)" }}>
          {([
            ["overview", "Overview"],
            ["products", "Produk"],
            ["inventory", "Inventory"],
            ["sales", "Penjualan"],
            ["ai", "AI CFO"],
            ["pricing", "Harga"],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...ghostButtonStyle, background: activeTab === key ? "rgba(34,197,94,0.16)" : "rgba(15,23,42,0.52)", color: activeTab === key ? "#86efac" : "white", borderColor: activeTab === key ? "rgba(34,197,94,0.35)" : "rgba(148,163,184,0.14)" }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 18 }}>
            <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <StatCard label="Omzet" value={money(totalRevenue)} helper={`${totalUnits} unit terjual`} tone="blue" />
              <StatCard label="Profit bersih" value={money(totalProfit)} helper={`Margin rata-rata ${percent(avgMargin)}`} tone={totalProfit >= 0 ? "green" : "red"} />
              <StatCard label="Stok tersedia" value={totalStock} helper={`${lowStockProducts.length + outOfStockProducts.length} produk butuh perhatian`} tone={lowStockProducts.length + outOfStockProducts.length > 0 ? "yellow" : "green"} />
              <StatCard label="Risk score" value={`${riskScore}/100`} helper={`Estimasi bocor ${money(dailyLeakEstimate)} hari ini`} tone={riskScore >= 50 ? "red" : riskScore >= 25 ? "yellow" : "green"} />
            </section>

            <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Next Best Action</p>
                <h2 style={{ margin: "8px 0", lineHeight: 1.35 }}>{oneThingAction}</h2>
                <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Fokus pada satu keputusan utama supaya seller tidak bingung: stop, fix harga, restock, atau scale.</p>
                <button onClick={() => setActiveTab("ai")} style={ctaButtonStyle}>Buka AI CFO</button>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#fbbf24", fontWeight: 950 }}>Inventory Health</p>
                <h2 style={{ margin: "8px 0" }}>{money(inventoryValue)} modal tertahan di stok</h2>
                <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Produk habis: {outOfStockProducts.length}. Stok menipis: {lowStockProducts.length}. Produk sehat: {healthyProducts.length}.</p>
                <button onClick={() => setActiveTab("inventory")} style={ghostButtonStyle}>Kelola stok</button>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Ranking produk</p>
                  <h2 style={{ margin: "4px 0" }}>Profit, risiko, dan stok dalam satu list</h2>
                </div>
                <button onClick={() => setActiveTab("products")} style={ghostButtonStyle}>Lihat semua</button>
              </div>
              {renderProductTable("product")}
            </section>
          </div>
        )}

        {activeTab === "products" && (
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 18 }}>
            <section style={cardStyle}>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Input produk</p>
              <h2 style={{ margin: "8px 0" }}>Tambah produk dan data profit</h2>
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 14 }}>
                <input name="productName" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Nama produk" style={inputStyle} />
                <input name="costPrice" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} type="number" min="0" placeholder="Modal per produk" style={inputStyle} />
                <input name="sellingPrice" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} type="number" min="0" placeholder="Harga jual" style={inputStyle} />
                <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input name="stockInitial" value={form.stockInitial} onChange={(e) => setForm({ ...form, stockInitial: e.target.value })} type="number" min="0" placeholder="Stok awal" style={inputStyle} />
                  <input name="quantitySold" value={form.quantitySold} onChange={(e) => setForm({ ...form, quantitySold: e.target.value })} type="number" min="0" placeholder="Terjual" style={inputStyle} />
                </div>
                <input name="otherCost" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya lain: admin, iklan, voucher" style={inputStyle} />
                <button disabled={loading} style={{ ...ctaButtonStyle, opacity: loading ? 0.7 : 1 }}>{loading ? "Menyimpan..." : "Simpan produk"}</button>
                {!isPro && <small style={{ color: "#94a3b8" }}>Free dibatasi {FREE_PRODUCT_LIMIT} produk. Upgrade PRO untuk unlimited produk.</small>}
              </form>
            </section>
            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Daftar produk</p>
                  <h2 style={{ margin: "4px 0" }}>Ranking profit dan risiko</h2>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([
                    ["all", "Semua"],
                    ["loss", "Rugi"],
                    ["fix", "Optimasi"],
                    ["scale", "Scale"],
                    ["stock", "Stok"],
                  ] as const).map(([key, label]) => <button key={key} onClick={() => setSelectedFilter(key)} style={{ ...ghostButtonStyle, color: selectedFilter === key ? "#86efac" : "white" }}>{label}</button>)}
                </div>
              </div>
              {renderProductTable("product")}
            </section>
          </div>
        )}

        {activeTab === "inventory" && (
          <div style={{ display: "grid", gap: 18 }}>
            <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <StatCard label="Total SKU" value={products.length} helper="Produk aktif" tone="blue" />
              <StatCard label="Total stok" value={totalStock} helper="Unit tersedia" tone="green" />
              <StatCard label="Stok kritis" value={lowStockProducts.length + outOfStockProducts.length} helper="Perlu perhatian" tone={lowStockProducts.length + outOfStockProducts.length ? "yellow" : "green"} />
              <StatCard label="Nilai inventory" value={money(inventoryValue)} helper="Modal masih tersimpan" tone="green" />
            </section>
            <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18 }}>
              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Stock Movement</p>
                <h2 style={{ margin: "8px 0" }}>Stok terpisah dari penjualan</h2>
                <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Gunakan form ini untuk stok masuk, stok keluar, atau penyesuaian stok. Penjualan tetap punya form sendiri dan otomatis mengurangi stok.</p>
                <form onSubmit={applyStockMove} style={{ display: "grid", gap: 12 }}>
                  <select value={stockMove.productId} onChange={(e) => setStockMove({ ...stockMove, productId: e.target.value })} style={inputStyle}>
                    <option value="">Pilih produk</option>
                    {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <select value={stockMove.type} onChange={(e) => setStockMove({ ...stockMove, type: e.target.value as StockMoveType })} style={inputStyle}>
                    <option value="in">Stok masuk / restock</option>
                    <option value="out">Stok keluar manual</option>
                    <option value="adjust">Set stok aktual</option>
                  </select>
                  <input value={stockMove.qty} onChange={(e) => setStockMove({ ...stockMove, qty: e.target.value })} type="number" min="0" placeholder="Jumlah" style={inputStyle} />
                  <input value={stockMove.note} onChange={(e) => setStockMove({ ...stockMove, note: e.target.value })} placeholder="Catatan opsional" style={inputStyle} />
                  <button style={ctaButtonStyle}>Update stok</button>
                </form>
              </div>
              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Inventory List</p>
                <h2 style={{ margin: "8px 0" }}>Pantau stok kapan saja</h2>
                {renderProductTable("inventory")}
              </div>
            </section>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 18 }}>
            <section style={cardStyle}>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Catat penjualan</p>
              <h2 style={{ margin: "8px 0" }}>Penjualan otomatis mengurangi stok</h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Form ini menjaga sales tetap link ke inventory. Saat produk terjual, quantity sold naik, stock remaining turun, profit update.</p>
              <form onSubmit={recordSale} style={{ display: "grid", gap: 12 }}>
                <select value={saleForm.productId} onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })} style={inputStyle}>
                  <option value="">Pilih produk</option>
                  {products.map((item) => <option key={item.id} value={item.id}>{item.name} - stok {item.stockRemaining}</option>)}
                </select>
                <input value={saleForm.qty} onChange={(e) => setSaleForm({ ...saleForm, qty: e.target.value })} type="number" min="1" placeholder="Qty terjual" style={inputStyle} />
                <input value={saleForm.otherCost} onChange={(e) => setSaleForm({ ...saleForm, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya tambahan transaksi ini" style={inputStyle} />
                <button style={ctaButtonStyle}>Simpan penjualan</button>
              </form>
            </section>
            <section style={cardStyle}>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Sales Performance</p>
              <h2 style={{ margin: "8px 0" }}>{totalUnits} unit terjual</h2>
              {renderProductTable("product")}
            </section>
          </div>
        )}

        {activeTab === "ai" && (
          <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 18 }}>
            <div style={cardStyle}>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>AI CFO</p>
              <h2 style={{ margin: "8px 0" }}>Tanya keputusan bisnis</h2>
              <textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} rows={6} placeholder="Contoh: produk mana yang harus saya restock, stop, atau scale minggu ini?" style={{ ...inputStyle, resize: "vertical" }} />
              <button onClick={askAiCfo} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Generate Action Plan</button>
              {!isPro && <p style={{ color: "#94a3b8", fontSize: 13 }}>Free melihat ringkasan. PRO membuka diagnosis lengkap.</p>}
            </div>
            <div style={cardStyle}>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Jawaban CFO</p>
              <pre style={{ whiteSpace: "pre-wrap", color: "#dbeafe", lineHeight: 1.72, fontFamily: "inherit", margin: "14px 0 0" }}>{aiAnswer}</pre>
            </div>
          </section>
        )}

        {activeTab === "pricing" && (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>Produk dan Harga Resmi</p>
            <h2 style={{ margin: "8px 0", fontSize: 34 }}>Untungin.ai PRO untuk seller online</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.75, maxWidth: 820 }}>Akses aplikasi digital berbasis web untuk analisis profit, margin, stok, pricing, export laporan, rekomendasi restock, dan action plan bisnis harian.</p>
            <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
              <div style={{ padding: 20, borderRadius: 22, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                <h3>PRO Bulanan</h3>
                <h2 style={{ color: "#86efac" }}>Rp29.000/bulan</h2>
                <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Akses fitur PRO selama 1 bulan: AI CFO, diagnosis produk, inventory center, harga aman, dan laporan.</p>
                <button onClick={() => openUpgradeModal("monthly")} style={ctaButtonStyle}>Pilih PRO Bulanan</button>
              </div>
              <div style={{ padding: 20, borderRadius: 22, background: "rgba(6,78,59,0.28)", border: "1px solid rgba(34,197,94,0.28)" }}>
                <h3>PRO Lifetime</h3>
                <h2 style={{ color: "#86efac" }}>Rp99.000 sekali bayar</h2>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>Sekali bayar untuk membuka fitur PRO tanpa biaya bulanan berikutnya.</p>
                <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>Pilih PRO Lifetime</button>
              </div>
            </div>
          </section>
        )}

        <footer style={{ ...cardStyle, marginTop: 18, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 18 }} className="three-grid">
          <div>
            <strong>Untungin.ai</strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Aplikasi digital AI CFO untuk membantu seller membaca profit real, harga aman, biaya bocor, stok, dan rencana restock.</p>
          </div>
          <div>
            <strong>Kontak</strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Email: support@untungin.ai<br />Website: untungin-ai-pmd1.vercel.app<br />Pembayaran: Midtrans</p>
          </div>
          <div>
            <strong>Legal</strong>
            <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Kebijakan Privasi<br />Syarat dan Ketentuan<br />Refund mengikuti status aktivasi dan penggunaan akun.</p>
          </div>
        </footer>
      </section>
    </main>
  );
}

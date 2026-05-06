"use client";

import { useEffect, useMemo, useState } from "react";
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

type HistoryItem = {
  date: string;
  totalProfit: number;
  totalRevenue: number;
  avgMargin: number;
};

type UpgradePlan = "monthly" | "lifetime";
type UserPlan = "free" | "pro";

type UserRole = "user" | "admin";

type Profile = {
  role: UserRole | string | null;
  plan: UserPlan | string | null;
  pro_until: string | null;
  email?: string | null;
};

type ProductFilter = "all" | "loss" | "fix" | "scale" | "stock";

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

const FREE_PRODUCT_LIMIT = 3;
const MONTHLY_PRICE = "Rp29.000/bulan";
const LIFETIME_PRICE = "Rp99.000 sekali bayar";
const ADMIN_PRO_PATH = "/admin/pro";
const CONVERSION_DEADLINE_HOURS = 24;
const FOMO_BASE_SLOT = 37;

const money = (value: number) =>
  `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;

const percent = (value: number) => `${(value || 0).toFixed(1)}%`;

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value: unknown) {
  if (!value) return 0;

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

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name || "Produk Tanpa Nama",
    costPrice: toNumber(row.cost_price),
    sellingPrice: toNumber(row.selling_price),
    quantitySold: toNumber(row.quantity_sold),
    stockInitial: toNumber(row.stock_initial) || toNumber(row.quantity_sold),
    stockRemaining:
      row.stock_remaining === null || row.stock_remaining === undefined
        ? Math.max((toNumber(row.stock_initial) || toNumber(row.quantity_sold)) - toNumber(row.quantity_sold), 0)
        : toNumber(row.stock_remaining),
    otherCost: toNumber(row.other_cost),
    profit: toNumber(row.profit),
    margin: toNumber(row.margin),
  };
}

function getPlanLabel(plan: UpgradePlan) {
  return plan === "monthly"
    ? `PRO Bulanan ${MONTHLY_PRICE}`
    : `PRO Lifetime ${LIFETIME_PRICE}`;
}

function getPlanAmount(plan: UpgradePlan) {
  return plan === "monthly" ? 29000 : 99000;
}

function isProfilePro(profile: Profile | null) {
  return (
    profile?.plan === "pro" &&
    (!profile.pro_until || new Date(profile.pro_until) > new Date())
  );
}

function isProfileExpired(profile: Profile | null) {
  return (
    profile?.plan === "pro" &&
    !!profile.pro_until &&
    new Date(profile.pro_until) <= new Date()
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 220;
  const height = 70;
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
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth="4"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        fill="none"
        stroke="rgba(34,197,94,0.18)"
        strokeWidth="12"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarginBar({ value }: { value: number }) {
  const safe = clamp(value, 0, 60);
  const color = value < 10 ? "#ef4444" : value < 20 ? "#f59e0b" : "#22c55e";

  return (
    <div
      style={{
        height: 9,
        borderRadius: 99,
        background: "#111827",
        overflow: "hidden",
        border: "1px solid #1f2937",
      }}
    >
      <div
        style={{
          width: `${(safe / 60) * 100}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
        }}
      />
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "52px 20px", color: "#94a3b8" }}>
      <div style={{ fontSize: 54, marginBottom: 12 }}>📊</div>
      <h3 style={{ color: "white", marginBottom: 6 }}>{title}</h3>
      <p style={{ margin: 0 }}>{description}</p>
    </div>
  );
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
  if (item.profit < 0) return { label: "🔴 RUGI", color: "#fca5a5", bg: "rgba(127,29,29,0.38)" };
  if (item.margin < 10) return { label: "🟠 MARGIN KRITIS", color: "#fdba74", bg: "rgba(154,52,18,0.34)" };
  if (item.margin < 20) return { label: "🟡 PERLU OPTIMASI", color: "#fde68a", bg: "rgba(113,63,18,0.34)" };
  return { label: "🟢 AMAN SCALE", color: "#86efac", bg: "rgba(20,83,45,0.34)" };
}

function getStockStatus(item: Product) {
  if (item.stockInitial <= 0) {
    return { label: "⚪ Stok belum diisi", color: "#cbd5e1", bg: "rgba(148,163,184,0.12)" };
  }

  const stockRate = (item.stockRemaining / Math.max(item.stockInitial, 1)) * 100;

  if (item.stockRemaining <= 0) {
    return { label: "🔴 STOK HABIS", color: "#fca5a5", bg: "rgba(127,29,29,0.38)" };
  }

  if (item.stockRemaining <= 5 || stockRate <= 15) {
    return { label: "🟠 STOK MENIPIS", color: "#fdba74", bg: "rgba(154,52,18,0.34)" };
  }

  return { label: "🟢 STOK AMAN", color: "#86efac", bg: "rgba(20,83,45,0.34)" };
}

function getRestockRecommendation(item: Product) {
  if (item.profit < 0 || item.margin < 10) return "🔴 Jangan restock dulu";
  if (item.stockRemaining <= 0 && item.profit > 0 && item.margin >= 20) return "🟢 Restock segera";
  if ((item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) && item.profit > 0 && item.margin >= 20) return "🟢 Restock";
  if (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) return "🟡 Optimasi dulu";
  return "✅ Pantau stok";
}

function getRescueTone(score: number) {
  if (score >= 75) return "KRITIS";
  if (score >= 50) return "WASPADA";
  if (score >= 25) return "PERLU DIAWASI";
  return "CUKUP AMAN";
}


function getConversionHeadline(riskScore: number, dailyLeak: number, productCount: number) {
  if (productCount === 0) return "Tambahkan produk pertama untuk melihat uang bocor.";
  if (riskScore >= 75) return `DARURAT: estimasi bocor ${money(dailyLeak)} hari ini`;
  if (riskScore >= 50) return `WASPADA: potensi bocor ${money(dailyLeak)} hari ini`;
  if (riskScore >= 25) return `Ada profit yang bisa diselamatkan hari ini`;
  return "Bisnis cukup aman, tapi masih bisa dioptimasi";
}

function getOneThingAction(
  stopProducts: Array<Product & { recommendedPrice: number; decision: string; reason: string; priceGap: number }>,
  fixProducts: Array<Product & { recommendedPrice: number; decision: string; reason: string; priceGap: number }>,
  scaleProducts: Array<Product & { recommendedPrice: number; decision: string; reason: string; priceGap: number }>,
  bestProduct: Product | null
) {
  if (stopProducts[0]) return `Stop dulu ${stopProducts[0].name}. Jangan tambah stok/iklan sebelum harga aman di ${money(stopProducts[0].recommendedPrice)}.`;
  if (fixProducts[0]) return `Naikkan harga ${fixProducts[0].name} ke sekitar ${money(fixProducts[0].recommendedPrice)} atau potong biaya per transaksi.`;
  if (scaleProducts[0]) return `Scale bertahap ${scaleProducts[0].name}. Produk ini paling siap didorong.`;
  if (bestProduct) return `Pantau ${bestProduct.name} sebagai kandidat hero product.`;
  return "Tambahkan minimal 1 produk agar AI CFO bisa memberi keputusan.";
}

function getFilterLabel(filter: ProductFilter) {
  if (filter === "loss") return "Produk Rugi";
  if (filter === "fix") return "Perlu Optimasi";
  if (filter === "scale") return "Siap Scale";
  if (filter === "stock") return "Stok Menipis";
  return "Semua Produk";
}

function getDiagnosisText(item: Product, recommendedPrice: number) {
  const unitSold = Math.max(item.quantitySold, 1);
  const profitPerUnit = item.profit / unitSold;
  const unitOtherCost = item.otherCost / unitSold;
  const priceGap = Math.max(0, recommendedPrice - item.sellingPrice);

  if (item.profit < 0) {
    return `Produk ini rugi karena profit total ${money(item.profit)} dan profit/unit ${money(profitPerUnit)}. Penyebab paling mungkin: harga jual terlalu rendah, modal terlalu tinggi, atau biaya lain/unit ${money(unitOtherCost)} terlalu besar. Minimal revisi harga ke ${money(recommendedPrice)} sebelum restock atau iklan.`;
  }

  if (item.margin < 10) {
    return `Produk ini belum rugi, tapi margin ${percent(item.margin)} terlalu tipis. Diskon kecil, biaya admin, retur, atau iklan bisa langsung menghapus profit. Naikkan harga sekitar ${money(priceGap)} atau tekan biaya per unit.`;
  }

  if (item.margin < 20) {
    return `Produk ini masih bisa dijual, tapi belum aman untuk scale besar. Margin ${percent(item.margin)} sebaiknya dinaikkan ke minimal 20%-25% agar promosi dan biaya operasional tetap aman.`;
  }

  return `Produk ini sehat. Profit ${money(item.profit)} dengan margin ${percent(item.margin)}. Fokus berikutnya: jaga harga minimum, hindari diskon agresif, dan scale stok/traffic bertahap.`;
}

function getCompetitorDecision(item: Product, competitorPrice: number) {
  if (!competitorPrice || competitorPrice <= 0) return "Isi harga kompetitor untuk membaca posisi harga.";

  const gap = item.sellingPrice - competitorPrice;
  if (gap > 0 && item.margin >= 25) return `Harga kamu ${money(gap)} lebih mahal. Bisa tetap premium jika value kuat; jangan perang harga kalau margin sehat.`;
  if (gap > 0 && item.margin < 20) return `Harga kamu lebih mahal, tapi margin belum aman. Audit modal/biaya sebelum menaikkan traffic.`;
  if (gap < 0 && item.margin >= 20) return `Harga kamu ${money(Math.abs(gap))} lebih murah. Ada peluang naik harga bertahap tanpa langsung kalah saing.`;
  if (gap < 0 && item.margin < 20) return `Harga kamu lebih murah tetapi margin tipis. Ini rawan perang harga. Naikkan value atau bundling.`;
  return "Harga kamu sejajar kompetitor. Menang lewat bundle, bonus, kecepatan, dan trust.";
}

function getChecklistSeed(item: Product & { recommendedPrice: number; decision: string; reason: string; priceGap: number }) {
  if (item.profit < 0) return { title: `Stop rugi: ${item.name}`, detail: `Tahan iklan/restock dan revisi harga minimal ke ${money(item.recommendedPrice)}.` };
  if (item.margin < 20) return { title: `Fix margin: ${item.name}`, detail: `Naikkan harga atau kurangi biaya agar margin mendekati 25%.` };
  return { title: `Scale aman: ${item.name}`, detail: `Tambah stok/traffic bertahap tanpa diskon besar.` };
}

function formatCountdown(seconds: number) {
  const safe = Math.max(seconds, 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getPremiumPainHeadline(productCount: number, dailyLeak: number, totalProfit: number) {
  if (productCount === 0) return "Belum ada data. Masukkan 1 produk untuk memunculkan momen ‘oh ternyata bocor’.";
  if (totalProfit < 0) return `Bisnis kamu sedang kebakar ${money(Math.abs(totalProfit))}. Jangan scale sebelum diselamatkan.`;
  return `Kamu bisa kehilangan ${money(dailyLeak)} hari ini tanpa sadar.`;
}

function getObjectionAnswer(type: "mahal" | "nanti" | "percaya", dailyLeak: number, selectedAmount: number) {
  if (type === "mahal") return `Kalau potensi bocor harian ${money(dailyLeak)}, biaya PRO bisa balik modal sekitar ${Math.max(1, Math.ceil(selectedAmount / Math.max(dailyLeak, 1)))} hari.`;
  if (type === "nanti") return `Menunda 7 hari bisa berarti membiarkan sekitar ${money(dailyLeak * 7)} tetap bocor tanpa keputusan.`;
  return "Data dihitung dari modal, harga jual, terjual, stok, dan biaya lain yang user input sendiri. AI CFO memberi keputusan berbasis angka itu.";
}

function getCfoCommandLabel(score: number) {
  if (score >= 75) return "MODE DARURAT: stop produk bocor dulu";
  if (score >= 50) return "MODE WASPADA: fix harga sebelum scale";
  if (score >= 25) return "MODE OPTIMASI: cari profit tambahan";
  return "MODE SCALE: dorong produk sehat";
}

export default function DashboardPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    productName: "",
    costPrice: "",
    sellingPrice: "",
    stockInitial: "",
    quantitySold: "",
    otherCost: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [result, setResult] = useState("");
  const [profit, setProfit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>("lifetime");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(
    "AI CFO siap membaca profit, margin, biaya bocor, dan produk yang layak di-scale."
  );
  const [showLeakAlert, setShowLeakAlert] = useState(false);
  const [showLossPopup, setShowLossPopup] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>("all");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profitGoal, setProfitGoal] = useState("10000000");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Product | null>(null);
  const [selectedSimulatorId, setSelectedSimulatorId] = useState("");
  const [simulatedPrice, setSimulatedPrice] = useState("");
  const [competitorPrices, setCompetitorPrices] = useState<Record<string, string>>({});
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);
  const [conversionCountdown, setConversionCountdown] = useState(CONVERSION_DEADLINE_HOURS * 60 * 60);
  const [selectedObjection, setSelectedObjection] = useState<"mahal" | "nanti" | "percaya">("mahal");
  const [showStickyOffer, setShowStickyOffer] = useState(true);

  const isAdmin = profile?.role === "admin";
  const isPro = isProfilePro(profile);
  const proExpired = isProfileExpired(profile);
  const proExpiryText =
    isPro && profile?.pro_until
      ? new Date(profile.pro_until).toLocaleDateString("id-ID")
      : null;

  const totalProfit = products.reduce((acc, item) => acc + item.profit, 0);
  const totalRevenue = products.reduce(
    (acc, item) => acc + item.sellingPrice * item.quantitySold,
    0
  );
  const totalUnits = products.reduce((acc, item) => acc + item.quantitySold, 0);
  const totalInitialStock = products.reduce((acc, item) => acc + item.stockInitial, 0);
  const totalRemainingStock = products.reduce((acc, item) => acc + item.stockRemaining, 0);
  const lowStockProducts = products.filter(
    (item) =>
      item.stockInitial > 0 &&
      item.stockRemaining > 0 &&
      (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15)
  );
  const outOfStockProducts = products.filter(
    (item) => item.stockInitial > 0 && item.stockRemaining <= 0
  );
  const restockNowProducts = products.filter(
    (item) =>
      item.stockInitial > 0 &&
      item.stockRemaining <= Math.max(5, item.stockInitial * 0.15) &&
      item.profit > 0 &&
      item.margin >= 20
  );
  const avgMargin =
    products.length > 0
      ? products.reduce((acc, item) => acc + item.margin, 0) / products.length
      : 0;

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.profit - a.profit),
    [products]
  );
  const bestProduct = sortedProducts[0] ?? null;
  const worstProduct = useMemo(
    () =>
      products.length > 0
        ? [...products].sort((a, b) => a.profit - b.profit)[0]
        : null,
    [products]
  );
  const lossProducts = useMemo(
    () => products.filter((item) => item.profit < 0),
    [products]
  );
  const lowMarginProducts = useMemo(
    () => products.filter((item) => item.margin < 10),
    [products]
  );
  const healthyProducts = useMemo(
    () => products.filter((item) => item.margin >= 20 && item.profit > 0),
    [products]
  );

  const simulatedProfitIncrease = products.reduce((acc, item) => {
    const newProfit =
      (item.sellingPrice + 1000 - item.costPrice) * item.quantitySold -
      item.otherCost;
    return acc + newProfit;
  }, 0);

  const extraProfit = simulatedProfitIncrease - totalProfit;
  const profitLeak = products.reduce((acc, item) => {
    if (item.margin >= 20) return acc;
    const healthyProfit = item.sellingPrice * item.quantitySold * 0.2 - item.otherCost;
    return acc + Math.max(0, healthyProfit - item.profit);
  }, 0);

  const lockedPotentialProfit = Math.max(extraProfit, profitLeak, products.length * 15000);
  const estimatedMonthlyLoss = Math.max(lockedPotentialProfit * 4, products.length * 50000);
  const earlyUserSlotLeft = Math.max(8, FOMO_BASE_SLOT - products.length - (isPro ? 0 : 3));

  const criticalProducts = products.filter((item) => item.profit < 0 || item.margin < 10);
  const productsNeedingFix = products.filter((item) => item.profit >= 0 && item.margin < 20);
  const dailyLeakEstimate = Math.max(Math.round(estimatedMonthlyLoss / 30), products.length * 2500);
  const weeklyLeakEstimate = dailyLeakEstimate * 7;
  const riskScore = clamp(
    Math.round(
      (lossProducts.length / Math.max(products.length, 1)) * 38 +
        (lowMarginProducts.length / Math.max(products.length, 1)) * 30 +
        (avgMargin < 10 ? 24 : avgMargin < 20 ? 14 : avgMargin < 25 ? 7 : 0) +
        (totalProfit <= 0 && products.length > 0 ? 18 : 0)
    ),
    0,
    100
  );
  const rescueTone = getRescueTone(riskScore);
  const hasRescueInsight = products.length > 0;
  const totalLossFromLossProducts = lossProducts.reduce(
    (acc, item) => acc + Math.abs(item.profit),
    0
  );
  const aiLeakAlertAmount = Math.max(
    totalLossFromLossProducts * 4,
    profitLeak,
    products.length * 25000
  );
  const dailyAiLeakAlertAmount = Math.max(
    Math.round(aiLeakAlertAmount / 30),
    products.length * 1500
  );

  const proActionPlan = useMemo(
    () =>
      products.map((item) => {
        const targetMargin = 25;
        const recommendedPrice = Math.ceil(
          (item.costPrice + item.otherCost / Math.max(item.quantitySold, 1)) /
            (1 - targetMargin / 100)
        );
        const decision =
          item.profit < 0
            ? "STOP / evaluasi"
            : item.margin < 10
            ? "Naikkan harga"
            : item.margin < 20
            ? "Optimasi dulu"
            : "Scale";
        const reason =
          item.profit < 0
            ? "Profit minus. Jangan tambah stok sebelum biaya dan harga diperbaiki."
            : item.margin < 10
            ? "Margin sangat tipis dan rawan habis oleh diskon, admin, atau iklan."
            : item.margin < 20
            ? "Masih bisa jalan, tapi belum aman untuk scale besar."
            : "Margin sehat dan profit positif. Layak didorong.";

        return {
          ...item,
          recommendedPrice,
          decision,
          reason,
          priceGap: Math.max(0, recommendedPrice - item.sellingPrice),
        };
      }),
    [products]
  );

  const proScaleProducts = proActionPlan.filter((item) => item.decision === "Scale");
  const proFixProducts = proActionPlan.filter(
    (item) => item.margin < 20 && item.profit >= 0
  );
  const proStopProducts = proActionPlan.filter((item) => item.profit < 0);
  const filteredProducts = useMemo(() => {
    if (selectedFilter === "loss") return sortedProducts.filter((item) => item.profit < 0);
    if (selectedFilter === "fix") return sortedProducts.filter((item) => item.profit >= 0 && item.margin < 20);
    if (selectedFilter === "scale") return sortedProducts.filter((item) => item.profit > 0 && item.margin >= 20);
    if (selectedFilter === "stock") {
      return sortedProducts.filter(
        (item) =>
          item.stockInitial > 0 &&
          (item.stockRemaining <= 0 || item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15)
      );
    }
    return sortedProducts;
  }, [selectedFilter, sortedProducts]);
  const sparklineData =
    history.length > 0 ? history.map((item) => item.totalProfit) : [0, totalProfit];
  const conversionHeadline = getConversionHeadline(riskScore, dailyLeakEstimate, products.length);
  const oneThingAction = getOneThingAction(proStopProducts, proFixProducts, proScaleProducts, bestProduct);
  const urgencyDeadlineText = `${CONVERSION_DEADLINE_HOURS} jam`;
  const profitGoalValue = Math.max(parseNumber(profitGoal), 1);
  const goalProgress = clamp(Math.round((totalProfit / profitGoalValue) * 100), 0, 100);
  const remainingGoalProfit = Math.max(profitGoalValue - totalProfit, 0);
  const simulatorProduct = products.find((item) => item.id === selectedSimulatorId) || bestProduct || null;
  const simulatorPriceValue = simulatorProduct ? parseNumber(simulatedPrice) || simulatorProduct.sellingPrice : 0;
  const simulatorProfit = simulatorProduct
    ? (simulatorPriceValue - simulatorProduct.costPrice) * simulatorProduct.quantitySold - simulatorProduct.otherCost
    : 0;
  const simulatorMargin = simulatorPriceValue > 0 && simulatorProduct
    ? ((simulatorPriceValue - simulatorProduct.costPrice) / simulatorPriceValue) * 100
    : 0;
  const simulatorDelta = simulatorProduct ? simulatorProfit - simulatorProduct.profit : 0;
  const actionChecklist = useMemo(() => {
    const seeds = [
      ...proStopProducts.slice(0, 2),
      ...proFixProducts.slice(0, 3),
      ...proScaleProducts.slice(0, 2),
    ];

    if (seeds.length === 0 && bestProduct) seeds.push(proActionPlan.find((item) => item.id === bestProduct.id) || proActionPlan[0]);

    return seeds.filter(Boolean).slice(0, 6).map((item) => {
      const seed = getChecklistSeed(item);
      return { id: item.id, ...seed, locked: !isPro && item !== seeds[0] };
    });
  }, [proStopProducts, proFixProducts, proScaleProducts, bestProduct, proActionPlan, isPro]);
  const completedActions = actionChecklist.filter((item) => checkedActions[item.id]).length;
  const retentionSummary = totalProfit < 0
    ? `Profit sedang minus ${money(Math.abs(totalProfit))}. Prioritas retensi minggu ini: hentikan produk rugi.`
    : avgMargin < 20
    ? `Profit masih bisa naik. Margin rata-rata ${percent(avgMargin)} belum aman untuk scale agresif.`
    : `Bisnis terlihat sehat. Jaga margin dan scale produk terbaik secara bertahap.`;
  const premiumPainHeadline = getPremiumPainHeadline(products.length, dailyLeakEstimate, totalProfit);
  const selectedPlanAmount = getPlanAmount(selectedPlan);
  const paybackDays = Math.max(1, Math.ceil(selectedPlanAmount / Math.max(dailyLeakEstimate, 1)));
  const roiMultiple = Math.max(1, Math.round(estimatedMonthlyLoss / Math.max(selectedPlanAmount, 1)));
  const cfoCommandLabel = getCfoCommandLabel(riskScore);
  const leakMap = proActionPlan
    .map((item) => {
      const safeProfit = (item.recommendedPrice - item.costPrice) * item.quantitySold - item.otherCost;
      const leak = Math.max(0, safeProfit - item.profit, item.profit < 0 ? Math.abs(item.profit) : 0);
      return { ...item, leak };
    })
    .sort((a, b) => b.leak - a.leak)
    .slice(0, 5);
  const maxLeakMapValue = Math.max(...leakMap.map((item) => item.leak), 1);
  const lockedWorstProduct = worstProduct?.name || "Produk penyebab bocor";
  const lockedSafePrice = worstProduct
    ? proActionPlan.find((item) => item.id === worstProduct.id)?.recommendedPrice || worstProduct.sellingPrice
    : 0;

  const inputStyle: React.CSSProperties = {
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.26)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.86))",
    color: "white",
    fontSize: 15,
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 48px rgba(0,0,0,0.16)",
  };

  const cardStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(145deg, rgba(15,23,42,0.82), rgba(2,6,23,0.92)), linear-gradient(135deg, rgba(34,197,94,0.08), rgba(20,184,166,0.04))",
    border: "1px solid rgba(255,255,255,0.11)",
    borderRadius: 32,
    padding: 26,
    boxShadow: "0 28px 90px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "blur(22px) saturate(130%)",
  };

  const ctaButtonStyle: React.CSSProperties = {
    padding: "15px 20px",
    background: "linear-gradient(135deg, #84cc16 0%, #22c55e 42%, #14b8a6 100%)",
    color: "#02130a",
    border: "1px solid rgba(190,242,100,0.48)",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
    letterSpacing: "-0.01em",
    boxShadow: "0 20px 60px rgba(34,197,94,0.34), inset 0 1px 0 rgba(255,255,255,0.35)",
  };

  const ghostButtonStyle: React.CSSProperties = {
    padding: "12px 16px",
    background: "linear-gradient(180deg, rgba(15,23,42,0.72), rgba(2,6,23,0.82))",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 42px rgba(0,0,0,0.20)",
  };

useEffect(() => {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  if (!clientKey) {
    console.warn("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum di-set.");
    return;
  }

  const snapScriptSrc = "https://app.midtrans.com/snap/snap.js";

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${snapScriptSrc}"]`
  );

  if (existingScript) return;

  const script = document.createElement("script");
  script.src = snapScriptSrc;
  script.setAttribute("data-client-key", clientKey);
  script.async = true;

  document.body.appendChild(script);
}, []);
  
useEffect(() => {
  let isMounted = true;

  async function loadUserAndProducts(redirectIfMissing = true) {
    if (isMounted) setPageLoading(true);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const user = sessionData.session?.user ?? null;

    if (sessionError || !user) {
      if (!isMounted) return;
      setCurrentUserId(null);
      setUserEmail(null);
      setProducts([]);
      setProfile(null);
      setPageLoading(false);
      if (redirectIfMissing) router.replace("/login");
      return;
    }

    if (!isMounted) return;

    setCurrentUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data: profileData, error: profileError } = await db
      .from("profiles")
      .select("role, plan, pro_until, email")
      .eq("email", user.email)
      .maybeSingle();

    if (profileError) {
      console.error("Gagal mengambil profile:", profileError);
    }

    if (!isMounted) return;
    setProfile((profileData as Profile | null) ?? null);

const { data: productData, error: productError } = await db
  .from("products")   // WAJIB ADA )
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

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event: any, session: any) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
      loadUserAndProducts(false);
      return;
    }

    if (event === "SIGNED_OUT" || !session?.user) {
      setCurrentUserId(null);
      setUserEmail(null);
      setProducts([]);
      setProfile(null);
      setPageLoading(false);
      router.replace("/login");
    }
  });

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, [router]);
  
  useEffect(() => {
    if (products.length === 0) {
      setHistory([]);
      return;
    }

    const today = new Date().toLocaleDateString("id-ID");
    setHistory([{ date: today, totalProfit, totalRevenue, avgMargin }]);
  }, [products, totalProfit, totalRevenue, avgMargin]);

  useEffect(() => {
    if (products.length > 0 && isPro) {
      setAiAnswer(generateFullBusinessInsight());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, isPro]);

  useEffect(() => {
    if (!isPro && products.length > 0 && riskScore >= 35) {
      const timer = window.setTimeout(() => setShowLossPopup(true), 950);
      return () => window.clearTimeout(timer);
    }
  }, [isPro, products.length, riskScore]);

  useEffect(() => {
    try {
      const alreadySeen = window.localStorage.getItem("untungin_onboarding_seen");
      if (!alreadySeen) setShowOnboarding(true);
      const savedGoal = window.localStorage.getItem("untungin_profit_goal");
      if (savedGoal) setProfitGoal(savedGoal);
    } catch {
      setShowOnboarding(products.length === 0);
    }
  }, [products.length]);

  useEffect(() => {
    try {
      window.localStorage.setItem("untungin_profit_goal", profitGoal);
    } catch {}
  }, [profitGoal]);


  useEffect(() => {
    const timer = window.setInterval(() => {
      setConversionCountdown((prev) => (prev <= 1 ? CONVERSION_DEADLINE_HOURS * 60 * 60 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function ensureLoggedIn() {
    if (!currentUserId) {
      alert("Harus login dulu supaya data tersimpan di cloud.");
      return false;
    }
    return true;
  }

  async function handleLogout() {
    if (!isPro && products.length > 0 && dailyLeakEstimate > 0) {
      const confirmed = window.confirm(`Sebelum logout: AI masih melihat potensi bocor ${money(dailyLeakEstimate)} hari ini. Tetap logout?`);
      if (!confirmed) return;
    }

    await supabase.auth.signOut();
    setCurrentUserId(null);
    setUserEmail(null);
    setProducts([]);
    setHistory([]);
    setProfile(null);
    router.replace("/login");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openUpgradeModal(plan: UpgradePlan = "lifetime") {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  }

  function openProfitRescue(plan: UpgradePlan = "lifetime") {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  }

  async function handleUpgradeMidtrans(plan: UpgradePlan = selectedPlan) {
    if (!ensureLoggedIn()) return;

    if (!userEmail) {
      alert("Email user tidak ditemukan. Coba logout lalu login ulang.");
      return;
    }

    setUpgradeLoading(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          plan,
          amount: getPlanAmount(plan),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(getErrorMessage(data?.error || data));
      }

      if (!data?.token) {
        throw new Error("Token pembayaran Midtrans tidak ditemukan dari server.");
      }

      const snap = window.snap;

      if (!snap?.pay) {
        throw new Error("Midtrans Snap belum siap. Refresh halaman lalu coba lagi.");
      }

      snap.pay(data.token, {
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
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
      setUpgradeLoading(false);
    }
  }

  function exportReportCSV() {
    if (!isPro) {
      openUpgradeModal("lifetime");
      return;
    }

    if (products.length === 0) {
      alert("Belum ada produk untuk diexport.");
      return;
    }

    const headers = [
      "Nama Barang",
      "Modal",
      "Harga Jual",
      "Terjual",
      "Biaya Lain",
      "Profit",
      "Margin",
      "Keputusan",
      "Harga Saran",
      "Alasan",
    ];
    const rows = proActionPlan.map((item) => [
      item.name,
      item.costPrice,
      item.sellingPrice,
      item.quantitySold,
      item.otherCost,
      item.profit,
      `${item.margin.toFixed(1)}%`,
      item.decision,
      item.recommendedPrice,
      item.reason,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `untungin-ai-pro-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleShopeeCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

        const importedProducts = rows.slice(0, remainingSlot).map((row, index) => {
          const name =
            String(
              row["Nama Barang"] ||
                row["Nama Barang / Nama Variasi"] ||
                row["Product Name"] ||
                `Produk Shopee ${index + 1}`
            );

          const sellingPrice = parseNumber(
            row["Harga Setelah Diskon"] ||
              row["Harga Jual"] ||
              row["Total Harga Produk"] ||
              row["Subtotal Produk"] ||
              0
          );
          const quantitySold =
            parseNumber(row["Jumlah"] || row["Jumlah Produk di Pesan"] || row["Quantity"] || 1) || 1;
          const stockInitial =
            parseNumber(
              row["Stok Awal"] ||
                row["Stock"] ||
                row["Stok"] ||
                row["Initial Stock"] ||
                row["Jumlah Stok"] ||
                quantitySold
            ) || quantitySold;
          const stockRemaining = Math.max(stockInitial - quantitySold, 0);
          const otherCost = parseNumber(
            row["Biaya Admin"] ||
              row["Biaya Layanan"] ||
              row["Voucher Ditanggung Penjual"] ||
              row["Biaya Iklan"] ||
              0
          );
          const costPrice = parseNumber(
            row["Modal"] ||
              row["Harga Modal"] ||
              row["HPP"] ||
              row["Cost Price"] ||
              row["Harga Pokok"] ||
              0
          );
          const profit = (sellingPrice - costPrice) * quantitySold - otherCost;
          const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;

          return {
            user_id: currentUserId,
            name,
            cost_price: costPrice,
            selling_price: sellingPrice,
            quantity_sold: quantitySold,
            stock_initial: stockInitial,
            stock_remaining: stockRemaining,
            other_cost: otherCost,
            profit,
            margin,
          };
        });

        const importResult = await db
          .from("products")
          .insert(importedProducts as any)
          .select("*");

        const data = importResult.data;
        const error = importResult.error;

        if (error) {
          console.error(error);
          alert("Gagal import CSV ke database.");
          e.target.value = "";
          setSyncing(false);
          return;
        }

        if (data) setProducts((prev) => [...(data as ProductRow[]).map(mapProductRow), ...prev]);
        if (!isPro) {
          setShowLeakAlert(true);
          setTimeout(() => openUpgradeModal("lifetime"), 2400);
        }
        if (!isPro && rows.length > remainingSlot) setTimeout(() => openUpgradeModal("lifetime"), 500);

        setLastSync(new Date().toLocaleString("id-ID"));
        setSyncing(false);
        alert(`Berhasil sync ${importedProducts.length} produk dari CSV Shopee 🚀`);
        e.target.value = "";
      },
      error: (error) => {
        console.error(error);
        alert("Gagal membaca file CSV.");
        e.target.value = "";
        setSyncing(false);
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureLoggedIn()) return;

    if (!isPro && products.length >= FREE_PRODUCT_LIMIT) {
      openUpgradeModal("lifetime");
      return;
    }

    setLoading(true);
    setResult("");
    setProfit(null);

    const costPrice = Number(form.costPrice);
    const sellingPrice = Number(form.sellingPrice);
    const stockInitial = Number(form.stockInitial);
    const quantitySold = Number(form.quantitySold);
    const stockRemaining = Math.max(stockInitial - quantitySold, 0);
    const otherCost = Number(form.otherCost);

    if (
      !form.productName.trim() ||
      costPrice < 0 ||
      sellingPrice <= 0 ||
      stockInitial < 0 ||
      quantitySold <= 0 ||
      quantitySold > stockInitial ||
      otherCost < 0
    ) {
      alert("Cek lagi input kamu. Harga jual, jumlah stok barang, dan jumlah terjual harus valid. Jumlah terjual tidak boleh melebihi jumlah stok barang.");
      setLoading(false);
      return;
    }

    const profitValue = (sellingPrice - costPrice) * quantitySold - otherCost;
    const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;

    try {
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const insertResult = await db
        .from("products")
        .insert([
          {
            user_id: currentUserId,
            name: form.productName,
            cost_price: costPrice,
            selling_price: sellingPrice,
            quantity_sold: quantitySold,
            stock_initial: stockInitial,
            stock_remaining: stockRemaining,
            other_cost: otherCost,
            profit: profitValue,
            margin,
          } as any,
        ] as any)
        .select("*")
        .single();

      const insertedProduct = insertResult.data;
      const error = insertResult.error;

      if (error) {
        console.error(error);
        alert("Gagal menyimpan produk ke database.");
        return;
      }

      if (insertedProduct) setProducts((prev) => [mapProductRow(insertedProduct as ProductRow), ...prev]);

      setProfit(profitValue);
      setResult(
        profitValue < 0
          ? `🚨 Produk ini rugi ${money(Math.abs(profitValue))}. Jangan tambah stok sebelum harga dan biaya diperbaiki.`
          : margin < 10
          ? `⚠️ Profit positif, tapi margin hanya ${percent(margin)}. Produk ini rawan habis oleh diskon/admin/iklan.`
          : margin < 20
          ? `🟡 Produk masih perlu optimasi. Targetkan margin minimal 20%-25% sebelum scale.`
          : `✅ Produk sehat. Profit ${money(profitValue)} dengan margin ${percent(margin)}. Layak dipantau untuk scale.`
      );

      setForm({
        productName: "",
        costPrice: "",
        sellingPrice: "",
        stockInitial: "",
        quantitySold: "",
        otherCost: "",
      });

      if (!isPro) {
        setShowLeakAlert(true);
        setTimeout(() => openUpgradeModal("lifetime"), 2400);
      }
    } catch (error) {
      console.error(error);
      setResult("Terjadi error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

async function deleteProduct(id: string) {
  if (!ensureLoggedIn()) return;
  if (!currentUserId) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUserId as string);

  if (error) {
    console.error(error);
    alert("Gagal menghapus produk.");
    return;
  }

  setProducts((prev) => prev.filter((item) => item.id !== id));
}

async function resetAll() {
  if (!ensureLoggedIn()) return;
  if (!currentUserId) return;

  const confirmed = window.confirm("Yakin hapus semua produk dari database?");
  if (!confirmed) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("user_id", currentUserId as string);

  if (error) {
    console.error(error);
    alert("Gagal reset data.");
    return;
  }

  setProducts([]);
  setHistory([]);
  setResult("");
  setProfit(null);
  setShowLeakAlert(false);
}

  function generateFullBusinessInsight() {
    if (products.length === 0) {
      return "Tambahkan minimal 1 produk dulu agar AI CFO bisa membaca kondisi bisnis kamu.";
    }

    const topRevenueProduct =
      products.length > 0
        ? [...products].sort(
            (a, b) => b.sellingPrice * b.quantitySold - a.sellingPrice * a.quantitySold
          )[0]
        : null;
    const topProfitShare = bestProduct && totalProfit > 0 ? (bestProduct.profit / totalProfit) * 100 : 0;
    const topRevenueShare =
      topRevenueProduct && totalRevenue > 0
        ? ((topRevenueProduct.sellingPrice * topRevenueProduct.quantitySold) / totalRevenue) * 100
        : 0;
    const concentrationWarning =
      topProfitShare >= 55
        ? `⚠️ WOW Insight: ${bestProduct?.name} menyumbang sekitar ${percent(
            topProfitShare
          )} profit. Kalau produk ini drop, bisnis ikut terpukul.`
        : topRevenueShare >= 55
        ? `⚠️ WOW Insight: ${topRevenueProduct?.name} menyumbang sekitar ${percent(
            topRevenueShare
          )} omzet. Jangan terlalu bergantung pada satu produk.`
        : "✅ Distribusi profit belum terlalu bergantung pada satu produk.";

    const marginSignal =
      avgMargin >= 25
        ? "Margin rata-rata sudah sehat. Fokus berikutnya adalah scale produk paling kuat dan jaga biaya tetap stabil."
        : avgMargin >= 10
        ? "Margin rata-rata masih tipis. Prioritasnya: naikkan harga produk rawan, kurangi voucher, dan cek biaya admin/iklan."
        : "Margin rata-rata berbahaya. Jangan scale dulu sebelum harga dan biaya diperbaiki.";

    return `📊 Ringkasan AI CFO

Total produk dianalisis: ${products.length}
Omzet: ${money(totalRevenue)}
Profit bersih: ${money(totalProfit)}
Margin rata-rata: ${percent(avgMargin)}
Unit terjual: ${totalUnits.toLocaleString("id-ID")}

Deteksi risiko:
- Produk rugi: ${lossProducts.length}
- Produk margin rendah (<10%): ${lowMarginProducts.length}
- Produk sehat (margin >=20%): ${healthyProducts.length}
- Estimasi profit bocor: ${money(profitLeak)}

${concentrationWarning}

Kesimpulan:
${marginSignal}

Rekomendasi utama:
1. ${
      bestProduct
        ? `Scale produk "${bestProduct.name}" karena profitnya paling tinggi (${money(bestProduct.profit)}).`
        : "Tambah data produk untuk menemukan produk scale."
    }
2. ${
      worstProduct
        ? `Evaluasi "${worstProduct.name}" karena performanya paling lemah (${money(worstProduct.profit)}).`
        : "Belum ada produk yang perlu dievaluasi."
    }
3. Naikkan harga produk margin rendah minimal Rp1.000-Rp2.000 atau tekan biaya admin/iklan.
4. Jangan tambah stok untuk produk rugi sebelum profit per transaksi aman.

Prioritas hari ini:
${
  proStopProducts.length > 0
    ? `Stop iklan/stok untuk ${proStopProducts[0].name} sampai harga dan biaya diperbaiki.`
    : proFixProducts.length > 0
    ? `Perbaiki harga ${proFixProducts[0].name} ke sekitar ${money(proFixProducts[0].recommendedPrice)}.`
    : bestProduct
    ? `Dorong traffic ke ${bestProduct.name}.`
    : "Tambah data produk."
}`;
  }

  function smartAiCfo(question: string) {
    if (products.length === 0) {
      return "Tambahkan minimal 1 produk dulu agar AI CFO bisa membaca profit, margin, biaya, dan peluang scale bisnis kamu.";
    }

    const q = question.toLowerCase().trim();
    const askedQuestion = question.trim() || "Buat diagnosis CFO lengkap untuk bisnis saya.";
    const targetMargin = 25;
    const premiumTargetMargin = 30;
    const unitSafe = (item: Product) => Math.max(item.quantitySold, 1);
    const unitOtherCost = (item: Product) => item.otherCost / unitSafe(item);
    const revenueOf = (item: Product) => item.sellingPrice * item.quantitySold;
    const safePrice = (item: Product, margin: number) =>
      Math.ceil((item.costPrice + unitOtherCost(item)) / (1 - margin / 100));
    const promoFloor = (item: Product) => Math.ceil((item.costPrice + unitOtherCost(item)) / 0.9);

    const scoredProducts = proActionPlan.map((item) => {
      const revenue = revenueOf(item);
      const revenueShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      const profitShare = totalProfit > 0 ? (item.profit / totalProfit) * 100 : 0;
      const safe25 = safePrice(item, targetMargin);
      const premium30 = safePrice(item, premiumTargetMargin);
      const leakPerUnit = Math.max(0, safe25 - item.sellingPrice);
      const estimatedLeak = leakPerUnit * item.quantitySold;
      const marginScore = clamp(Math.round(item.margin * 2.2), 0, 45);
      const profitScore = clamp(Math.round((item.profit / Math.max(Math.abs(totalProfit), 1)) * 35), -20, 35);
      const volumeScore = clamp(Math.round((item.quantitySold / Math.max(totalUnits, 1)) * 20), 0, 20);
      const score = clamp(
        50 + marginScore + profitScore + volumeScore - (item.profit < 0 ? 35 : 0) - (item.margin < 10 ? 18 : 0),
        0,
        100
      );

      const segment =
        item.profit < 0
          ? "STOP LOSS"
          : item.margin < 10
          ? "DARURAT MARGIN"
          : item.margin < 20
          ? "FIX PRICE"
          : revenueShare >= 20 || profitShare >= 20
          ? "HERO PRODUCT"
          : item.margin >= 30
          ? "PREMIUM MARGIN"
          : "STABLE";

      const decision =
        segment === "STOP LOSS"
          ? "Stop iklan/stok dulu"
          : segment === "DARURAT MARGIN"
          ? "Naikkan harga secepatnya"
          : segment === "FIX PRICE"
          ? "Optimasi harga dan biaya"
          : segment === "HERO PRODUCT"
          ? "Scale bertahap"
          : segment === "PREMIUM MARGIN"
          ? "Dorong bundling/traffic"
          : "Pantau dan test kecil";

      return {
        ...item,
        revenue,
        revenueShare,
        profitShare,
        leakPerUnit,
        estimatedLeak,
        score,
        segment,
        decision,
        safe25,
        premium30,
        promoFloor: promoFloor(item),
        unitOtherCost: unitOtherCost(item),
        netProfitPerUnit: item.profit / unitSafe(item),
      };
    });

    const ranking = [...scoredProducts].sort((a, b) => b.score - a.score);
    const scaleNow = ranking.filter((item) => item.profit > 0 && item.margin >= 20).slice(0, 5);
    const fixNow = [...scoredProducts]
      .filter((item) => item.profit >= 0 && item.margin < 20)
      .sort((a, b) => b.estimatedLeak - a.estimatedLeak)
      .slice(0, 5);
    const stopNow = [...scoredProducts]
      .filter((item) => item.profit < 0)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 5);
    const leakRanking = [...scoredProducts]
      .filter((item) => item.estimatedLeak > 0 || item.margin < 20 || item.profit < 0)
      .sort((a, b) => b.estimatedLeak - a.estimatedLeak)
      .slice(0, 6);

    const hero = scaleNow[0] || ranking[0];
    const weakest = [...scoredProducts].sort((a, b) => a.score - b.score)[0];

    const scenarioRaise1000 =
      products.reduce(
        (acc, item) => acc + ((item.sellingPrice + 1000 - item.costPrice) * item.quantitySold - item.otherCost),
        0
      ) - totalProfit;
    const scenarioRaise2000 =
      products.reduce(
        (acc, item) => acc + ((item.sellingPrice + 2000 - item.costPrice) * item.quantitySold - item.otherCost),
        0
      ) - totalProfit;
    const scenarioTarget25 = scoredProducts.reduce((acc, item) => {
      const targetProfit = (item.safe25 - item.costPrice) * item.quantitySold - item.otherCost;
      return acc + Math.max(0, targetProfit - item.profit);
    }, 0);
    const scenarioCutCost10 = products.reduce((acc, item) => acc + item.otherCost * 0.1, 0);
    const cashLeakTotal = Math.max(
      profitLeak,
      scenarioTarget25,
      leakRanking.reduce((acc, item) => acc + item.estimatedLeak, 0)
    );

    const dangerScore = clamp(
      Math.round(
        (stopNow.length / Math.max(products.length, 1)) * 35 +
          (fixNow.length / Math.max(products.length, 1)) * 25 +
          (avgMargin < 10 ? 28 : avgMargin < 20 ? 18 : avgMargin < 25 ? 8 : 0) +
          (totalProfit <= 0 ? 22 : 0) +
          (cashLeakTotal > totalProfit && totalProfit > 0 ? 10 : 0)
      ),
      0,
      100
    );
    const healthScore = clamp(100 - dangerScore, 0, 100);
    const growthScore = clamp(
      Math.round(
        (scaleNow.length / Math.max(products.length, 1)) * 45 +
          (avgMargin >= 30 ? 35 : avgMargin >= 20 ? 24 : avgMargin >= 10 ? 12 : 4) +
          (totalProfit > 0 ? 20 : 0)
      ),
      0,
      100
    );
    const pricingScore = clamp(Math.round(avgMargin * 2.8 - fixNow.length * 4 - stopNow.length * 8 + 35), 0, 100);
    const confidenceScore = clamp(55 + products.length * 6 + (totalUnits > 20 ? 10 : 0) + (history.length > 0 ? 6 : 0), 55, 96);

    const riskLevel =
      dangerScore >= 72
        ? "KRITIS"
        : dangerScore >= 48
        ? "WASPADA"
        : dangerScore >= 26
        ? "CUKUP AMAN"
        : "SEHAT";

    const cfoTone =
      riskLevel === "KRITIS"
        ? "Saya akan tegas: tahan scale. Fokus 24 jam ke depan adalah menutup produk rugi dan menaikkan harga produk margin tipis."
        : riskLevel === "WASPADA"
        ? "Bisnis masih bisa tumbuh, tapi omzet bisa menipu kalau produk margin tipis ikut di-scale. Rapikan harga sebelum tambah stok besar."
        : riskLevel === "CUKUP AMAN"
        ? "Fundamental cukup aman. Sekarang pilih produk pemenang, naikkan margin produk rawan, lalu scale bertahap."
        : "Bisnis terlihat sehat. Tantangan berikutnya adalah scale tanpa merusak margin dan tanpa diskon berlebihan.";

    const boardRoom = `🧠 AI CFO ELITE - Tanpa API

Pertanyaan kamu:
"${askedQuestion}"

⚠️ CFO Warning:
Kamu bukan cuma butuh omzet. Kamu butuh keputusan yang menyelamatkan profit. Jika tidak dikontrol, potensi profit bocor 30 hari bisa mendekati ${money(
      Math.max(cashLeakTotal * 4, estimatedMonthlyLoss)
    )}.

📌 Boardroom Summary:
- Business Health Score: ${healthScore}/100
- Growth Readiness Score: ${growthScore}/100
- Pricing Power Score: ${pricingScore}/100
- Confidence data: ${confidenceScore}%
- Level risiko: ${riskLevel}
- Total produk: ${products.length}
- Omzet: ${money(totalRevenue)}
- Profit bersih: ${money(totalProfit)}
- Margin rata-rata: ${percent(avgMargin)}
- Unit terjual: ${totalUnits.toLocaleString("id-ID")}
- Estimasi profit bocor: ${money(cashLeakTotal)}

Opini CFO:
${cfoTone}`;

    const rankAnswer = `

🏆 Ranking Produk Berdasarkan AI Score:
${ranking
  .slice(0, 8)
  .map(
    (item, index) => `${index + 1}. ${item.name}
   - AI Score: ${item.score}/100
   - Segment: ${item.segment}
   - Profit: ${money(item.profit)} | Margin: ${percent(item.margin)}
   - Kontribusi omzet: ${percent(item.revenueShare)}
   - Keputusan: ${item.decision}`
  )
  .join("\n")}`;

    const scaleAnswer = `

🚀 Produk yang layak di-scale:
${
  scaleNow.length > 0
    ? scaleNow
        .map(
          (item, index) => `${index + 1}. ${item.name}
   - Alasan: profit positif, margin ${percent(item.margin)}, score ${item.score}/100.
   - Cara scale: tambah stok kecil dulu, naikkan traffic bertahap, jangan diskon besar.
   - Batas aman promo: jangan jual di bawah ${money(item.promoFloor)}.`
        )
        .join("\n")
    : hero
    ? `Belum ada produk yang benar-benar aman untuk scale agresif. Kandidat terdekat: ${hero.name}, tapi cek margin dan biaya dulu.`
    : "Belum ada kandidat scale."
}`;

    const pricingAnswer = `

💰 Smart Pricing Engine:
${scoredProducts
  .slice(0, 8)
  .map((item, index) => {
    const gap25 = Math.max(0, item.safe25 - item.sellingPrice);
    const advice =
      item.profit < 0
        ? `harga sekarang merugikan. Minimal revisi ke ${money(item.safe25)} atau stop sementara.`
        : item.margin < 20
        ? `naikkan sekitar ${money(gap25)} untuk mengejar margin aman 25%.`
        : item.margin >= 30
        ? "harga sudah premium. Fokus bundling dan value, bukan diskon."
        : "harga cukup aman. Test kenaikan kecil Rp1.000-Rp2.000.";
    return `${index + 1}. ${item.name}
   - Harga sekarang: ${money(item.sellingPrice)}
   - Harga aman 25%: ${money(item.safe25)}
   - Target premium 30%: ${money(item.premium30)}
   - Lantai promo jangan di bawah: ${money(item.promoFloor)}
   - Saran CFO: ${advice}`;
  })
  .join("\n")}`;

    const leakAnswer = `

🕳️ Profit Leak Detector:
${
  leakRanking.length > 0
    ? leakRanking
        .map((item, index) => {
          const cause =
            item.profit < 0
              ? "rugi langsung"
              : item.margin < 10
              ? "margin sangat tipis"
              : item.margin < 20
              ? "margin belum aman"
              : item.estimatedLeak > 0
              ? "harga belum optimal"
              : "biaya perlu diaudit";
          return `${index + 1}. ${item.name}
   - Masalah utama: ${cause}
   - Margin: ${percent(item.margin)} | Profit/unit: ${money(item.netProfitPerUnit)}
   - Biaya lain/unit: ${money(item.unitOtherCost)}
   - Estimasi bocor: ${money(item.estimatedLeak)}
   - Fix: ${
     item.profit < 0
       ? "stop promo/iklan dan koreksi harga"
       : item.leakPerUnit > 0
       ? `naikkan harga minimal ${money(item.leakPerUnit)} per unit`
       : "audit admin, voucher, iklan, packing, dan retur"
   }.`;
        })
        .join("\n")
    : "Tidak ada kebocoran besar yang terlihat. Tetap pantau diskon, voucher, biaya admin, iklan, packing, dan retur."
}`;

    const whatIf = `

🧪 What-if Simulator:
- Jika semua harga naik Rp1.000: potensi tambahan profit ${money(scenarioRaise1000)}.
- Jika semua harga naik Rp2.000: potensi tambahan profit ${money(scenarioRaise2000)}.
- Jika produk rawan diarahkan ke margin 25%: potensi perbaikan ${money(scenarioTarget25)}.
- Jika biaya lain turun 10%: potensi hemat ${money(scenarioCutCost10)}.

Catatan CFO: jangan menaikkan semua harga membabi buta. Mulai dari produk margin tipis, demand stabil, dan gap harga kecil.`;

    const stopAnswer = `

🛑 Produk yang harus ditahan / distop dulu:
${
  stopNow.length > 0
    ? stopNow
        .map(
          (item, index) => `${index + 1}. ${item.name}
   - Rugi: ${money(item.profit)}
   - Margin: ${percent(item.margin)}
   - Keputusan: stop iklan/stok baru sampai harga minimal ${money(item.safe25)} atau biaya turun.`
        )
        .join("\n")
    : weakest
    ? `Tidak ada produk rugi langsung. Produk terlemah saat ini: ${weakest.name} dengan score ${weakest.score}/100. Pantau sebelum tambah stok besar.`
    : "Tidak ada produk yang perlu distop."
}`;

    const quickWins = `

⚡ Quick Wins 24 Jam:
${
  fixNow.length > 0
    ? fixNow
        .slice(0, 4)
        .map(
          (item, index) =>
            `${index + 1}. ${item.name}: ubah harga ke sekitar ${money(item.safe25)} atau kurangi biaya ${money(item.leakPerUnit)} per unit.`
        )
        .join("\n")
    : hero
    ? `1. Dorong traffic ke ${hero.name}.
2. Jaga harga minimum di ${money(hero.promoFloor)}.
3. Buat bundling agar margin tidak rusak oleh diskon.`
    : "Tambahkan data produk agar quick wins lebih akurat."
}`;

    const actionPlan = `

✅ Action Plan CFO:
Hari ini:
1. ${
      stopNow[0]
        ? `Stop iklan/stok untuk ${stopNow[0].name}.`
        : fixNow[0]
        ? `Revisi harga ${fixNow[0].name} ke sekitar ${money(fixNow[0].safe25)}.`
        : hero
        ? `Dorong traffic ke ${hero.name}.`
        : "Tambah data produk."
    }
2. Cek biaya admin, voucher, iklan, packing, dan retur.
3. Jangan tambah stok ke produk margin di bawah 10%.

7 hari:
1. Naikkan harga produk margin tipis secara bertahap.
2. Scale hanya produk dengan margin >=20% dan profit positif.
3. Buat bundling dari produk margin sehat.
4. Export laporan dan bandingkan profit sebelum/sesudah.

30 hari:
1. Jadikan produk score tertinggi sebagai hero product.
2. Buang atau reposisi produk yang terus bocor.
3. Bangun katalog dengan target margin minimal 25%.

Keputusan akhir CFO:
${
  riskLevel === "KRITIS"
    ? "Jangan mengejar omzet dulu. Selamatkan profit."
    : riskLevel === "WASPADA"
    ? "Boleh scale, tapi hanya produk sehat. Produk rawan harus diperbaiki harga/biayanya dulu."
    : "Scale produk terbaik dan pertahankan margin. Jangan biarkan diskon menghancurkan profit."
}`;

    const newProductAnswer = hero
      ? `

🛒 Ide produk baru berbasis data:
1. Varian dari hero product: ${hero.name}.
2. Produk pelengkap dengan modal rendah dan target margin 30%.
3. Bundling produk sehat + produk fast moving.
4. Hindari produk baru yang butuh modal besar sebelum pricing produk lama stabil.

Rule CFO: tambah produk karena data, bukan feeling.`
      : `

🛒 Belum bisa memberi ide produk baru yang kuat karena belum ada hero product.`;

    const upsellHint = !isPro
      ? `

🔒 Preview AI selesai. Upgrade PRO membuka Ranking Produk, Smart Pricing Engine, Profit Leak Detector, What-if Simulator, dan Action Plan penuh.`
      : "";

    if (q.includes("scale") || q.includes("fokus") || q.includes("jual") || q.includes("ranking")) {
      return boardRoom + rankAnswer + scaleAnswer + leakAnswer + actionPlan + upsellHint;
    }

    if (q.includes("harga") || q.includes("naik") || q.includes("pricing") || q.includes("promo")) {
      return boardRoom + pricingAnswer + whatIf + quickWins + actionPlan + upsellHint;
    }

    if (q.includes("profit kecil") || q.includes("kenapa") || q.includes("margin") || q.includes("tipis") || q.includes("bocor")) {
      return boardRoom + leakAnswer + pricingAnswer + whatIf + quickWins + actionPlan + upsellHint;
    }

    if (q.includes("tambah") || q.includes("produk baru") || q.includes("jualan apa") || q.includes("ide")) {
      return boardRoom + rankAnswer + newProductAnswer + scaleAnswer + actionPlan + upsellHint;
    }

    if (q.includes("stop") || q.includes("rugi") || q.includes("evaluasi")) {
      return boardRoom + stopAnswer + leakAnswer + quickWins + actionPlan + upsellHint;
    }

    return boardRoom + rankAnswer + scaleAnswer + pricingAnswer + leakAnswer + whatIf + stopAnswer + quickWins + actionPlan + upsellHint;
  }

  async function askAiCfo(question = aiQuestion) {
    if (products.length === 0) {
      setAiAnswer("Tambahkan data produk dulu. AI CFO butuh minimal 1 produk untuk membaca profit, margin, dan biaya.");
      return;
    }

    if (!isPro) {
      setAiAnswer(`🚨 AI sudah menemukan sinyal profit bocor.

🔒 Diagnosis lengkap dikunci:
- produk mana yang rugi
- harga aman tiap produk
- produk yang harus distop
- action plan fix 24 jam`);
      openUpgradeModal("lifetime");
      return;
    }

    setAiLoading(true);
    setAiAnswer("🧠 AI CFO sedang membaca omzet, margin, harga, biaya bocor, dan peluang scale...");

    window.setTimeout(() => {
      const aiResult = smartAiCfo(question || "Buat ringkasan bisnis dan action plan hari ini.");

      if (!isPro) {
        const previewLines = aiResult.split("\n").slice(0, 6).join("\n");
        setAiAnswer(`${previewLines}

🚨 AI sudah menemukan potensi keputusan yang bisa menyelamatkan profit kamu.

🔒 Buka PRO untuk melihat:
- produk mana yang harus distop
- harga aman tiap produk
- estimasi uang bocor
- action plan 24 jam untuk menaikkan profit`);
      } else {
        setAiAnswer(aiResult);
      }

      setAiLoading(false);
    }, 700);
  }

  function exportPremiumPDFReport() {
    if (!isPro) {
      openUpgradeModal("lifetime");
      return;
    }

    if (products.length === 0) {
      alert("Belum ada produk untuk dibuat laporan PDF.");
      return;
    }

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Popup browser diblokir. Izinkan popup untuk export PDF.");
      return;
    }

    const rows = proActionPlan
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${money(item.profit)}</td>
            <td>${percent(item.margin)}</td>
            <td>${item.decision}</td>
            <td>${money(item.recommendedPrice)}</td>
          </tr>`
      )
      .join("");

    reportWindow.document.write(`
      <html>
        <head>
          <title>Untungin.ai Premium CFO Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 22px 0; }
            .card { border: 1px solid #d1d5db; border-radius: 14px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background: #ecfdf5; }
            .action { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 14px; margin-top: 18px; }
          </style>
        </head>
        <body>
          <h1>Untungin.ai Premium CFO Report</h1>
          <p>Laporan otomatis profit, margin, risiko, dan action plan.</p>
          <div class="grid">
            <div class="card"><b>Profit</b><br/>${money(totalProfit)}</div>
            <div class="card"><b>Omzet</b><br/>${money(totalRevenue)}</div>
            <div class="card"><b>Margin</b><br/>${percent(avgMargin)}</div>
            <div class="card"><b>Risk Score</b><br/>${riskScore}/100</div>
          </div>
          <div class="action">
            <b>Next Best Action:</b><br/>${oneThingAction}
          </div>
          <table>
            <thead><tr><th>Produk</th><th>Profit</th><th>Margin</th><th>Keputusan</th><th>Harga Aman</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print()</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  }

  function completeOnboarding() {
    try {
      window.localStorage.setItem("untungin_onboarding_seen", "1");
    } catch {}
    setShowOnboarding(false);
  }

  if (pageLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              border: "4px solid #064e3b",
              borderTopColor: "#22c55e",
              margin: "0 auto 16px",
            }}
          />
          <p>Loading Untungin.ai...</p>
        </div>
      </main>
    );
  }

  if (!currentUserId) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 8% -4%, rgba(132,204,22,0.22), transparent 28%), radial-gradient(circle at 88% 8%, rgba(20,184,166,0.23), transparent 30%), radial-gradient(circle at 50% 110%, rgba(59,130,246,0.18), transparent 34%), linear-gradient(135deg, #020617 0%, #07111f 42%, #030712 72%, #000 100%)",
        color: "white",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        padding: 24,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        button { transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease; }
        button:hover { transform: translateY(-2px) scale(1.01); filter: brightness(1.06); }
        button:active { transform: translateY(0) scale(0.99); }
        input:focus, textarea:focus {
          border-color: rgba(34,197,94,0.64) !important;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.10), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        input::placeholder, textarea::placeholder { color: rgba(203,213,225,0.46); }
        .media-orb {
          position: fixed;
          inset: auto auto 7% -120px;
          width: 280px;
          height: 280px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(34,197,94,0.22), transparent 66%);
          filter: blur(8px);
          pointer-events: none;
          z-index: 0;
        }
        .media-grid-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 54px 54px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.78), transparent 78%);
          z-index: 0;
        }
        .premium-shell { position: relative; z-index: 1; }
        .hero-title {
          background: linear-gradient(90deg, #ffffff 0%, #dcfce7 38%, #86efac 72%, #67e8f9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 18px 70px rgba(34,197,94,0.13);
        }
        .media-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, rgba(34,197,94,0.06));
        }
        .shine-chip {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 14px 40px rgba(0,0,0,0.22);
        }
        .ticker {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          white-space: nowrap;
          animation: floatPulse 3.8s ease-in-out infinite;
        }
        @keyframes floatPulse {
          0%, 100% { transform: translateY(0); opacity: 0.88; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes conversionPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.20), 0 24px 70px rgba(0,0,0,0.32); }
          50% { box-shadow: 0 0 0 10px rgba(248,113,113,0.06), 0 28px 90px rgba(248,113,113,0.10); }
        }
        .premium-lock {
          filter: blur(5px);
          user-select: none;
          opacity: .72;
        }
        .conversion-pulse {
          animation: conversionPulse 2.8s ease-in-out infinite;
        }
        @media (max-width: 980px) {
          .premium-grid, .main-grid, .three-grid, .two-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 40px !important; letter-spacing: -1.3px !important; }
          .product-row, .action-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="media-grid-bg" />
      <div className="media-orb" />


      {showStickyOffer && !isPro && products.length > 0 && (
        <div
          className="conversion-pulse"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 18,
            transform: "translateX(-50%)",
            width: "min(980px, calc(100vw - 32px))",
            zIndex: 997,
            padding: 12,
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(127,29,29,0.94), rgba(2,6,23,0.96))",
            border: "1px solid rgba(248,113,113,0.42)",
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 12,
            alignItems: "center",
            boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
          }}
        >
          <div>
            <strong style={{ color: "#fecaca" }}>🚨 {premiumPainHeadline}</strong>
            <br />
            <small style={{ color: "#cbd5e1" }}>PRO bisa balik modal ±{paybackDays} hari jika leak ini benar terjadi.</small>
          </div>
          <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, padding: "11px 14px" }}>
            Buka Solusi
          </button>
          <button onClick={() => setShowStickyOffer(false)} style={{ background: "transparent", color: "white", border: "none", fontSize: 20, cursor: "pointer" }}>
            ×
          </button>
        </div>
      )}

      {showOnboarding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              ...cardStyle,
              maxWidth: 720,
              width: "100%",
              border: "1px solid rgba(34,197,94,0.48)",
              background: "linear-gradient(135deg, rgba(6,78,59,0.94), rgba(2,6,23,0.98))",
            }}
          >
            <p style={{ marginTop: 0, color: "#86efac", fontWeight: 950 }}>🚀 Onboarding Profit Rescue</p>
            <h2 style={{ margin: "8px 0", fontSize: 34 }}>3 langkah bikin seller paham value aplikasi</h2>
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {[
                ["1", "Masukkan produk", "User cukup isi modal, harga jual, stok, terjual, dan biaya lain."],
                ["2", "Lihat uang bocor", "Dashboard langsung menunjukkan profit, margin, risiko, dan alert produk bermasalah."],
                ["3", "Upgrade untuk solusi", "Free melihat alarm. PRO membuka produk penyebab, harga aman, checklist, PDF, dan AI CFO lengkap."],
              ].map(([num, title, desc], index) => (
                <button
                  key={num}
                  onClick={() => setOnboardingStep(index)}
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 18,
                    border: onboardingStep === index ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.18)",
                    background: onboardingStep === index ? "rgba(34,197,94,0.14)" : "rgba(2,6,23,0.72)",
                    color: "white",
                  }}
                >
                  <strong>{num}. {title}</strong>
                  <br />
                  <small style={{ color: "#cbd5e1" }}>{desc}</small>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button onClick={completeOnboarding} style={ctaButtonStyle}>Mulai pakai dashboard</button>
              <button onClick={() => setShowOnboarding(false)} style={ghostButtonStyle}>Lewati dulu</button>
            </div>
          </div>
        </div>
      )}

      {selectedDiagnosis && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.76)",
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div style={{ ...cardStyle, maxWidth: 640, width: "100%", border: "1px solid rgba(34,197,94,0.42)" }}>
            <button onClick={() => setSelectedDiagnosis(null)} style={{ float: "right", background: "transparent", color: "white", border: "none", fontSize: 26, cursor: "pointer" }}>×</button>
            <p style={{ marginTop: 0, color: "#86efac", fontWeight: 950 }}>🔍 Auto Diagnosis Produk</p>
            <h2>{selectedDiagnosis.name}</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.75 }}>
              {getDiagnosisText(
                selectedDiagnosis,
                proActionPlan.find((item) => item.id === selectedDiagnosis.id)?.recommendedPrice || selectedDiagnosis.sellingPrice
              )}
            </p>
            {!isPro && (
              <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, width: "100%" }}>
                🔓 Buka diagnosis lengkap semua produk
              </button>
            )}
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              ...cardStyle,
              maxWidth: 620,
              width: "100%",
              border: "1px solid rgba(34,197,94,0.55)",
              background: "linear-gradient(135deg, rgba(6,78,59,0.94), rgba(2,6,23,0.96))",
            }}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                float: "right",
                background: "transparent",
                color: "white",
                border: "none",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <p style={{ color: "#86efac", fontWeight: 900, marginTop: 0 }}>
              🚨 Kamu hampir kehilangan {money(estimatedMonthlyLoss)}/bulan TANPA sadar
            </p>
            <h2 style={{ marginBottom: 8, fontSize: 32 }}>
              Buka Produk Penyebab Rugi
            </h2>
            <p style={{ opacity: 0.76, lineHeight: 1.7 }}>
              AI sudah menemukan produk rugi, margin bocor, dan harga salah. Detail produk penyebab dan harga aman dikunci untuk akun Free.
            </p>

            <div
              className="two-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}
            >
              {[
                ["monthly", "PRO Bulanan", MONTHLY_PRICE, "Fleksibel untuk mulai"],
                ["lifetime", "Lifetime 🔥", LIFETIME_PRICE, `Early user tersisa ${earlyUserSlotLeft} slot`],
              ].map(([key, title, price, desc]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key as UpgradePlan)}
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    border: selectedPlan === key ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.22)",
                    background: selectedPlan === key ? "rgba(34,197,94,0.14)" : "rgba(2,6,23,0.72)",
                    color: "white",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <strong style={{ fontSize: 16 }}>{title}</strong>
                  <br />
                  <span style={{ color: "#86efac", fontWeight: 900 }}>{price}</span>
                  <br />
                  <small style={{ opacity: 0.65 }}>{desc}</small>
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 18,
                background: "rgba(2,6,23,0.72)",
                border: "1px solid rgba(34,197,94,0.24)",
              }}
            >
              <p style={{ margin: "0 0 8px", color: "#86efac", fontWeight: 800 }}>
                Yang kamu lihat setelah upgrade:
              </p>
              <div style={{ display: "grid", gap: 8, color: "#cbd5e1" }}>
                <span>✅ Produk mana yang rugi dan harus dihentikan</span>
                <span>✅ Harga aman per produk untuk menutup profit bocor</span>
                <span>✅ Keputusan jelas: Scale, Optimasi, atau Stop</span>
                <span>✅ Action plan 24 jam + export laporan profit</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 18,
                background: "rgba(2,6,23,0.76)",
                border: "1px solid rgba(34,197,94,0.24)",
              }}
            >
              <p style={{ marginTop: 0, color: "#86efac", fontWeight: 900 }}>
                🔓 Buka diagnosis profit via Midtrans
              </p>
              <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
                Paket terpilih: <b>{getPlanLabel(selectedPlan)}</b>. Setelah pembayaran sukses, akun kamu akan otomatis menjadi PRO.
              </p>

              <button
                onClick={() => handleUpgradeMidtrans(selectedPlan)}
                disabled={upgradeLoading}
                style={{
                  ...ctaButtonStyle,
                  width: "100%",
                  marginTop: 10,
                  opacity: upgradeLoading ? 0.7 : 1,
                }}
              >
                {upgradeLoading ? "Membuka pembayaran..." : `🔓 Buka Data Produk Penyebab Rugi`}
              </button>
            </div>

            <p style={{ fontSize: 12, opacity: 0.58, textAlign: "center" }}>
              Catatan: pembayaran diproses oleh Midtrans. Setelah transaksi sukses, PRO aktif otomatis lewat webhook.
            </p>
          </div>
        </div>
      )}

      {showLossPopup && !isPro && products.length > 0 && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            width: "min(420px, calc(100vw - 36px))",
            zIndex: 998,
            ...cardStyle,
            padding: 20,
            border: "1px solid rgba(248,113,113,0.5)",
            background: "linear-gradient(135deg, rgba(127,29,29,0.92), rgba(2,6,23,0.96))",
          }}
        >
          <button
            onClick={() => setShowLossPopup(false)}
            style={{ float: "right", background: "transparent", border: "none", color: "white", fontSize: 22, cursor: "pointer" }}
          >
            ×
          </button>
          <p style={{ margin: 0, color: "#fca5a5", fontWeight: 950 }}>⚠️ Profit Loss Alert</p>
          <h3 style={{ margin: "8px 0", fontSize: 24 }}>{conversionHeadline}</h3>
          <p style={{ color: "#cbd5e1", lineHeight: 1.65, marginBottom: 14 }}>
            AI sudah tahu langkah pertama yang harus kamu lakukan: <b>{oneThingAction}</b>
          </p>
          <div style={{ padding: 13, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(248,113,113,0.22)", marginBottom: 12 }}>
            <small style={{ color: "#fca5a5", fontWeight: 900 }}>Unlocked di PRO:</small>
            <div style={{ display: "grid", gap: 5, color: "#cbd5e1", marginTop: 8, fontSize: 13 }}>
              <span>• Produk penyebab bocor</span>
              <span>• Harga aman per produk</span>
              <span>• Action plan {urgencyDeadlineText}</span>
            </div>
          </div>
          <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, width: "100%" }}>
            🔓 Buka Solusi Profit Bocor
          </button>
        </div>
      )}

      <section className="premium-shell" style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 22 }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #22c55e, #14b8a6)",
                fontWeight: 900,
              }}
            >
              U
            </div>
            <div>
              <strong>Untungin.ai</strong>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Premium Profit OS untuk Seller
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: isPro ? "rgba(34,197,94,0.14)" : "rgba(245,158,11,0.12)",
                color: isPro ? "#86efac" : "#fbbf24",
                border: isPro ? "1px solid rgba(34,197,94,0.32)" : "1px solid rgba(245,158,11,0.22)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {isPro ? `PRO Aktif${proExpiryText ? ` sampai ${proExpiryText}` : ""}` : proExpired ? "PRO Expired" : "Free Plan"}
            </span>
            <span
              title="Mode testing: role dan plan dari database"
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.72)",
                color: "#cbd5e1",
                border: "1px solid rgba(148,163,184,0.22)",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {(profile?.role || "user")} | {(profile?.plan || "free")}
            </span>
            <button onClick={exportReportCSV} style={ghostButtonStyle}>
              {isPro ? "Export CSV" : "🔒 Export PRO"}
            </button>
            {!isPro && (
              <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                {proExpired ? "Perpanjang PRO" : "Upgrade PRO"}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push(ADMIN_PRO_PATH)}
                style={{ ...ghostButtonStyle, borderColor: "rgba(34,197,94,0.32)", color: "#86efac" }}
              >
                Admin PRO
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                ...ghostButtonStyle,
                background: "rgba(127,29,29,0.62)",
                borderColor: "rgba(248,113,113,0.24)",
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        {proExpired && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: "1px solid rgba(248,113,113,0.38)",
              background: "linear-gradient(135deg, rgba(127,29,29,0.6), rgba(2,6,23,0.86))",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, color: "#fca5a5", fontWeight: 900 }}>
                  ⏳ Masa aktif PRO kamu sudah habis
                </p>
                <h2 style={{ margin: "6px 0" }}>Perpanjang untuk membuka kembali fitur PRO</h2>
                <p style={{ margin: 0, color: "#cbd5e1" }}>
                  AI CFO lengkap, export laporan, unlimited produk, dan Smart Pricing akan aktif lagi setelah admin verifikasi pembayaran.
                </p>
              </div>
              <button onClick={() => openUpgradeModal("monthly")} style={ctaButtonStyle}>
                Perpanjang PRO
              </button>
            </div>
          </div>
        )}

        <header
          className="media-card"
          style={{
            ...cardStyle,
            padding: "48px 38px",
            marginBottom: 24,
            border: "1px solid rgba(134,239,172,0.26)",
            background:
              "radial-gradient(circle at 16% 0%, rgba(132,204,22,0.20), transparent 34%), radial-gradient(circle at 88% 16%, rgba(6,182,212,0.18), transparent 32%), linear-gradient(135deg, rgba(6,78,59,0.58), rgba(2,6,23,0.94))",
          }}
        >
          <div className="premium-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 28, alignItems: "center" }}>
            <div>
              <div
                className="shine-chip ticker"
                style={{
                  display: "inline-flex",
                  gap: 9,
                  alignItems: "center",
                  padding: "9px 14px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(6,182,212,0.10))",
                  color: "#bbf7d0",
                  border: "1px solid rgba(134,239,172,0.24)",
                  fontWeight: 950,
                  marginBottom: 18,
                }}
              >
                ✦ Multimedia Profit Command Center {isPro ? "• Full Access" : "• Preview Mode"}
              </div>
              <h1 className="hero-title" style={{ fontSize: 64, lineHeight: 0.98, margin: 0, letterSpacing: -2.8, maxWidth: 820 }}>
                {premiumPainHeadline}
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.78, maxWidth: 760 }}>
                SaaS premium conversion mode: user langsung melihat rasa sakit finansial, estimasi uang bocor, payback PRO, dan keputusan AI CFO yang harus dilakukan hari ini.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
                <button onClick={() => document.getElementById("profit-form")?.scrollIntoView({ behavior: "smooth" })} style={ctaButtonStyle}>
                  🚨 Cek Uang Bocor Saya
                </button>
                <button onClick={() => document.getElementById("ai-cfo")?.scrollIntoView({ behavior: "smooth" })} style={ghostButtonStyle}>
                  🧠 Tanya AI CFO
                </button>
              </div>
            </div>

            <div className="media-card" style={{ padding: 24, borderRadius: 30, background: "linear-gradient(160deg, rgba(2,6,23,0.74), rgba(15,23,42,0.62))", border: "1px solid rgba(134,239,172,0.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 70px rgba(0,0,0,0.34)" }}>
              <p style={{ margin: 0, color: "#94a3b8" }}>Profit bersih hari ini</p>
              <h2 style={{ fontSize: 42, margin: "8px 0", color: totalProfit >= 0 ? "#86efac" : "#fca5a5" }}>
                {money(totalProfit)}
              </h2>
              {!isPro && (
                <div
                  style={{
                    margin: "12px 0 14px",
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: "linear-gradient(135deg, rgba(127,29,29,0.48), rgba(69,26,3,0.38))",
                    border: "1px solid rgba(248,113,113,0.36)",
                  }}
                >
                  <small style={{ color: "#fca5a5", fontWeight: 950 }}>
                    ⏱️ Uang yang berpotensi bocor hari ini
                  </small>
                  <div style={{ fontSize: 28, fontWeight: 950, color: "#fca5a5", marginTop: 4 }}>
                    {money(dailyLeakEstimate)}
                  </div>
                  <small style={{ color: "#cbd5e1" }}>Detail penyebab dikunci di PRO</small>
                </div>
              )}
              <Sparkline data={sparklineData} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div>
                  <small style={{ color: "#94a3b8" }}>Omzet</small>
                  <br />
                  <strong>{money(totalRevenue)}</strong>
                </div>
                <div>
                  <small style={{ color: "#94a3b8" }}>Margin</small>
                  <br />
                  <strong>{percent(avgMargin)}</strong>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section
          className="media-card"
          style={{
            ...cardStyle,
            marginBottom: 24,
            padding: "18px 22px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
            background: "linear-gradient(90deg, rgba(34,197,94,0.14), rgba(6,182,212,0.08), rgba(2,6,23,0.72))",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 28 }}>🎬</span>
            <div>
              <strong style={{ fontSize: 18 }}>Visual Selling Layer aktif</strong>
              <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>
                Dibuat lebih cinematic: glow, glass card, urgency ribbon, dan decision hierarchy untuk menaikkan trust + conversion.
              </p>
            </div>
          </div>
          {!isPro && (
            <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
              🔓 Unlock Full CFO View
            </button>
          )}
        </section>

        <section
          className="conversion-pulse"
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(248,113,113,0.38)",
            background: "radial-gradient(circle at 8% 0%, rgba(248,113,113,0.24), transparent 32%), linear-gradient(135deg, rgba(69,10,10,0.72), rgba(2,6,23,0.94))",
          }}
        >
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#fecaca", fontWeight: 950 }}>💣 SaaS Premium Conversion Engine</p>
              <h2 style={{ margin: "8px 0", fontSize: 34 }}>{premiumPainHeadline}</h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.75 }}>
                Ini bagian yang bikin user merasa “kalau saya tutup sekarang, saya rugi”. Sistem menampilkan loss, ROI, urgency, dan preview terkunci dalam satu layar.
              </p>
              <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
                <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(248,113,113,0.22)" }}>
                  <small style={{ color: "#fca5a5" }}>Leak hari ini</small><br />
                  <strong style={{ fontSize: 22, color: "#fecaca" }}>{money(dailyLeakEstimate)}</strong>
                </div>
                <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(34,197,94,0.20)" }}>
                  <small style={{ color: "#86efac" }}>Estimasi ROI</small><br />
                  <strong style={{ fontSize: 22, color: "#86efac" }}>{roiMultiple}x</strong>
                </div>
                <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(245,158,11,0.22)" }}>
                  <small style={{ color: "#fbbf24" }}>Offer reset dalam</small><br />
                  <strong style={{ fontSize: 22, color: "#fde68a" }}>{formatCountdown(conversionCountdown)}</strong>
                </div>
              </div>
            </div>
            <div style={{ padding: 18, borderRadius: 24, background: "rgba(2,6,23,0.78)", border: "1px solid rgba(248,113,113,0.24)" }}>
              <p style={{ marginTop: 0, color: "#fca5a5", fontWeight: 950 }}>🔒 Locked CFO Preview</p>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)" }}>
                  <small style={{ color: "#94a3b8" }}>Produk paling berbahaya</small><br />
                  <strong className={isPro ? "" : "premium-lock"}>{isPro ? lockedWorstProduct : "████████████"}</strong>
                </div>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)" }}>
                  <small style={{ color: "#94a3b8" }}>Harga aman yang disarankan</small><br />
                  <strong className={isPro ? "" : "premium-lock"}>{isPro ? money(lockedSafePrice) : "Rp██.███"}</strong>
                </div>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)" }}>
                  <small style={{ color: "#94a3b8" }}>Command CFO</small><br />
                  <strong style={{ color: riskScore >= 50 ? "#fca5a5" : "#86efac" }}>{cfoCommandLabel}</strong>
                </div>
              </div>
              {!isPro && <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, width: "100%", marginTop: 14 }}>🔓 Buka Data yang Dikunci</button>}
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(34,197,94,0.24)",
            background: "linear-gradient(135deg, rgba(2,6,23,0.92), rgba(6,78,59,0.32))",
          }}
        >
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>📊 Visual Leak Map</p>
              <h2 style={{ margin: "8px 0" }}>Produk mana yang paling banyak membakar profit?</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {leakMap.length === 0 ? (
                  <p style={{ color: "#94a3b8" }}>Tambahkan produk untuk memunculkan leak map.</p>
                ) : leakMap.map((item, index) => (
                  <div key={item.id} style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{index + 1}. {isPro || index === 0 ? item.name : "Produk terkunci PRO"}</strong>
                      <span style={{ color: item.leak > 0 ? "#fca5a5" : "#86efac", fontWeight: 900 }}>{isPro || index === 0 ? money(item.leak) : "Rp███"}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 99, background: "rgba(15,23,42,0.9)", overflow: "hidden", border: "1px solid rgba(148,163,184,0.12)" }}>
                      <div style={{ width: `${Math.max(8, (item.leak / maxLeakMapValue) * 100)}%`, height: "100%", borderRadius: 99, background: item.leak > 0 ? "linear-gradient(90deg,#ef4444,#f59e0b)" : "linear-gradient(90deg,#22c55e,#14b8a6)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ margin: 0, color: "#fbbf24", fontWeight: 950 }}>🧠 Objection Crusher</p>
              <h2 style={{ margin: "8px 0" }}>Jawab alasan user sebelum mereka pergi</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {(["mahal", "nanti", "percaya"] as const).map((item) => (
                  <button key={item} onClick={() => setSelectedObjection(item)} style={{ ...ghostButtonStyle, borderColor: selectedObjection === item ? "rgba(34,197,94,0.48)" : "rgba(148,163,184,0.16)", color: selectedObjection === item ? "#86efac" : "white" }}>
                    {item === "mahal" ? "Terlalu mahal" : item === "nanti" ? "Nanti saja" : "Bisa dipercaya?"}
                  </button>
                ))}
              </div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.78)", border: "1px solid rgba(245,158,11,0.20)", color: "#e5e7eb", lineHeight: 1.7 }}>
                {getObjectionAnswer(selectedObjection, dailyLeakEstimate, selectedPlanAmount)}
              </div>
              {!isPro && <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Saya Mau Selamatkan Profit</button>}
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(34,197,94,0.24)",
          }}
        >
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18, alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>🎯 Goal Profit Bulanan</p>
              <h2 style={{ margin: "8px 0" }}>{money(totalProfit)} / {money(profitGoalValue)}</h2>
              <div style={{ height: 12, borderRadius: 999, background: "rgba(15,23,42,0.9)", overflow: "hidden", border: "1px solid rgba(148,163,184,0.16)" }}>
                <div style={{ width: `${goalProgress}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#14b8a6)", borderRadius: 999 }} />
              </div>
              <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
                Progress {goalProgress}%. Sisa target profit: <b style={{ color: "#e5e7eb" }}>{money(remainingGoalProfit)}</b>.
              </p>
              <input
                value={profitGoal}
                onChange={(e) => setProfitGoal(e.target.value)}
                type="number"
                min="1"
                placeholder="Target profit bulanan"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>

            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>✅ AI Action Checklist</p>
              <h2 style={{ margin: "8px 0" }}>{completedActions}/{actionChecklist.length || 1} aksi selesai</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {actionChecklist.length === 0 ? (
                  <p style={{ color: "#94a3b8" }}>Tambahkan produk untuk membuat checklist otomatis.</p>
                ) : actionChecklist.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 16,
                      background: item.locked ? "rgba(15,23,42,0.54)" : "rgba(2,6,23,0.72)",
                      border: "1px solid rgba(148,163,184,0.14)",
                      filter: item.locked ? "blur(0.2px)" : "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedActions[item.id]}
                      disabled={item.locked}
                      onChange={(e) => setCheckedActions((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                    />
                    <span>
                      <strong>{item.locked ? "🔒 Action PRO terkunci" : item.title}</strong>
                      <br />
                      <small style={{ color: "#94a3b8" }}>{item.locked ? "Upgrade untuk membuka checklist lengkap." : item.detail}</small>
                    </span>
                    {item.locked && <button type="button" onClick={() => openUpgradeModal("lifetime")} style={{ ...ghostButtonStyle, padding: "8px 10px" }}>Buka</button>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(59,130,246,0.28)",
          }}
        >
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, color: "#93c5fd", fontWeight: 950 }}>🧪 Price Simulator Interaktif</p>
              <h2 style={{ margin: "8px 0" }}>Simulasikan harga sebelum rugi</h2>
              {products.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Tambahkan produk dulu untuk memakai simulator.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  <select
                    value={simulatorProduct?.id || ""}
                    onChange={(e) => {
                      const found = products.find((item) => item.id === e.target.value);
                      setSelectedSimulatorId(e.target.value);
                      setSimulatedPrice(found ? String(found.sellingPrice) : "");
                    }}
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <input
                    value={simulatedPrice || String(simulatorProduct?.sellingPrice || "")}
                    onChange={(e) => setSimulatedPrice(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="Harga simulasi"
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                      <small>Profit baru</small><br /><strong style={{ color: simulatorProfit >= 0 ? "#86efac" : "#fca5a5" }}>{money(simulatorProfit)}</strong>
                    </div>
                    <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                      <small>Margin baru</small><br /><strong>{percent(simulatorMargin)}</strong>
                    </div>
                    <div style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                      <small>Selisih</small><br /><strong style={{ color: simulatorDelta >= 0 ? "#86efac" : "#fca5a5" }}>{money(simulatorDelta)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p style={{ margin: 0, color: "#fbbf24", fontWeight: 950 }}>🥊 Competitor-style Pricing</p>
              <h2 style={{ margin: "8px 0" }}>Bandingkan dengan harga kompetitor</h2>
              <div style={{ display: "grid", gap: 10, maxHeight: 330, overflowY: "auto", paddingRight: 4 }}>
                {proActionPlan.slice(0, 6).map((item) => {
                  const comp = parseNumber(competitorPrices[item.id]);
                  return (
                    <div key={item.id} style={{ padding: 14, borderRadius: 16, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                      <strong>{item.name}</strong>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        <small style={{ color: "#94a3b8" }}>Harga kamu: {money(item.sellingPrice)}</small>
                        <input
                          value={competitorPrices[item.id] || ""}
                          onChange={(e) => setCompetitorPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          type="number"
                          min="0"
                          placeholder="Harga kompetitor"
                          style={{ ...inputStyle, padding: "10px 12px", borderRadius: 12 }}
                        />
                      </div>
                      <small style={{ display: "block", color: "#cbd5e1", marginTop: 8 }}>
                        {getCompetitorDecision(item, comp)}
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {showBeforeAfter && !isPro && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: "1px solid rgba(245,158,11,0.34)",
              background: "linear-gradient(135deg, rgba(69,26,3,0.66), rgba(2,6,23,0.92))",
            }}
          >
            <button onClick={() => setShowBeforeAfter(false)} style={{ float: "right", background: "transparent", color: "white", border: "none", fontSize: 22, cursor: "pointer" }}>×</button>
            <p style={{ margin: 0, color: "#fbbf24", fontWeight: 950 }}>🔐 Before / After PRO Preview</p>
            <h2 style={{ margin: "8px 0" }}>Free kasih alarm. PRO kasih keputusan.</h2>
            <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.74)", border: "1px solid rgba(148,163,184,0.16)" }}>
                <strong>Free</strong>
                <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Melihat estimasi bocor, jumlah produk berisiko, dan preview AI.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)" }}>
                <strong style={{ color: "#86efac" }}>PRO</strong>
                <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>Membuka harga aman, diagnosis tiap produk, checklist, PDF report, simulator, dan action plan CFO.</p>
              </div>
            </div>
            <button onClick={() => openUpgradeModal("lifetime")} style={{ ...ctaButtonStyle, marginTop: 14 }}>🔓 Unlock PRO View</button>
          </section>
        )}

        <section
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(34,197,94,0.22)",
          }}
        >
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 950 }}>📩 Retention Profit Report</p>
              <h2 style={{ margin: "8px 0" }}>Laporan harian/mingguan yang bikin user balik lagi</h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{retentionSummary}</p>
              <small style={{ color: "#94a3b8" }}>Versi produk: tampilkan ringkasan ini di email/WhatsApp/push notification untuk retention.</small>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={exportPremiumPDFReport} style={ctaButtonStyle}>{isPro ? "📄 Export PDF Premium" : "🔒 Export PDF PRO"}</button>
              <button onClick={() => setShowOnboarding(true)} style={ghostButtonStyle}>🚀 Lihat Onboarding Wizard</button>
            </div>
          </div>
        </section>

        {products.length > 0 && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: "1px solid rgba(34,197,94,0.28)",
              background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(2,6,23,0.94))",
            }}
          >
            <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, color: riskScore >= 50 ? "#fca5a5" : "#86efac", fontWeight: 950 }}>
                  🎯 Next Best Action dari AI CFO
                </p>
                <h2 style={{ margin: "7px 0" }}>{oneThingAction}</h2>
                <p style={{ margin: 0, color: "#94a3b8" }}>
                  Fokus satu keputusan dulu supaya seller tidak bingung: stop, fix harga, atau scale.
                </p>
              </div>
              {!isPro && (
                <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                  Buka Detail Action Plan
                </button>
              )}
            </div>
          </section>
        )}

        {showLeakAlert && !isPro && products.length > 0 && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: "1px solid rgba(248,113,113,0.5)",
              background:
                "linear-gradient(135deg, rgba(127,29,29,0.72), rgba(69,26,3,0.5), rgba(2,6,23,0.94))",
            }}
          >
            <div
              className="main-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ margin: 0, color: "#fca5a5", fontWeight: 950 }}>
                  🚨 AI Profit Leak Detector sedang membaca data kamu
                </p>
                <h2 style={{ margin: "8px 0", fontSize: 32 }}>
                  Ditemukan potensi uang bocor {money(aiLeakAlertAmount)}/bulan
                </h2>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.7 }}>
                  Estimasi bocor per hari sekitar <b>{money(dailyAiLeakAlertAmount)}</b>.
                  AI mendeteksi {criticalProducts.length} produk berisiko tinggi dan {productsNeedingFix.length} produk yang perlu optimasi harga.
                </p>

                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(2,6,23,0.72)",
                    border: "1px solid rgba(248,113,113,0.22)",
                  }}
                >
                  <strong style={{ color: "#fca5a5" }}>
                    Masalah terdeteksi:
                  </strong>
                  <div style={{ display: "grid", gap: 6, marginTop: 8, color: "#cbd5e1" }}>
                    <span>• Ada produk yang margin/profitnya berbahaya</span>
                    <span>• Harga aman dan produk penyebab masih dikunci</span>
                    <span>• Popup PRO akan membuka diagnosis lengkap</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 16,
                  borderRadius: 20,
                  background: "rgba(2,6,23,0.72)",
                  border: "1px solid rgba(248,113,113,0.24)",
                }}
              >
                <small style={{ color: "#94a3b8" }}>Yang dibuka di PRO</small>
                <strong style={{ color: "#fca5a5" }}>Produk penyebab profit bocor</strong>
                <strong style={{ color: "#fbbf24" }}>Harga aman per produk</strong>
                <strong style={{ color: "#86efac" }}>Action plan fix 24 jam</strong>
                <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                  🔓 Buka Diagnosis Lengkap
                </button>
                <button
                  onClick={() => setShowLeakAlert(false)}
                  style={{ ...ghostButtonStyle, padding: "10px 12px" }}
                >
                  Lihat dashboard dulu
                </button>
              </div>
            </div>
          </section>
        )}

        {hasRescueInsight && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: riskScore >= 50 ? "1px solid rgba(248,113,113,0.46)" : "1px solid rgba(34,197,94,0.32)",
              background:
                riskScore >= 50
                  ? "linear-gradient(135deg, rgba(127,29,29,0.58), rgba(2,6,23,0.9))"
                  : "linear-gradient(135deg, rgba(6,78,59,0.56), rgba(2,6,23,0.9))",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18, alignItems: "center" }} className="main-grid">
              <div>
                <p style={{ margin: 0, color: riskScore >= 50 ? "#fca5a5" : "#86efac", fontWeight: 950 }}>
                  🚨 Profit Rescue Score: {riskScore}/100 • {rescueTone}
                </p>
                <h2 style={{ margin: "8px 0", fontSize: 30 }}>
                  Estimasi uang bocor hari ini: {money(dailyLeakEstimate)}
                </h2>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
                  AI menemukan {criticalProducts.length} produk berisiko tinggi dan {productsNeedingFix.length} produk yang perlu optimasi harga.
                  {!isPro ? " Detail produk dan langkah penyelamatan dikunci di PRO." : " Detail lengkap sudah terbuka untuk akun PRO kamu."}
                </p>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(148,163,184,0.14)" }}>
                  <small style={{ color: "#94a3b8" }}>Potensi bocor 7 hari</small>
                  <h3 style={{ margin: "6px 0", color: "#fca5a5" }}>{money(weeklyLeakEstimate)}</h3>
                </div>
                {!isPro && (
                  <button onClick={() => openProfitRescue("lifetime")} style={ctaButtonStyle}>
                    🔓 Lihat Penyebab Profit Bocor
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {!isPro && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 24,
              border: "1px solid rgba(245,158,11,0.38)",
              background: "linear-gradient(135deg, rgba(69,26,3,0.72), rgba(2,6,23,0.86))",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, color: "#fbbf24", fontWeight: 900 }}>
                  🚨 Estimasi uang bocor {money(estimatedMonthlyLoss)}/bulan
                </p>
                <h2 style={{ margin: "6px 0" }}>Free cuma kasih alarm, bukan solusinya</h2>
                <p style={{ margin: 0, color: "#cbd5e1" }}>
                  Buka PRO untuk melihat produk penyebab rugi, harga aman, dan action plan 24 jam.
                </p>
              </div>
              <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                🔓 Selamatkan Profit Sekarang
              </button>
            </div>
          </div>
        )}

        <section className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            ["Profit Bersih", money(totalProfit), totalProfit >= 0 ? "#86efac" : "#fca5a5", "Real profit setelah biaya"],
            ["Omzet", money(totalRevenue), "white", `${totalUnits.toLocaleString("id-ID")} unit terjual`],
            ["Margin Rata-rata", percent(avgMargin), avgMargin < 10 ? "#fca5a5" : avgMargin < 20 ? "#fbbf24" : "#86efac", "Target aman >= 20%"],
            ["Produk Rugi", `${lossProducts.length}`, lossProducts.length ? "#fca5a5" : "#86efac", "Stop sebelum scale"],
            ["Stok Barang Menipis", `${lowStockProducts.length + outOfStockProducts.length}`, lowStockProducts.length + outOfStockProducts.length ? "#fbbf24" : "#86efac", `${totalRemainingStock.toLocaleString("id-ID")} stok barang tersisa`],
          ].map(([title, value, color, desc]) => (
            <div key={title} style={cardStyle}>
              <p style={{ margin: 0, color: "#94a3b8" }}>{title}</p>
              <h2 style={{ color, fontSize: 30, margin: "8px 0" }}>{value}</h2>
              <small style={{ color: "#94a3b8" }}>{desc}</small>
            </div>
          ))}
        </section>

        <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 24, alignItems: "start" }}>
          <div style={cardStyle} id="profit-form">
            <p style={{ margin: 0, color: "#86efac", fontWeight: 900 }}>Input Produk</p>
            <h2 style={{ marginTop: 6 }}>Tambah data profit real</h2>

            <div style={{ padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.72)", border: "1px dashed rgba(34,197,94,0.44)", marginBottom: 16 }}>
              <p style={{ marginTop: 0, fontWeight: 900 }}>📦 Import Laporan Shopee</p>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                Upload CSV Shopee. Free dibatasi {FREE_PRODUCT_LIMIT} produk, PRO unlimited import.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("shopee-upload")?.click()}
                disabled={syncing}
                style={{ ...ghostButtonStyle, width: "100%", background: syncing ? "#374151" : "rgba(29,78,216,0.72)" }}
              >
                {syncing ? "⏳ Syncing data..." : "🔄 Sync CSV Shopee"}
              </button>
              <input id="shopee-upload" type="file" accept=".csv" onChange={handleShopeeCSVUpload} style={{ display: "none" }} />
              {lastSync && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 0 }}>Last sync: {lastSync}</p>}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#86efac", fontWeight: 800 }}>Nama Barang</small>
                <input name="productName" placeholder="Contoh: Kerbau / Kopi / Ayam" value={form.productName} onChange={handleChange} style={inputStyle} required />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#86efac", fontWeight: 800 }}>Modal per Produk</small>
                <input name="costPrice" type="number" min="0" placeholder="Contoh: 100000" value={form.costPrice} onChange={handleChange} style={inputStyle} required />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#86efac", fontWeight: 800 }}>Harga Jual</small>
                <input name="sellingPrice" type="number" min="1" placeholder="Contoh: 200000" value={form.sellingPrice} onChange={handleChange} style={inputStyle} required />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#fbbf24", fontWeight: 900 }}>📦 Jumlah Stok Barang</small>
                <input name="stockInitial" type="number" min="0" placeholder="Contoh: 100 stok barang" value={form.stockInitial} onChange={handleChange} style={{ ...inputStyle, border: "1px solid rgba(245,158,11,0.42)" }} required />
                <small style={{ color: "#94a3b8" }}>
                  Isi jumlah barang yang kamu punya sekarang. Nanti stok otomatis berkurang dari jumlah terjual.
                </small>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#86efac", fontWeight: 800 }}>Jumlah Terjual</small>
                <input name="quantitySold" type="number" min="1" placeholder="Contoh: 50 terjual" value={form.quantitySold} onChange={handleChange} style={inputStyle} required />
              </label>

              {form.stockInitial && form.quantitySold && (
                <div
                  style={{
                    padding: 13,
                    borderRadius: 14,
                    background: "rgba(15,23,42,0.78)",
                    border: "1px solid rgba(245,158,11,0.28)",
                    color: "#fbbf24",
                    fontWeight: 900,
                  }}
                >
                  📦 Stok barang tersisa otomatis: {Math.max(Number(form.stockInitial || 0) - Number(form.quantitySold || 0), 0)} pcs
                </div>
              )}

              <label style={{ display: "grid", gap: 6 }}>
                <small style={{ color: "#86efac", fontWeight: 800 }}>Biaya Lain</small>
                <input name="otherCost" type="number" min="0" placeholder="Biaya admin, iklan, packing, operasional" value={form.otherCost} onChange={handleChange} style={inputStyle} required />
              </label>

              <button type="submit" disabled={loading || !currentUserId} style={{ ...ctaButtonStyle, opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Menganalisa..." : "🔍 Cek Profit Produk Ini"}
              </button>
            </form>

            {profit !== null && (
              <p style={{ color: profit >= 0 ? "#86efac" : "#fca5a5", fontWeight: 900 }}>
                Profit terakhir: {money(profit)}
              </p>
            )}
            {products.length > 0 && (
              <button onClick={resetAll} style={{ ...ghostButtonStyle, width: "100%", marginTop: 12, background: "rgba(127,29,29,0.52)" }}>
                Mulai Ulang Analisa Bisnis
              </button>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#86efac", fontWeight: 900 }}>Command Center</p>
            <h2 style={{ marginTop: 6 }}>Keputusan bisnis hari ini</h2>

            {products.length === 0 ? (
              <EmptyState title="Belum ada produk" description="Tambahkan produk pertama untuk membuka dashboard premium." />
            ) : (
              <>
                <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(127,29,29,0.32)", border: "1px solid rgba(248,113,113,0.24)" }}>
                    <small>Stop</small>
                    <h3 style={{ color: "#fca5a5" }}>{proStopProducts.length}</h3>
                  </div>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.24)" }}>
                    <small>Optimasi</small>
                    <h3 style={{ color: "#fbbf24" }}>{proFixProducts.length}</h3>
                  </div>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.24)" }}>
                    <small>Scale</small>
                    <h3 style={{ color: "#86efac" }}>{proScaleProducts.length}</h3>
                  </div>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(96,165,250,0.24)" }}>
                    <small>Restock</small>
                    <h3 style={{ color: "#93c5fd" }}>{restockNowProducts.length}</h3>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {proActionPlan.slice(0, 5).map((item) => (
                    <div
                      className="action-row"
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 0.9fr 0.9fr 1fr",
                        gap: 12,
                        alignItems: "center",
                        padding: 15,
                        borderRadius: 18,
                        background: "rgba(2,6,23,0.68)",
                        border: "1px solid rgba(148,163,184,0.14)",
                      }}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <br />
                        <small style={{ color: "#94a3b8" }}>Profit {money(item.profit)}</small>
                      </div>
                      <div>
                        <small style={{ color: "#94a3b8" }}>Margin {percent(item.margin)}</small>
                        <MarginBar value={item.margin} />
                      </div>
                      <div>
                        <small style={{ color: "#94a3b8" }}>Stok</small>
                        <br />
                        <strong style={{ color: item.stockRemaining <= 5 ? "#fbbf24" : "#e5e7eb" }}>
                          {item.stockRemaining}/{item.stockInitial}
                        </strong>
                        <br />
                        <small style={{ color: getStockStatus(item).color }}>{getStockStatus(item).label}</small>
                      </div>
                      <div>
                        <strong
                          style={{
                            color: item.decision.includes("STOP")
                              ? "#fca5a5"
                              : item.decision === "Scale"
                              ? "#86efac"
                              : "#fbbf24",
                          }}
                        >
                          {item.decision}
                        </strong>
                        <br />
                        <small style={{ color: "#94a3b8" }}>{isPro ? `Harga aman ${money(item.recommendedPrice)}` : "🔒 Harga aman PRO"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section id="ai-cfo" style={{ ...cardStyle, marginTop: 24, border: isPro ? "1px solid rgba(34,197,94,0.44)" : "1px solid rgba(148,163,184,0.18)" }}>
          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 20 }}>
            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 900 }}>
                🧠 AI CFO {isPro ? "Aktif" : "Preview"}
              </p>
              <h2 style={{ marginTop: 6 }}>Tanya apa pun tentang bisnis kamu</h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
                {isPro
                  ? "AI CFO membaca data produk, omzet, profit, margin, biaya bocor, simulasi harga, dan memberi action plan."
                  : "Free bisa melihat preview. Upgrade PRO membuka analisa lengkap dan rekomendasi detail."}
              </p>

              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 12 }}>
                {[
                  "Buat diagnosis CFO lengkap",
                  "Ranking produk terbaik",
                  "Produk mana yang bocor?",
                  "Harga mana yang perlu dinaikkan?",
                  "Produk mana yang harus distop?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAiQuestion(q);
                      askAiCfo(q);
                    }}
                    style={{ ...ghostButtonStyle, padding: "9px 11px", borderRadius: 999, fontSize: 12 }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Contoh: produk mana yang harus saya scale minggu ini?"
                style={{
                  width: "100%",
                  minHeight: 100,
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "rgba(2,6,23,0.76)",
                  color: "white",
                  padding: 14,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "Inter, Arial",
                }}
              />
              <button onClick={() => askAiCfo()} disabled={aiLoading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>
                {aiLoading ? "AI CFO sedang menganalisa..." : isPro ? "Tanya AI CFO" : "Lihat Preview AI CFO"}
              </button>
            </div>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "rgba(2,6,23,0.74)",
                padding: 20,
                borderRadius: 22,
                border: "1px solid rgba(148,163,184,0.14)",
                lineHeight: 1.75,
                fontSize: 14,
                margin: 0,
                maxHeight: 460,
                overflowY: "auto",
                color: isPro ? "#e5e7eb" : "#94a3b8",
              }}
            >
              {aiAnswer}
            </pre>
          </div>
        </section>

        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <section
            style={{
              ...cardStyle,
              marginTop: 24,
              border: "1px solid rgba(245,158,11,0.38)",
              background: "linear-gradient(135deg, rgba(69,26,3,0.72), rgba(2,6,23,0.9))",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, color: "#fbbf24", fontWeight: 950 }}>
                  📦 Alert Stok Barang Menipis
                </p>
                <h2 style={{ margin: "6px 0" }}>
                  {lowStockProducts.length + outOfStockProducts.length} produk butuh perhatian stok
                </h2>
                <p style={{ margin: 0, color: "#cbd5e1" }}>
                  AI menyarankan restock hanya untuk produk yang profit positif dan margin sehat. Produk rugi jangan direstock dulu.
                </p>
              </div>
              {!isPro && (
                <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                  🔓 Buka AI Restock Plan
                </button>
              )}
            </div>
          </section>
        )}

        {result && (
          <section style={{ ...cardStyle, marginTop: 24 }}>
            <h2 style={{ marginTop: 0 }}>🤖 Smart Business Insight Terakhir</h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "rgba(2,6,23,0.74)",
                padding: 18,
                borderRadius: 18,
                border: "1px solid rgba(148,163,184,0.14)",
                lineHeight: 1.7,
                fontSize: 14,
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {result}
            </pre>
          </section>
        )}

        <section style={{ ...cardStyle, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: "#86efac", fontWeight: 900 }}>Daftar Produk</p>
              <h2 style={{ marginTop: 6 }}>Ranking profit & risiko</h2>
            </div>
            <button onClick={exportReportCSV} style={ghostButtonStyle}>
              {isPro ? "Export laporan" : "🔒 Export PRO"}
            </button>
          </div>

          {products.length === 0 ? (
            <EmptyState title="Data masih kosong" description="Produk yang kamu input akan muncul di sini." />
          ) : (
            <>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
                {(["all", "loss", "fix", "scale", "stock"] as ProductFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    style={{
                      ...ghostButtonStyle,
                      padding: "9px 12px",
                      borderRadius: 999,
                      background: selectedFilter === filter ? "rgba(34,197,94,0.18)" : "rgba(2,6,23,0.72)",
                      borderColor: selectedFilter === filter ? "rgba(34,197,94,0.42)" : "rgba(148,163,184,0.22)",
                      color: selectedFilter === filter ? "#86efac" : "white",
                    }}
                  >
                    {getFilterLabel(filter)}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {filteredProducts.map((item, index) => (
                <div
                  className="product-row"
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.5fr 1.3fr 1fr 1fr 1fr 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(2,6,23,0.68)",
                    border: "1px solid rgba(148,163,184,0.14)",
                  }}
                >
                  <strong>#{index + 1}</strong>
                  <div>
                    <strong>{item.name}</strong>
                    <br />
                    <small
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        padding: "4px 8px",
                        borderRadius: 999,
                        color: getRiskBadge(item).color,
                        background: getRiskBadge(item).bg,
                        fontWeight: 900,
                      }}
                    >
                      {getRiskBadge(item).label}
                    </small>
                    <br />
                    <small style={{ color: "#94a3b8" }}>{item.quantitySold} terjual</small>
                  </div>
                  <div>
                    {money(item.sellingPrice)}
                    <br />
                    <small style={{ color: "#94a3b8" }}>Harga jual</small>
                  </div>
                  <div>
                    <span style={{ color: item.profit >= 0 ? "#86efac" : "#fca5a5", fontWeight: 900 }}>
                      {money(item.profit)}
                    </span>
                    <br />
                    <small style={{ color: "#94a3b8" }}>Profit</small>
                  </div>
                  <div>
                    <span>{percent(item.margin)}</span>
                    <MarginBar value={item.margin} />
                  </div>
                  <div>
                    <span style={{ color: getStockStatus(item).color, fontWeight: 900 }}>
                      {item.stockRemaining}/{item.stockInitial}
                    </span>
                    <br />
                    <small style={{ color: "#94a3b8" }}>Stok barang tersisa</small>
                    <br />
                    <small style={{ color: getStockStatus(item).color }}>{getRestockRecommendation(item)}</small>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <button onClick={() => setSelectedDiagnosis(item)} style={{ ...ghostButtonStyle, background: "rgba(34,197,94,0.12)", color: "#86efac" }}>
                      Diagnosis
                    </button>
                    <button onClick={() => deleteProduct(item.id)} style={{ ...ghostButtonStyle, background: "rgba(127,29,29,0.52)" }}>
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </section>

        <section
          style={{
            marginTop: 28,
            padding: 28,
            borderRadius: 28,
            background: "linear-gradient(135deg, rgba(6,78,59,0.64), rgba(2,6,23,0.92))",
            border: "1px solid rgba(34,197,94,0.32)",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{isPro ? "✅ PRO kamu sudah aktif" : "🚨 Buka Produk Penyebab Rugi"}</h2>
          <p style={{ color: "#cbd5e1" }}>
            {isPro
              ? "Gunakan AI CFO dan export laporan untuk mengambil keputusan harian."
              : "Lihat produk penyebab rugi, harga aman, dan action plan yang dikunci."}
          </p>

          {!isPro && (
            <div style={{ marginTop: 18, padding: 20, borderRadius: 20, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(34,197,94,0.26)", textAlign: "left" }}>
              <h3>💳 Pembayaran Buka Produk Penyebab Rugi</h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
                Bayar lewat Midtrans untuk membuka diagnosis lengkap dan menyelamatkan profit yang bocor.
              </p>
              <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {(["monthly", "lifetime"] as UpgradePlan[]).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: selectedPlan === plan ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.22)",
                      background: selectedPlan === plan ? "rgba(34,197,94,0.14)" : "rgba(2,6,23,0.72)",
                      color: "white",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <strong>{plan === "monthly" ? "PRO Bulanan" : "PRO Lifetime"}</strong>
                    <br />
                    <span style={{ color: "#86efac", fontWeight: 900 }}>
                      {plan === "monthly" ? MONTHLY_PRICE : LIFETIME_PRICE}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleUpgradeMidtrans(selectedPlan)}
                disabled={upgradeLoading}
                style={{ ...ctaButtonStyle, width: "100%", marginTop: 14, opacity: upgradeLoading ? 0.72 : 1 }}
              >
                {upgradeLoading ? "Membuka pembayaran..." : `🔓 Buka Data Produk Penyebab Rugi`}
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

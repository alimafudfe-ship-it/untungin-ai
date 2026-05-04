"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

const db: any = supabase;

type Product = {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantitySold: number;
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

type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  cost_price: number | string | null;
  selling_price: number | string | null;
  quantity_sold: number | string | null;
  other_cost: number | string | null;
  profit: number | string | null;
  margin: number | string | null;
  created_at?: string;
};

const FREE_PRODUCT_LIMIT = 3;
const MONTHLY_PRICE = "Rp29.000/bulan";
const LIFETIME_PRICE = "Rp99.000 sekali bayar";
const ADMIN_PRO_PATH = "/admin/pro";

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

export default function DashboardPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    productName: "",
    costPrice: "",
    sellingPrice: "",
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
  const earlyUserSlotLeft = 37;

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
  const sparklineData =
    history.length > 0 ? history.map((item) => item.totalProfit) : [0, totalProfit];

  const inputStyle: React.CSSProperties = {
    padding: "15px 16px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.74)",
    color: "white",
    fontSize: 15,
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.88))",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 30px 100px rgba(0,0,0,0.42)",
    backdropFilter: "blur(18px)",
  };

  const ctaButtonStyle: React.CSSProperties = {
    padding: "14px 18px",
    background: "linear-gradient(135deg, #22c55e, #14b8a6)",
    color: "white",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
    boxShadow: "0 18px 48px rgba(34,197,94,0.28)",
  };

  const ghostButtonStyle: React.CSSProperties = {
    padding: "12px 15px",
    background: "rgba(2,6,23,0.72)",
    color: "white",
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
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

  function ensureLoggedIn() {
    if (!currentUserId) {
      alert("Harus login dulu supaya data tersimpan di cloud.");
      return false;
    }
    return true;
  }

  async function handleLogout() {
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

  async function handleUpgradeMidtrans(plan: UpgradePlan = selectedPlan) {
    if (!ensureLoggedIn()) return;

    if (!userEmail) {
      alert("Email user tidak ditemukan. Coba logout lalu login ulang.");
      return;
    }

    const snap = (window as any).snap;

    if (!snap?.pay) {
      alert("Payment belum siap. Refresh halaman lalu coba lagi.");
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

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data?.error || "Gagal membuat payment Midtrans.");
      }

      snap.pay(data.token, {
        onSuccess: function () {
          alert("Pembayaran berhasil. PRO akan aktif otomatis setelah webhook Midtrans diproses.");
          window.location.reload();
        },
        onPending: function () {
          alert("Pembayaran masih pending. Selesaikan pembayaran, lalu refresh dashboard.");
        },
        onError: function () {
          alert("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: function () {
          setUpgradeLoading(false);
        },
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Terjadi error saat pembayaran.");
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
      "Nama Produk",
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
              row["Nama Produk"] ||
                row["Nama Produk / Nama Variasi"] ||
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
    const quantitySold = Number(form.quantitySold);
    const otherCost = Number(form.otherCost);

    if (
      !form.productName.trim() ||
      costPrice < 0 ||
      sellingPrice <= 0 ||
      quantitySold <= 0 ||
      otherCost < 0
    ) {
      alert("Cek lagi input kamu. Harga jual dan jumlah terjual harus lebih dari 0, biaya tidak boleh minus.");
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

      setForm({
        productName: "",
        costPrice: "",
        sellingPrice: "",
        quantitySold: "",
        otherCost: "",
      });

      if (!isPro && products.length === 1) setTimeout(() => openUpgradeModal("lifetime"), 800);
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

    setAiLoading(true);
    setAiAnswer("🧠 AI CFO sedang membaca omzet, margin, harga, biaya bocor, dan peluang scale...");

    window.setTimeout(() => {
      const aiResult = smartAiCfo(question || "Buat ringkasan bisnis dan action plan hari ini.");

      if (!isPro) {
        const previewLines = aiResult.split("\n").slice(0, 22).join("\n");
        setAiAnswer(`${previewLines}

🔒 Ini baru preview. Upgrade PRO membuka full action plan, Smart Pricing Premium, Profit Leak Detector, dan analisa lengkap semua produk.`);
      } else {
        setAiAnswer(aiResult);
      }

      setAiLoading(false);
    }, 700);
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
          "radial-gradient(circle at 10% 0%, rgba(34,197,94,0.24), transparent 32%), radial-gradient(circle at 90% 10%, rgba(20,184,166,0.18), transparent 30%), linear-gradient(135deg, #020617 0%, #030712 55%, #000 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 24,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button:hover { transform: translateY(-1px); filter: brightness(1.04); }
        button { transition: 160ms ease; }
        input::placeholder, textarea::placeholder { color: rgba(203,213,225,0.48); }
        @media (max-width: 980px) {
          .premium-grid, .main-grid, .three-grid, .two-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 38px !important; }
          .product-row, .action-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

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
              💸 AI CFO menemukan potensi profit tersembunyi {money(lockedPotentialProfit)}
            </p>
            <h2 style={{ marginBottom: 8, fontSize: 32 }}>
              Upgrade PRO Otomatis
            </h2>
            <p style={{ opacity: 0.76, lineHeight: 1.7 }}>
              Pilih paket PRO, bayar lewat Midtrans, lalu PRO aktif otomatis setelah pembayaran berhasil.
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
                Yang terbuka setelah pembayaran berhasil:
              </p>
              <div style={{ display: "grid", gap: 8, color: "#cbd5e1" }}>
                <span>✅ AI CFO membaca semua produk dan memberi action plan</span>
                <span>✅ Harga rekomendasi per produk dengan target margin aman</span>
                <span>✅ Produk dibagi: Scale, Optimasi, Stop</span>
                <span>✅ Export laporan profit lengkap</span>
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
                💳 Bayar otomatis via Midtrans
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
                {upgradeLoading ? "Membuka pembayaran..." : `💳 Bayar ${getPlanLabel(selectedPlan)}`}
              </button>
            </div>

            <p style={{ fontSize: 12, opacity: 0.58, textAlign: "center" }}>
              Catatan: pembayaran diproses oleh Midtrans. PRO aktif otomatis lewat webhook setelah transaksi sukses.
            </p>
          </div>
        </div>
      )}

      <section style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 22 }}>
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
          style={{
            ...cardStyle,
            padding: "42px 34px",
            marginBottom: 24,
            background: "linear-gradient(135deg, rgba(6,78,59,0.64), rgba(2,6,23,0.92))",
          }}
        >
          <div className="premium-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 28, alignItems: "center" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 13px",
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.14)",
                  color: "#86efac",
                  fontWeight: 800,
                  marginBottom: 16,
                }}
              >
                ✨ AI CFO Dashboard {isPro ? "• Full Access" : "• Preview Mode"}
              </div>
              <h1 className="hero-title" style={{ fontSize: 58, lineHeight: 1.02, margin: 0, letterSpacing: -2 }}>
                Jangan cuma lihat omzet. Buka profit sebenarnya.
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.75, maxWidth: 720 }}>
                Untungin.ai membantu seller membaca profit real, margin bocor, harga aman, dan keputusan scale/stop.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
                <button onClick={() => document.getElementById("profit-form")?.scrollIntoView({ behavior: "smooth" })} style={ctaButtonStyle}>
                  🔍 Cek Profit Sekarang
                </button>
                <button onClick={() => document.getElementById("ai-cfo")?.scrollIntoView({ behavior: "smooth" })} style={ghostButtonStyle}>
                  🧠 Tanya AI CFO
                </button>
              </div>
            </div>

            <div style={{ padding: 22, borderRadius: 26, background: "rgba(2,6,23,0.66)", border: "1px solid rgba(34,197,94,0.22)" }}>
              <p style={{ margin: 0, color: "#94a3b8" }}>Profit bersih hari ini</p>
              <h2 style={{ fontSize: 42, margin: "8px 0", color: totalProfit >= 0 ? "#86efac" : "#fca5a5" }}>
                {money(totalProfit)}
              </h2>
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
                  ⚠️ Profit bocor bisa mencapai {money(estimatedMonthlyLoss)}/bulan
                </p>
                <h2 style={{ margin: "6px 0" }}>Free plan membuka gambaran awal</h2>
                <p style={{ margin: 0, color: "#cbd5e1" }}>
                  Buka PRO untuk unlimited produk, AI CFO lengkap, Smart Pricing, Decision Engine, dan export laporan.
                </p>
              </div>
              <button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>
                🔓 Buka PRO Lifetime
              </button>
            </div>
          </div>
        )}

        <section className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            ["Profit Bersih", money(totalProfit), totalProfit >= 0 ? "#86efac" : "#fca5a5", "Real profit setelah biaya"],
            ["Omzet", money(totalRevenue), "white", `${totalUnits.toLocaleString("id-ID")} unit terjual`],
            ["Margin Rata-rata", percent(avgMargin), avgMargin < 10 ? "#fca5a5" : avgMargin < 20 ? "#fbbf24" : "#86efac", "Target aman >= 20%"],
            ["Produk Rugi", `${lossProducts.length}`, lossProducts.length ? "#fca5a5" : "#86efac", "Stop sebelum scale"],
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
              <input name="productName" placeholder="Nama produk" value={form.productName} onChange={handleChange} style={inputStyle} required />
              <input name="costPrice" type="number" min="0" placeholder="Modal per produk" value={form.costPrice} onChange={handleChange} style={inputStyle} required />
              <input name="sellingPrice" type="number" min="1" placeholder="Harga jual" value={form.sellingPrice} onChange={handleChange} style={inputStyle} required />
              <input name="quantitySold" type="number" min="1" placeholder="Jumlah terjual" value={form.quantitySold} onChange={handleChange} style={inputStyle} required />
              <input name="otherCost" type="number" min="0" placeholder="Biaya admin, iklan, packing, operasional" value={form.otherCost} onChange={handleChange} style={inputStyle} required />
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
                <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
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
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {proActionPlan.slice(0, 5).map((item) => (
                    <div
                      className="action-row"
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1fr 1fr",
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
                        <small style={{ color: "#94a3b8" }}>Saran {money(item.recommendedPrice)}</small>
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
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {sortedProducts.map((item, index) => (
                <div
                  className="product-row"
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.5fr 1.3fr 1fr 1fr 1fr auto",
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
                  <button onClick={() => deleteProduct(item.id)} style={{ ...ghostButtonStyle, background: "rgba(127,29,29,0.52)" }}>
                    Hapus
                  </button>
                </div>
              ))}
            </div>
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
          <h2 style={{ marginTop: 0 }}>{isPro ? "✅ PRO kamu sudah aktif" : "🚀 Buka Profit OS versi penuh"}</h2>
          <p style={{ color: "#cbd5e1" }}>
            {isPro
              ? "Gunakan AI CFO dan export laporan untuk mengambil keputusan harian."
              : "Bayar otomatis via Midtrans, lalu PRO aktif setelah pembayaran berhasil."}
          </p>

          {!isPro && (
            <div style={{ marginTop: 18, padding: 20, borderRadius: 20, background: "rgba(2,6,23,0.72)", border: "1px solid rgba(34,197,94,0.26)", textAlign: "left" }}>
              <h3>💳 Pembayaran Upgrade PRO Otomatis</h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
                Bayar lewat Midtrans. Setelah transaksi sukses, webhook akan mengaktifkan PRO otomatis.
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
                {upgradeLoading ? "Membuka pembayaran..." : `💳 Bayar ${getPlanLabel(selectedPlan)}`}
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

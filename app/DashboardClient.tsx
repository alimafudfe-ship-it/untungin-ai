"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabaseClient";
import type { Expense, ExpenseRow, Goal, Product, ProductFilter, ProductRow, Profile, StockMoveType, TabKey, UpgradePlan } from "@/types/dashboard";
import { DEMO_EXPENSES, DEMO_GOALS, DEMO_PRODUCTS, FREE_PRODUCT_LIMIT, MIDTRANS_REVIEW_MODE } from "@/lib/dashboard/constants";
import { useDashboardLocale } from "@/lib/dashboard/i18n";
import { calculateMargin, calculateProfit, getDashboardMetrics, isProfilePro, mapExpenseRow, mapProductRow } from "@/lib/dashboard/calculations";
import { AppShell } from "@/components/dashboard/AppShell";
import { cardStyle } from "@/components/dashboard/ui";
import { ExpensePanel, ExpenseFormState, ProductForm, ProductFormState } from "@/components/dashboard/Forms";
import { ProductTable } from "@/components/dashboard/ProductTable";
// ✅ BENAR: Karena kedua komponen di AdvancedPanels menggunakan Named Export ('export function')
import { AIRecommendationPanel, MarketplaceSyncPanel } from "@/components/dashboard/AdvancedPanels";
import { ReportsPanel } from "@/components/dashboard/ReportsPanel";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { MarketIntelligenceSuite } from "@/components/dashboard/MarketIntelligenceSuite";
import { getCashflowTrend, getProfitTrend } from "@/lib/dashboard/analytics";
import { parseNumber, getErrorMessage } from "@/lib/dashboard/format";
import { listWorkspaceStores, getOrCreateDefaultWorkspace, type Store } from "@/lib/saas/workspace";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: Record<string, unknown>) => void;
    };
  }
}

const db: any = supabase;

const initialProductForm: ProductFormState = { productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "TikTok" };
const initialExpenseForm: ExpenseFormState = { label: "", category: "Ops", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" };

function getPlanAmount(plan: UpgradePlan) {
  return plan === "monthly" ? 29000 : 99000;
}

export default function DashboardPage() {
  const locale = useDashboardLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey | string>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]); 
  const [decisions, setDecisions] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState<any>(null);
  const [loadingAiMetrics, setLoadingAiMetrics] = useState(false);
  const [marketData, setMarketData] = useState<any>({ products: [], keyword: "" });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals] = useState<Goal[]>(DEMO_GOALS);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>("all");
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>("lifetime");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [form, setForm] = useState<ProductFormState>(initialProductForm);

  const isPro = isProfilePro(profile);
  const metrics = useMemo(() => getDashboardMetrics(products, expenses), [products, expenses]);
  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.profit - a.profit), [products]);
  
  const filteredProducts = useMemo(() => {
    if (selectedFilter === "loss") return sortedProducts.filter((item) => item.profit < 0);
    if (selectedFilter === "fix") return sortedProducts.filter((item) => item.profit >= 0 && item.margin < 20);
    if (selectedFilter === "scale") return sortedProducts.filter((item) => item.profit > 0 && item.margin >= 20);
    if (selectedFilter === "stock") return sortedProducts.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15);
    return sortedProducts;
  }, [selectedFilter, sortedProducts]);

  // ====================================================================
  // FUNGSI NAVIGASI INTER-PANEL (CENTRALIZED HANDLERS)
  // ====================================================================
  const handleGoMarketplace = useCallback(() => {
    setActiveTab("integrasi");
  }, []);

  const handleGoProducts = useCallback(() => {
    setActiveTab("produk");
  }, []);

  const handleGoAI = useCallback(() => {
    setActiveTab("insight-ai");
  }, []);

  const handleGoBilling = useCallback(() => {
    setSelectedPlan("lifetime");
    setShowUpgradeModal(true);
  }, []);

  // ====================================================================
  // FUNGSI RISET PASAR - PURE REAL-TIME TIKTOK SHOP API CONNECTED
  // ====================================================================
  const handleDashboardScrape = useCallback(async (keywordInput: string) => {
    const cleanKeyword = keywordInput.trim();
    if (!cleanKeyword) return;
    
    setLoading(true);
    setMarketData({ products: [], keyword: cleanKeyword });

    try {
      const response = await fetch(`/api/market-intelligence/search?keyword=${encodeURIComponent(cleanKeyword)}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result.products) {
        setMarketData({
          products: Array.isArray(result.products) ? result.products : [],
          keyword: result.keyword || cleanKeyword
        }); 
      } else if (Array.isArray(result)) {
        setMarketData({ products: result, keyword: cleanKeyword });
      } else if (result && result.data) {
        setMarketData({ products: Array.isArray(result.data) ? result.data : [], keyword: cleanKeyword });
      } else {
        setMarketData({ products: [], keyword: cleanKeyword });
      }

    } catch (err) {
      console.error("Gagal melakukan riset pasar real-time:", err);
      alert("Gagal mengambil data real-time. Pastikan endpoint API internal dan koneksi internet Anda normal.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ====================================================================
  // FUNGSI AI CHAT BUSINESS ADVISOR (PERBAIKAN ERROR "NOT DEFINED")
  // ====================================================================
const sendMessage = useCallback(async () => {
    const cleanInput = chatInput.trim();
    if (!cleanInput) return;

    // 1. Masukkan chat user ke dalam balon chat secara instan
    setChatMessages((prev) => [...prev, { role: "user", text: cleanInput }]);
    setChatInput("");

    // 2. Tambahkan efek status "⚡ Sedang Mengetik" agar pengguna tahu AI sedang bekerja
    setChatMessages((prev) => [...prev, { role: "assistant", text: "⚡ AI sedang menganalisis data tokomu..." }]);

   try {
      // 🔑 TEMPELKAN KODE KUNCI AIzaSy YANG BARU ANDA SALIN DI BAWAH INI
      const GEMINI_API_KEY = "MASUKKAN_KODE_AIzaSy_ANDA_DI_SINI"; 

      // 3. Panggil API resmi Gemini menggunakan fetch bawaan browser
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
                      Anda adalah AI Business Advisor profesional untuk aplikasi SaaS Untungin.ai.
                      Tugas Anda adalah membantu user (seller/pedagang online) menganalisis performa toko mereka.
                      
                      Berikut adalah data riil toko pengguna saat ini:
                      - Jumlah Produk aktif: ${products.length} SKU
                      - Ringkasan Profitabilitas: ${JSON.stringify(products.slice(0, 5).map(p => ({ nama: p.name, untung: p.profit, stok: p.stockRemaining })))}
                      
                      Jawablah pertanyaan user di bawah ini secara ringkas, solutif, menggunakan Bahasa Indonesia yang ramah, dan berikan saran bisnis yang tajam:
                      "${cleanInput}"
                    `
                  }
                ]
              }
            ]
          }) // <-- TUTUP JSON.stringify DI SINI
        } // <-- TUTUP OBJEK FETCH DI SINI
      ); // <-- TUTUP FUNGSI FETCH DI SINI

      const json = await response.json();
      
      // Ambil teks jawaban asli dari struktur Google Gemini
      const aiText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI gagal memproses jawaban. Coba tanyakan lagi ya.";

      // 4. Perbarui status mengetik tadi dengan jawaban asli dari Gemini
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: aiText };
        return updated;
      });

    } catch (error) {
      console.error("Gemini API Error:", error);
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: "Aduh, koneksi ke server AI terputus. Pastikan internet Anda aktif dan coba lagi." };
        return updated;
      });
    }
  }, [chatInput, products]);
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER !== "midtrans") return;
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
    const DEMO_SESSION_KEY = "untungin_demo_session";
    function getDemoSession() {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
        return raw ? (JSON.parse(raw) as { id?: string; email?: string }) : null;
      } catch { return null; }
    }
    function loadDemoDashboard(demoSession?: { id?: string; email?: string } | null) {
      if (!isMounted) return;
      setSetupError(null);
      setCurrentUserId(demoSession?.id || "demo-user");
      setUserEmail(demoSession?.email || "alimafudfe+demo@gmail.com");
      setProducts(DEMO_PRODUCTS);
      setExpenses(DEMO_EXPENSES);
      setProfile({ role: "user", plan: "free", pro_until: null, email: demoSession?.email || "alimafudfe+demo@gmail.com" });
      setWorkspaceId(null); setStores([]); setSelectedStoreId(null); setIsDemoMode(true); setPageLoading(false);
    }
    async function loadUserAndData() {
      if (isMounted) setPageLoading(true);
      const demoSession = getDemoSession();
      if (demoSession?.id) { loadDemoDashboard(demoSession); return; }
      if (!hasSupabaseEnv) {
        if (!isMounted) return;
        setSetupError(supabaseConfigError || "Supabase ENV belum lengkap.");
        setPageLoading(false); return;
      }

      let sessionData: any = { session: null };
      try {
        const sessionResult = await supabase?.auth.getSession();
        sessionData = sessionResult?.data;
      } catch (authError) {
        loadDemoDashboard({ id: "demo-user", email: "alimafudfe+demo@gmail.com" }); return;
      }
      const user = sessionData?.session?.user ?? null;
      if (!user) {
        if (!isMounted) return;
        setPageLoading(false); router.replace(`/login?next=${encodeURIComponent("/")}`); return;
      }
      setSetupError(null);

      if (!isMounted) return;
      setCurrentUserId(user.id); setUserEmail(user.email ?? null); setIsDemoMode(false);
      let activeWorkspaceId: string | null = null;

      try {
        const workspace = await getOrCreateDefaultWorkspace({ id: user.id, email: user.email });
        if (!isMounted) return;
        setWorkspaceId(workspace.id); activeWorkspaceId = workspace.id;
        const storeList = await listWorkspaceStores(workspace.id);
        if (!isMounted) return;
        setStores(storeList); setSelectedStoreId(storeList[0]?.id ?? null);
      } catch (workspaceError) { console.warn(workspaceError); }

      const { data: profileData } = await db.from("profiles").select("role, plan, pro_until, email").eq("email", user.email).maybeSingle();
      if (!isMounted) return;
      setProfile((profileData as Profile | null) ?? { role: "user", plan: "free", pro_until: null, email: user.email });

      const productQuery = db.from("products").select("*").order("created_at", { ascending: false });
      const { data: productData } = activeWorkspaceId ? await productQuery.eq("workspace_id", activeWorkspaceId) : await productQuery.eq("user_id", user.id);
      if (!isMounted) return;
      setProducts(((productData || []) as ProductRow[]).map(mapProductRow));

      const expenseQuery = db.from("expenses").select("*").order("expense_date", { ascending: false }).limit(100);
      const { data: expenseData } = activeWorkspaceId ? await expenseQuery.eq("workspace_id", activeWorkspaceId) : await expenseQuery.eq("user_id", user.id);
      if (!isMounted) return;
      setExpenses(((expenseData || []) as ExpenseRow[]).map(mapExpenseRow));
      setPageLoading(false);
    }

    loadUserAndData();
    const authListener = supabase?.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") { loadUserAndData(); return; }
      if (event === "SIGNED_OUT" || !session?.user) {
        if (getDemoSession()?.id) return;
        setCurrentUserId(null); setProducts([]); setExpenses([]); setProfile(null); setPageLoading(false); router.replace("/login");
      }
    });

    return () => { isMounted = false; authListener?.data?.subscription?.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (!currentUserId || isDemoMode) return;

    async function loadAiMetrics() {
      try {
        setLoadingAiMetrics(true);
        const res = await fetch(`/api/metrics?user_id=${currentUserId}`);
        const json = await res.json();
        if (json.success) {
          setAiMetrics(json.data);
        }
      } catch (err) {
        console.error("AI Metrics error:", err);
      } finally {
        setLoadingAiMetrics(false);
      }
    }

    loadAiMetrics();
  }, [currentUserId, products, isDemoMode]);  

  function ensureLoggedIn() {
    if (!hasSupabaseEnv) { alert("Supabase ENV belum lengkap."); return false; }
    if (!currentUserId || isDemoMode) { router.replace(`/login?next=${encodeURIComponent("/")}`); return false; }
    return true;
  }

  useEffect(() => {
    if (!selectedProduct) return;

    async function loadAffiliates() {
      try {
        const res = await fetch(`/api/affiliates?product_id=${selectedProduct.id}`);
        const json = await res.json();
        if (json.success) {
          setAffiliateData(json.data);
        }
      } catch (err) {
        console.error("Affiliate load error:", err);
      }
    }

    loadAffiliates();
  }, [selectedProduct]);

  useEffect(() => {
    if (!currentUserId) return;

    async function loadDecisions() {
      const res = await fetch(`/api/ai/decision?user_id=${currentUserId}`);
      const json = await res.json();
      if (json.success) {
        setDecisions(json.data);
      }
    }

    loadDecisions();
  }, [currentUserId, products]);

  function openUpgradeModal(plan: UpgradePlan = "lifetime") { setSelectedPlan(plan); setShowUpgradeModal(true); }

  async function handleLogout() {
    if (typeof window !== "undefined") window.localStorage.removeItem("untungin_demo_session");
    await supabase?.auth.signOut().catch(() => null);
    router.replace("/login");
  }

  async function deleteProduct(id: string) {
    if (!ensureLoggedIn()) return;
    if (!window.confirm("Hapus produk ini?")) return;
    const { error } = await db.from("products").delete().eq("id", id).eq("user_id", currentUserId);
    if (error) { alert("Gagal menghapus produk."); return; }
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }

  const menuItems = [
    { key: "overview", label: "Dashboard", sublabel: "Ringkasan bisnis", section: "main" },
    { key: "integrasi", label: "Integrasi", sublabel: "Connect & import", section: "main" },
    { key: "market-intel", label: "Market Intel", sublabel: "Produk, toko, kreator", section: "main" },
    { key: "insight-ai", label: "Insight AI", sublabel: "Rekomendasi", section: "main" },
    { key: "laporan", label: "Laporan", sublabel: "PDF & CSV", section: "main" },
    { key: "produk", label: "Produk", sublabel: "HPP & margin", section: "old" },
    { key: "cashflow", label: "Cashflow", sublabel: "Masuk / keluar", section: "old" },
  ];

  if (pageLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Memuat Sistem Operasi Seller Untungin.ai...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", width: "100%" }}>
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: 260, background: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, padding: "24px 16px", overflowY: "auto" }}>
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#00b14f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 14 }}>U</div>
            <div>
              <strong style={{ fontSize: 16, color: "#0f172a", display: "block" }}>Untungin.ai</strong>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Sistem Operasi Seller</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: 8, paddingLeft: 8 }}>Menu Utama</span>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {menuItems.filter(i => i.section === "main").map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", background: isActive ? "#f0fdf4" : "transparent", transition: "all 0.2s", borderLeft: isActive ? "4px solid #00b14f" : "4px solid transparent", paddingLeft: isActive ? 10 : 14, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 600, color: isActive ? "#00b14f" : "#475569" }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: isActive ? "#16a34a" : "#94a3b8", marginTop: 2 }}>{item.sublabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: 8, paddingLeft: 8 }}>Menu Lainnya</span>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {menuItems.filter(i => i.section === "old").map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", background: isActive ? "#f1f5f9" : "transparent", transition: "all 0.2s", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 600, color: isActive ? "#0f172a" : "#475569" }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: isActive ? "#475569" : "#94a3b8", marginTop: 2 }}>{item.sublabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div style={{ ...cardStyle, background: "#f8fafc", padding: 14, marginTop: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 500, textAlign: "center" }}>
            Buka Fitur Market Intel & Rekomendasi AI
          </div>
          <button onClick={() => openUpgradeModal("lifetime")} style={{ width: "100%", padding: "10px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(0, 177, 79, 0.2)" }}>
            Naikkan ke PRO
          </button>
          <button onClick={handleLogout} style={{ width: "100%", marginTop: 8, padding: "4px", background: "transparent", color: "#94a3b8", border: "none", fontSize: 11, cursor: "pointer" }}>Keluar akun</button>
        </div>
      </aside>

      {/* VIEW CONTENT CONTAINER */}
      <main style={{ flex: 1, marginLeft: 260, padding: "32px 40px", minWidth: 0, position: "relative", zIndex: 10 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Ruang Kerja</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>Pusat Kontrol Seller</h1>
          </div>
        </header>

        {/* DYNAMIC CONTENT SWITCH TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

{/* 🧠 AI COO DECISION */}
{decisions.length > 0 && (
  <div 
    onClick={handleGoAI} // Otomatis pindah tab ke Insight AI saat diklik
    style={{ background: "#0f172a", color: "#fff", borderRadius: 12, padding: 16, cursor: "pointer", transition: "transform 0.2s", }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ fontWeight: 700, marginBottom: 8 }}>🧠 AI COO - Keputusan Hari Ini</h3>
      <span style={{ fontSize: 11, background: "#1e293b", padding: "4px 8px", borderRadius: 6, color: "#38bdf8" }}>Buka Detail AI →</span>
    </div>

                {decisions.map((d, i) => (
                  <div key={i} style={{ marginTop: 10, borderBottom: i < decisions.length - 1 ? "1px solid #334155" : "none", paddingBottom: 10 }}>
                    <p style={{ margin: "4px 0" }}>
                      {d.type === "restock" && "📦"}
                      {d.type === "stop" && "❌"}
                      {d.type === "scale" && "🚀"}{" "}
                      <b>{d.product}</b>
                    </p>
                    <p style={{ fontSize: 13, opacity: 0.8, margin: "4px 0" }}>
                      {d.reason}
                    </p>
                    <p style={{ fontSize: 13, color: "#38bdf8", margin: "4px 0" }}>
                      👉 {d.action}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 🔥 AI METRICS */}
            {aiMetrics && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  🔥 Insight Bisnis Hari Ini
                </h3>

<p style={{ margin: "4px 0", fontSize: 14, color: "#334155" }}>
  💰 <b>Profit Hari Ini:</b> Rp {aiMetrics.total_profit ? aiMetrics.total_profit.toLocaleString("id-ID") : "0"}
</p>
<p style={{ margin: "4px 0", fontSize: 14, color: "#334155" }}>
  📈 <b>Omzet Hari Ini:</b> Rp {aiMetrics.total_revenue ? aiMetrics.total_revenue.toLocaleString("id-ID") : "0"}
</p>
                <p style={{ margin: "4px 0" }}>📊 Margin: {(aiMetrics.avg_margin * 100).toFixed(1)}%</p>

                {aiMetrics.insights_flags?.has_loss && (
                  <p style={{ color: "#dc2626", fontWeight: 600, margin: "8px 0 4px 0" }}>❌ Ada produk merugi</p>
                )}

                {aiMetrics.insights_flags?.has_dead_stock && (
                  <p style={{ color: "#ea580c", fontWeight: 600, margin: "4px 0" }}>📦 Ada dead stock</p>
                )}
              </div>
            )}

            {/* 📊 DASHBOARD EXECUTIVE WITH INTER-PANEL HANDLERS CONNECTED */}
            <ExecutiveDashboard 
              products={products} 
              expenses={expenses} 
              filteredProducts={filteredProducts}
              metrics={metrics as any} 
              aiMetrics={aiMetrics}
              cashflowTrend={getCashflowTrend(expenses)}
              profitTrend={getProfitTrend(products)}
              isPro={isPro}
              isDemoMode={isDemoMode}
              lastSync={lastSync}
              syncing={syncing}
              onDelete={deleteProduct}
              stores={stores}
              workspaceId={workspaceId}
              userEmail={userEmail}
              onGoMarketplace={handleGoMarketplace}
              onGoProducts={handleGoProducts}
              onGoAI={handleGoAI}
              onGoBilling={handleGoBilling}
              onLangClick={() => alert("Fitur Multi-Bahasa (Inggris, Mandarin, Melayu) sedang dipersiapkan untuk sinkronisasi pasar Cross-Border Tokopedia-TikTok International!")}
            />
           
            {/* 🤝 AFFILIATE ANALYSIS */}
            {affiliateData && selectedProduct && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginBottom: 12 }}>🤝 Affiliate - {selectedProduct.name}</h3>

                {affiliateData.affiliates?.map((a: any) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, margin: "4px 0" }}>
                    <span>{a.name}</span>
                    <span>{a.score?.toFixed(1)}</span>
                  </div>
                ))}

                <p style={{ margin: "8px 0 4px 0" }}>
                  🔥 Top: {affiliateData.insights?.top_affiliate?.name || "-"}
                </p>
                <p style={{ margin: "4px 0" }}>
                  ❌ Worst: {affiliateData.insights?.worst_affiliate?.name || "-"}
                </p>

                {affiliateData.recommendations?.map((r: string, i: number) => (
                  <p key={i} style={{ color: "#2563eb", margin: "4px 0" }}>{r}</p>
                ))}
              </div>
            )}

            {/* 🤖 AI CHAT PANEL */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginBottom: 12 }}>🤖 AI Business Advisor</h3>

              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #f1f5f9", padding: 8, borderRadius: 8, background: "#f8fafc", marginBottom: 12 }}>
                {chatMessages.length === 0 && (
                  <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", margin: "16px 0" }}>Belum ada obrolan. Tanyakan sesuatu tentang margin atau stok道を!</p>
                )}
                {chatMessages.map((m, i) => (
                  <p key={i} style={{ fontSize: 13, margin: "6px 0" }}>
                    <b>{m.role === "user" ? "You" : "AI"}:</b> {m.text}
                  </p>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Ketik pesan analisis di sini..."
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
                <button 
                  onClick={sendMessage}
                  style={{ padding: "10px 20px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
                >
                  Kirim
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === "integrasi" && (
          <MarketplaceSyncPanel syncing={syncing} setSyncing={setSyncing} lastSync={lastSync} setLastSync={setLastSync} products={products} setProducts={setProducts} currentUserId={currentUserId} workspaceId={workspaceId} selectedStoreId={selectedStoreId} />
        )}

        {activeTab === "market-intel" && (
          <MarketIntelligenceSuite 
            marketData={
              marketData && marketData.products 
                ? marketData 
                : Array.isArray(marketData) 
                  ? { products: marketData } 
                  : { products: [] }
            } 
            onSearch={handleDashboardScrape} 
            loading={loading} 
          />
        )}

        {activeTab === "insight-ai" && (
          <AIRecommendationPanel products={products} expenses={expenses} metrics={metrics as any} />
        )}

        {activeTab === "laporan" && (
          <ReportsPanel products={products} expenses={expenses} metrics={metrics as any} />
        )}

        {activeTab === "produk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <ProductForm 
              form={form} 
              loading={loading} 
              products={products || []} 
              onChange={(nextForm) => setForm(nextForm)} 
              onSubmit={async (e) => {
                e.preventDefault();
                alert("Simpan produk dijalankan.");
              }} 
              onFinish={async () => {
                setActiveTab("overview");
              }} 
            />
            <ProductTable products={filteredProducts} onDelete={deleteProduct} />
          </div>
        )}

        {activeTab === "cashflow" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <ExpensePanel 
              expenses={expenses} 
              form={expenseForm} 
              metrics={metrics as any} 
              onChange={(nextExpense) => setExpenseForm(nextExpense)} 
              onSubmit={async (e) => { e.preventDefault(); }} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";
import type { Expense, ExpenseRow, Goal, Product, ProductFilter, ProductRow, Profile, StockMoveType, TabKey, UpgradePlan } from "@/types/dashboard";
import { DEMO_EXPENSES, DEMO_GOALS, DEMO_PRODUCTS, FREE_PRODUCT_LIMIT, LIFETIME_PRICE, MIDTRANS_REVIEW_MODE, MONTHLY_PRICE } from "@/lib/dashboard/constants";
import { calculateMargin, calculateProfit, getDashboardMetrics, isProfileExpired, isProfilePro, mapExpenseRow, mapProductRow } from "@/lib/dashboard/calculations";
import { generateInsightText, getOneThingAction, buildInsightCards } from "@/lib/dashboard/insights";
import { exportCashflowCSV, exportExpensesCSV, exportProductsCSV, exportSummaryJSON, exportRealPDF } from "@/lib/dashboard/reports";
import { compactMoney, getErrorMessage, money, percent } from "@/lib/dashboard/format";
import { AppShell } from "@/components/dashboard/AppShell";
import { Hero } from "@/components/dashboard/Hero";
import { Badge, cardStyle, ctaButtonStyle, EmptyState, ghostButtonStyle, Progress, StatCard } from "@/components/dashboard/ui";
import { ExpensePanel, ExpenseFormState, ProductForm, ProductFormState, SaleForm, StockForm } from "@/components/dashboard/Forms";
import { ProductCards, ProductFilters, ProductTable } from "@/components/dashboard/ProductTable";
import { AnalyticsTable, DonutChartCard, LineChartCard } from "@/components/dashboard/Charts";
import { ReportsPanel } from "@/components/dashboard/ReportsPanel";
import { AIRecommendationPanel, ForecastingPanel, MarketplaceSyncPanel } from "@/components/dashboard/AdvancedPanels";
import { SaaSPlatformPanel } from "@/components/dashboard/SaaSPlatformPanel";
import { AutomationPanel, FinanceChatPanel, LiveChartsPanel, MarketplaceApiPanel, MidtransSubscriptionPanel, TeamAccessPanel, type ChatMessage } from "@/components/dashboard/Step4Panels";
import { getCashflowTrend, getExpenseBreakdown, getInventoryAnalytics, getProductAnalytics, getProfitTrend } from "@/lib/dashboard/analytics";
import { parseMarketplaceRow } from "@/lib/dashboard/marketplaceImport";
import { getOrCreateDefaultWorkspace, listWorkspaceStores, type Store } from "@/lib/saas/workspace";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: Record<string, unknown>) => void;
    };
  }
}

const db: any = supabase;

const initialProductForm: ProductFormState = { productName: "", costPrice: "", sellingPrice: "", stockInitial: "", quantitySold: "", otherCost: "", marketplace: "Shopee" };
const initialExpenseForm: ExpenseFormState = { label: "", category: "Ops", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" };

function getPlanAmount(plan: UpgradePlan) {
  return plan === "monthly" ? 29000 : 99000;
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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
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
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Saya siap membaca data profit, cashflow, stok, expense, marketplace, dan forecast untuk memberi rekomendasi bisnis." }]);
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "", otherCost: "" });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [form, setForm] = useState<ProductFormState>(initialProductForm);

  const isPro = isProfilePro(profile);
  const proExpired = isProfileExpired(profile);
  const metrics = useMemo(() => getDashboardMetrics(products, expenses), [products, expenses]);
  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.profit - a.profit), [products]);
  const filteredProducts = useMemo(() => {
    if (selectedFilter === "loss") return sortedProducts.filter((item) => item.profit < 0);
    if (selectedFilter === "fix") return sortedProducts.filter((item) => item.profit >= 0 && item.margin < 20);
    if (selectedFilter === "scale") return sortedProducts.filter((item) => item.profit > 0 && item.margin >= 20);
    if (selectedFilter === "stock") return sortedProducts.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15);
    return sortedProducts;
  }, [selectedFilter, sortedProducts]);
  const sparklineData = [0, metrics.totalProfit * 0.3, metrics.totalProfit * 0.58, metrics.totalProfit * 0.76, metrics.totalProfit];
  const insightCards = useMemo(() => buildInsightCards(products, metrics), [products, metrics]);
  const cashflowTrend = useMemo(() => getCashflowTrend(products, expenses), [products, expenses]);
  const profitTrend = useMemo(() => getProfitTrend(products), [products]);
  const expenseBreakdown = useMemo(() => getExpenseBreakdown(expenses), [expenses]);
  const productAnalytics = useMemo(() => getProductAnalytics(products), [products]);
  const inventoryAnalytics = useMemo(() => getInventoryAnalytics(products), [products]);

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
    async function loadUserAndData() {
      if (isMounted) setPageLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (sessionError || !user) {
        if (!isMounted) return;
        setCurrentUserId("demo-user");
        setUserEmail(null);
        setProducts(DEMO_PRODUCTS);
        setExpenses(DEMO_EXPENSES);
        setProfile({ role: "user", plan: "free", pro_until: null, email: null });
        setWorkspaceId(null);
        setStores([]);
        setSelectedStoreId(null);
        setIsDemoMode(true);
        setPageLoading(false);
        return;
      }

      if (!isMounted) return;
      setCurrentUserId(user.id);
      setUserEmail(user.email ?? null);
      setIsDemoMode(false);

      try {
        const workspace = await getOrCreateDefaultWorkspace({ id: user.id, email: user.email });
        if (!isMounted) return;
        setWorkspaceId(workspace.id);
        const storeList = await listWorkspaceStores(workspace.id);
        if (!isMounted) return;
        setStores(storeList);
        setSelectedStoreId(storeList[0]?.id ?? null);
      } catch (workspaceError) {
        console.warn("Workspace v6 belum siap. Jalankan supabase/production_v6_real_data_schema.sql", workspaceError);
      }

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

      const { data: expenseData, error: expenseError } = await db.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }).limit(100);
      if (!isMounted) return;
      if (expenseError) {
        console.warn("Expenses table belum tersedia atau belum diberi RLS. Jalankan supabase/migrations/20260513_expense_engine.sql", expenseError);
        setExpenses(DEMO_EXPENSES);
      } else {
        setExpenses(((expenseData || []) as ExpenseRow[]).map(mapExpenseRow));
      }
      setPageLoading(false);
    }

    loadUserAndData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") { loadUserAndData(); return; }
      if (event === "SIGNED_OUT" || !session?.user) {
        setCurrentUserId("demo-user"); setUserEmail(null); setWorkspaceId(null); setStores([]); setSelectedStoreId(null); setProducts(DEMO_PRODUCTS); setExpenses(DEMO_EXPENSES); setProfile({ role: "user", plan: "free", pro_until: null, email: null }); setIsDemoMode(true); setPageLoading(false);
      }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (!currentUserId || currentUserId === "demo-user" || isDemoMode) return;
    const channel = supabase
      .channel(`dashboard-realtime-${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${currentUserId}` }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          setExpenses((prev) => prev.filter((item) => item.id !== payload.old?.id));
          return;
        }
        if (payload.new) {
          const next = mapExpenseRow(payload.new as ExpenseRow);
          setExpenses((prev) => [next, ...prev.filter((item) => item.id !== next.id)].sort((a, b) => b.date.localeCompare(a.date)));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `user_id=eq.${currentUserId}` }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          setProducts((prev) => prev.filter((item) => item.id !== payload.old?.id));
          return;
        }
        if (payload.new) {
          const next = mapProductRow(payload.new as ProductRow);
          setProducts((prev) => [next, ...prev.filter((item) => item.id !== next.id)]);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, isDemoMode]);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUserId(null); setUserEmail(null); setProducts([]); setProfile(null); router.replace("/login");
  }

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
        const { data, error } = await db.from("products").insert([{ user_id: currentUserId, workspace_id: workspaceId, store_id: selectedStoreId, name, cost_price: costPrice, selling_price: sellingPrice, stock_initial: stockInitial, stock_remaining: stockRemaining, quantity_sold: quantitySold, other_cost: otherCost, profit, margin, marketplace: form.marketplace } as any]).select("*").single();
        if (error) throw error;
        if (data) setProducts((prev) => [mapProductRow(data as ProductRow), ...prev]);
      }
      setForm(initialProductForm); setActiveTab("overview");
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

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureLoggedIn()) return;
    const amount = parseNumber(expenseForm.amount);
    if (!expenseForm.label.trim() || amount <= 0) { alert("Isi nama dan nominal biaya."); return; }
    const localExpense: Expense = { id: `exp-${Date.now()}`, label: expenseForm.label.trim(), category: expenseForm.category, amount, date: expenseForm.date || new Date().toISOString().slice(0, 10), notes: expenseForm.notes.trim() || null };
    if (isDemoMode) {
      setExpenses((prev) => [localExpense, ...prev]);
      setExpenseForm(initialExpenseForm);
      return;
    }
    const { data, error } = await db.from("expenses").insert([{ user_id: currentUserId, workspace_id: workspaceId, store_id: selectedStoreId, title: localExpense.label, label: localExpense.label, category: localExpense.category, amount: localExpense.amount, expense_date: localExpense.date, notes: localExpense.notes }]).select("*").single();
    if (error) {
      console.error(error);
      alert("Gagal menyimpan expense. Pastikan migration expense sudah dijalankan di Supabase.");
      return;
    }
    setExpenses((prev) => [mapExpenseRow(data as ExpenseRow), ...prev]);
    setExpenseForm(initialExpenseForm);
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
        const imported = rows
          .slice(0, remainingSlot)
          .map((row, index) => ({ ...parseMarketplaceRow(row, currentUserId, index), workspace_id: workspaceId, store_id: selectedStoreId }))
          .filter((row) => row.name.trim().length > 0 && (row.selling_price > 0 || row.cost_price > 0 || row.quantity_sold > 0));
        try {
          if (isDemoMode) setProducts((prev) => [...imported.map((row, index) => mapProductRow({ id: `demo-csv-${Date.now()}-${index}`, ...row } as ProductRow)), ...prev]);
          else { const { data, error } = await db.from("products").insert(imported as any).select("*"); if (error) throw error; if (data) setProducts((prev) => [...(data as ProductRow[]).map(mapProductRow), ...prev]); }
          setLastSync(new Date().toLocaleString("id-ID")); alert(`Berhasil import ${imported.length} baris marketplace. Profit, fee, stok, margin, dan multi-store sudah dihitung otomatis.`);
        } catch (error) { console.error(error); alert("Gagal import CSV ke database."); } finally { e.target.value = ""; setSyncing(false); }
      },
      error: (error) => { console.error(error); alert("Gagal membaca file CSV."); e.target.value = ""; setSyncing(false); },
    });
  }

  function handleExport() {
    if (!isPro) { openUpgradeModal("lifetime"); return; }
    if (products.length === 0) { alert("Belum ada produk untuk export."); return; }
    exportProductsCSV(products);
    exportExpensesCSV(expenses);
    exportCashflowCSV(metrics, expenses);
    exportSummaryJSON(metrics, products, expenses);
  }

  function handleExportPDF() {
    if (!isPro) { openUpgradeModal("lifetime"); return; }
    exportRealPDF(metrics, products, expenses);
  }

  async function askFinanceAssistant() {
    const question = chatQuestion.trim();
    if (!question) return;
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatQuestion("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/finance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, metrics, products: products.slice(0, 20), expenses: expenses.slice(0, 20) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "AI CFO gagal membaca data.");
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer || "Belum ada jawaban." }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: generateInsightText(products, expenses, metrics, question) }]);
    } finally {
      setChatLoading(false);
    }
  }

  function askAiCfo() {
    setAiAnswer(generateInsightText(products, expenses, metrics, aiQuestion));
  }

  function goStock(id: string) { setStockMove((prev) => ({ ...prev, productId: id })); setActiveTab("inventory"); }
  function goSale(id: string) { setSaleForm((prev) => ({ ...prev, productId: id })); setActiveTab("sales"); }

  if (pageLoading) return <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", display: "grid", placeItems: "center", fontFamily: "Inter, Arial" }}><div style={{ textAlign: "center" }}><div style={{ width: 44, height: 44, borderRadius: 999, border: "4px solid #dbe3ef", borderTopColor: "#0f766e", margin: "0 auto 16px" }} /><p>Loading Untungin.ai...</p></div></main>;

  return <AppShell activeTab={activeTab} onTabChange={setActiveTab} isPro={isPro} proExpired={proExpired} onExport={handleExport} onUpgrade={() => openUpgradeModal("lifetime")} onLogout={handleLogout}>
    {showUpgradeModal && <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,23,42,0.62)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ ...cardStyle, maxWidth: 650, width: "100%", border: "1px solid #99f6e4" }}><button onClick={() => setShowUpgradeModal(false)} style={{ float: "right", background: "transparent", color: "#0f172a", border: "none", fontSize: 24, cursor: "pointer" }}>×</button><Badge label="Untungin.ai PRO" tone="success" /><h2 style={{ fontSize: 30, margin: "14px 0 8px" }}>Buka insight lengkap untuk profit, cashflow, stok, dan pricing</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>PRO membuka unlimited produk, multi marketplace import, AI insights, export laporan, goal tracker, dan analisis cashflow.</p><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>{([ ["monthly", "PRO Bulanan", MONTHLY_PRICE], ["lifetime", "PRO Lifetime", LIFETIME_PRICE] ] as const).map(([key, title, price]) => <button key={key} onClick={() => setSelectedPlan(key)} style={{ padding: 18, textAlign: "left", borderRadius: 18, border: selectedPlan === key ? "1px solid #0f766e" : "1px solid #dbe3ef", background: selectedPlan === key ? "#ecfdf5" : "#ffffff", color: "#0f172a" }}><strong>{title}</strong><br /><span style={{ color: "#0f766e", fontWeight: 900 }}>{price}</span></button>)}</div><button onClick={() => handleUpgradeMidtrans(selectedPlan)} disabled={upgradeLoading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 18, opacity: upgradeLoading ? 0.7 : 1 }}>{upgradeLoading ? "Membuka pembayaran..." : "Bayar dengan Midtrans"}</button></div></div>}

    <Hero netCash={metrics.netCash} totalRevenue={metrics.totalRevenue} inventoryValue={metrics.inventoryValue} sparklineData={sparklineData} onAddProduct={() => setActiveTab("products")} onAddCashflow={() => setActiveTab("cashflow")} syncing={syncing} onCSVUpload={handleCSVUpload} />

    {activeTab === "overview" && <div style={{ display: "grid", gap: 18 }}><SaaSPlatformPanel products={products} metrics={metrics} userEmail={userEmail} isPro={isPro} lastSync={lastSync} onGoMarketplace={() => setActiveTab("marketplace")} onGoTeam={() => setActiveTab("team")} onUpgrade={() => openUpgradeModal("lifetime")} /><LiveChartsPanel products={products} expenses={expenses} metrics={metrics} /><section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}><StatCard label="Omzet" value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} unit terjual`} tone="blue" /><StatCard label="Profit produk" value={money(metrics.totalProfit)} helper={`Margin rata-rata ${percent(metrics.avgMargin)}`} tone={metrics.totalProfit >= 0 ? "success" : "danger"} /><StatCard label="Cashflow bersih" value={money(metrics.netCash)} helper={`Biaya operasional ${money(metrics.totalExpenses)}`} tone={metrics.netCash >= 0 ? "success" : "danger"} /><StatCard label="Risk score" value={`${metrics.riskScore}/100`} helper={`Estimasi bocor ${money(metrics.dailyLeakEstimate)} per hari`} tone={metrics.riskScore >= 50 ? "danger" : metrics.riskScore >= 25 ? "warning" : "success"} /></section><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}><LineChartCard title="Cashflow Trend" subtitle="Uang masuk vs keluar" data={cashflowTrend} valueLabel="Cash in" secondaryLabel="Cash out" /><LineChartCard title="Profit Trend" subtitle="Estimasi profit 7 hari" data={profitTrend} valueLabel="Profit" /></section><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}><div style={cardStyle}><Badge label="Rekomendasi Hari Ini" tone="success" /><h2 style={{ margin: "12px 0", lineHeight: 1.35 }}>{getOneThingAction(products)}</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Prioritas dihitung dari profit, margin, stok, dan cashflow agar keputusan tidak hanya berdasarkan omzet.</p><button onClick={() => setActiveTab("ai")} style={ctaButtonStyle}>Lihat insight</button></div><div style={cardStyle}><Badge label="Business Health" tone="warning" /><h2 style={{ margin: "12px 0" }}>{money(metrics.inventoryValue)} modal di stok</h2><div style={{ display: "grid", gap: 10, marginTop: 16 }}><div><small>Stock value <b style={{ float: "right" }}>{compactMoney(metrics.inventoryValue)}</b></small><Progress value={100} /></div><div><small>Profit <b style={{ float: "right" }}>{compactMoney(metrics.totalProfit)}</b></small><Progress value={Math.min(100, (metrics.totalProfit / Math.max(metrics.inventoryValue, 1)) * 100)} /></div><div><small>Expenses <b style={{ float: "right" }}>{compactMoney(metrics.totalExpenses)}</b></small><Progress value={Math.min(100, (metrics.totalExpenses / Math.max(metrics.totalProfit, 1)) * 100)} /></div></div></div></section><section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}><div><Badge label="Performa Produk" tone="blue" /><h2 style={{ margin: "8px 0 0" }}>Profit, risiko, marketplace, dan stok</h2></div><button onClick={() => setActiveTab("products")} style={ghostButtonStyle}>Lihat semua</button></div><div className="desktop-table"><ProductTable products={filteredProducts} onStock={goStock} onSale={goSale} onDelete={deleteProduct} /></div><ProductCards products={filteredProducts} onStock={goStock} onSale={goSale} /></section></div>}

    {activeTab === "products" && <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.35fr", gap: 18 }}><ProductForm form={form} loading={loading} onChange={setForm} onSubmit={handleSubmit} /><section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><div><Badge label="Daftar Produk" tone="blue" /><h2 style={{ margin: "8px 0 0" }}>Ranking profit dan risiko</h2></div><ProductFilters selectedFilter={selectedFilter} onChange={setSelectedFilter} /></div><div className="desktop-table"><ProductTable products={filteredProducts} onStock={goStock} onSale={goSale} onDelete={deleteProduct} /></div><ProductCards products={filteredProducts} onStock={goStock} onSale={goSale} /></section></div>}

    {activeTab === "cashflow" && <div style={{ display: "grid", gap: 18 }}><div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 18 }}><ExpensePanel expenses={expenses} form={expenseForm} metrics={{ totalRevenue: metrics.totalRevenue, totalProfit: metrics.totalProfit, totalExpenses: metrics.totalExpenses, netCash: metrics.netCash }} onChange={setExpenseForm} onSubmit={addExpense} /></div><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}><LineChartCard title="Real Cashflow" subtitle="Cash in vs cash out" data={cashflowTrend} valueLabel="Cash in" secondaryLabel="Cash out" /><DonutChartCard title="Expense Analytics" subtitle="Biaya berdasarkan kategori" segments={expenseBreakdown} centerLabel={compactMoney(metrics.totalExpenses)} /></section></div>}

    {activeTab === "inventory" && <div style={{ display: "grid", gap: 18 }}><section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}><StatCard label="Total SKU" value={products.length} helper="Produk aktif" tone="blue" /><StatCard label="Total stok" value={metrics.totalStock} helper="Unit tersedia" tone="success" /><StatCard label="Stok kritis" value={metrics.lowStockCount + metrics.outOfStockCount} helper="Perlu perhatian" tone={metrics.lowStockCount + metrics.outOfStockCount ? "warning" : "success"} /><StatCard label="Nilai inventory" value={money(metrics.inventoryValue)} helper="Modal di stok" tone="neutral" /></section><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.65fr 1.35fr", gap: 18 }}><StockForm products={products} stockMove={stockMove} onChange={setStockMove} onSubmit={applyStockMove} /><div style={cardStyle}><Badge label="Inventory List" tone="blue" /><h2>Pantau stok kapan saja</h2><div className="desktop-table"><ProductTable products={filteredProducts} mode="inventory" onStock={goStock} onSale={goSale} onDelete={deleteProduct} /></div><ProductCards products={filteredProducts} onStock={goStock} onSale={goSale} /></div></section></div>}

    {activeTab === "sales" && <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 18 }}><SaleForm products={products} saleForm={saleForm} onChange={setSaleForm} onSubmit={recordSale} /><section style={cardStyle}><Badge label="Sales Performance" tone="blue" /><h2>{metrics.totalUnits} unit terjual</h2><div className="desktop-table"><ProductTable products={filteredProducts} onStock={goStock} onSale={goSale} onDelete={deleteProduct} /></div><ProductCards products={filteredProducts} onStock={goStock} onSale={goSale} /></section></div>}

    {activeTab === "ai" && <div style={{ display: "grid", gap: 18 }}><AIRecommendationPanel products={products} expenses={expenses} metrics={metrics} /><section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18 }}><div style={cardStyle}><Badge label="Manual Question" tone="blue" /><h2>Tanya AI CFO</h2><div style={{ display: "grid", gap: 10, margin: "14px 0" }}>{insightCards.map((card, index) => <div key={index} style={{ padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}><Badge label={card.title} tone={card.tone} /><p style={{ color: "#475569", lineHeight: 1.6, marginBottom: 0 }}>{card.detail}</p></div>)}</div><textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} rows={5} placeholder="Contoh: produk mana yang harus saya restock, stop, atau scale minggu ini?" style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbe3ef", resize: "vertical" }} /><button onClick={askAiCfo} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Generate Action Plan</button>{!isPro && <p style={{ color: "#64748b", fontSize: 13 }}>Free melihat ringkasan. PRO membuka diagnosis lengkap dan export.</p>}</div><div style={cardStyle}><Badge label="Jawaban Insight" tone="success" /><h2>Action plan</h2><pre style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.72, fontFamily: "inherit", margin: "16px 0 0" }}>{aiAnswer}</pre></div></section></div>}

    {activeTab === "reports" && <ReportsPanel metrics={metrics} products={products} expenses={expenses} onExportCSV={handleExport} onExportPDF={handleExportPDF} />}

    {activeTab === "marketplace" && <div style={{ display: "grid", gap: 18 }}><MarketplaceSyncPanel products={products} syncing={syncing} lastSync={lastSync} onCSVUpload={handleCSVUpload} /><MarketplaceApiPanel products={products} /></div>}

    {activeTab === "forecast" && <ForecastingPanel products={products} expenses={expenses} metrics={metrics} />}

    {activeTab === "automation" && <AutomationPanel products={products} metrics={metrics} />}

    {activeTab === "team" && <TeamAccessPanel userEmail={userEmail} />}

    {activeTab === "assistant" && <FinanceChatPanel messages={chatMessages} question={chatQuestion} loading={chatLoading} onQuestionChange={setChatQuestion} onAsk={askFinanceAssistant} />}

    {activeTab === "goals" && <section style={cardStyle}><Badge label="Goal Tracker" tone="success" /><h2>Target bisnis bulan ini</h2><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{goals.map((goal) => { const value = (goal.current / Math.max(goal.target, 1)) * 100; return <div key={goal.id} style={{ padding: 18, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><div><strong>{goal.label}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{goal.period}</div></div><strong>{Math.round(value)}%</strong></div><div style={{ margin: "18px 0 10px" }}><Progress value={value} /></div><small style={{ color: "#64748b" }}>{money(goal.current)} dari {money(goal.target)}</small></div>; })}</div></section>}

    {activeTab === "pricing" && <div style={{ display: "grid", gap: 18 }}><MidtransSubscriptionPanel /><section style={cardStyle}><Badge label="Plans" tone="success" /><h2 style={{ margin: "12px 0", fontSize: 32 }}>Untungin.ai PRO untuk seller online</h2><p style={{ color: "#64748b", lineHeight: 1.75, maxWidth: 820 }}>Akses unlimited produk, multi marketplace import, cashflow, AI insights, inventory center, export laporan, dan goal tracker.</p><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}><div style={{ padding: 20, borderRadius: 20, background: "#ffffff", border: "1px solid #dbe3ef" }}><h3>PRO Bulanan</h3><h2 style={{ color: "#0f766e" }}>{MONTHLY_PRICE}</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Cocok untuk mulai pakai fitur lengkap selama 1 bulan.</p><button onClick={() => openUpgradeModal("monthly")} style={ctaButtonStyle}>Pilih Bulanan</button></div><div style={{ padding: 20, borderRadius: 20, background: "#ecfdf5", border: "1px solid #99f6e4" }}><h3>PRO Lifetime</h3><h2 style={{ color: "#0f766e" }}>{LIFETIME_PRICE}</h2><p style={{ color: "#475569", lineHeight: 1.7 }}>Sekali bayar untuk membuka fitur PRO tanpa biaya bulanan.</p><button onClick={() => openUpgradeModal("lifetime")} style={ctaButtonStyle}>Pilih Lifetime</button></div></div></section></div>}

    <footer style={{ marginTop: 30, padding: "24px 0", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", color: "#64748b", fontSize: 14 }}><div>© 2026 Untungin.ai · Built for Indonesian marketplace sellers</div><div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}><span>Privacy</span><span>Terms</span><span>Support</span><span>Midtrans Payment</span></div></footer><div style={{ height: 80 }} />
  </AppShell>;
}

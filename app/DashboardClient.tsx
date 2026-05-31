"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabaseClient";
import type { Expense, ExpenseRow, Goal, Product, ProductFilter, ProductRow, Profile, StockMoveType, TabKey, UpgradePlan } from "@/types/dashboard";
import { DEMO_EXPENSES, DEMO_GOALS, DEMO_PRODUCTS, FREE_PRODUCT_LIMIT, MIDTRANS_REVIEW_MODE, getPlanPriceLabel } from "@/lib/dashboard/constants";
import { useDashboardLocale } from "@/lib/dashboard/i18n";
import { calculateMargin, calculateProfit, getDashboardMetrics, isProfileExpired, isProfilePro, mapExpenseRow, mapProductRow } from "@/lib/dashboard/calculations";
import { generateInsightText, getOneThingAction, buildInsightCards } from "@/lib/dashboard/insights";
import { exportCashflowCSV, exportExpensesCSV, exportProductsCSV, exportSummaryJSON, exportRealPDF } from "@/lib/dashboard/reports";
import { compactMoney, getErrorMessage, money, parseNumber, percent } from "@/lib/dashboard/format";
import { AppShell } from "@/components/dashboard/AppShell";
import { Badge, cardStyle, ctaButtonStyle, EmptyState, ghostButtonStyle, Progress, StatCard } from "@/components/dashboard/ui";
import { ExpensePanel, ExpenseFormState, ProductForm, ProductFormState, SaleForm, StockForm } from "@/components/dashboard/Forms";
import { ProductCards, ProductFilters, ProductTable } from "@/components/dashboard/ProductTable";
import { AnalyticsTable, DonutChartCard, LineChartCard } from "@/components/dashboard/Charts";
import { ReportsPanel } from "@/components/dashboard/ReportsPanel";
import { AIRecommendationPanel, ForecastingPanel, MarketplaceSyncPanel } from "@/components/dashboard/AdvancedPanels";
import { StartupMoatPanel } from "@/components/dashboard/StartupMoatPanel";
import { GrowthEnginePanel } from "@/components/dashboard/GrowthEnginePanel";
import { ImportPreviewModal } from "@/components/saas/ImportPreviewModal";
import { AutomationPanel, FinanceChatPanel, MarketplaceApiPanel, MidtransSubscriptionPanel, TeamAccessPanel, type ChatMessage } from "@/components/dashboard/Step4Panels";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { MarketIntelligenceSuite } from "@/components/dashboard/MarketIntelligenceSuite";
import { getCashflowTrend, getExpenseBreakdown, getInventoryAnalytics, getProductAnalytics, getProfitTrend } from "@/lib/dashboard/analytics";
import { createImportPreview, type ImportPreview } from "@/lib/dashboard/marketplaceImport";
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
  const locale = useDashboardLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey | string>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  
  const handleDashboardScrape = async (keywordInput: string) => {
    if (!keywordInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/scrape?keyword=${encodeURIComponent(keywordInput)}`);
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
        alert(`Berhasil menarik data pasar untuk kata kunci "${keywordInput}"!`);
      }
    } catch (error) {
      console.error("Gagal sinkronisasi API Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

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
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("Klik Generate untuk mendapatkan insight berbasis profit, stok, cashflow, margin, dan target.");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Saya siap membaca data profit, cashflow, stok, expense, marketplace, dan forecast untuk memberi rekomendasi bisnis." }]);
  const [stockMove, setStockMove] = useState({ productId: "", type: "in" as StockMoveType, qty: "", note: "" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "", otherCost: "" });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [form, setForm] = useState<ProductFormState>(initialProductForm);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [pendingImportPreview, setPendingImportPreview] = useState<ImportPreview | null>(null);

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
  const insightCards = useMemo(() => buildInsightCards(products, metrics as any), [products, metrics]);
  const cashflowTrend = useMemo(() => getCashflowTrend(products, expenses), [products, expenses]);
  const profitTrend = useMemo(() => getProfitTrend(products), [products]);
  const expenseBreakdown = useMemo(() => getExpenseBreakdown(expenses), [expenses]);
  const productAnalytics = useMemo(() => getProductAnalytics(products), [products]);
  const inventoryAnalytics = useMemo(() => getInventoryAnalytics(products), [products]);

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
        return raw ? JSON.parse(raw) as { id?: string; email?: string } : null;
      } catch {
        return null;
      }
    }
    function loadDemoDashboard(demoSession?: { id?: string; email?: string } | null) {
      if (!isMounted) return;
      setSetupError(null);
      setCurrentUserId(demoSession?.id || "demo-user");
      setUserEmail(demoSession?.email || "alimafudfe+demo@gmail.com");
      setProducts(DEMO_PRODUCTS);
      setExpenses(DEMO_EXPENSES);
      setProfile({ role: "user", plan: "free", pro_until: null, email: demoSession?.email || "alimafudfe+demo@gmail.com" });
      setWorkspaceId(null);
      setStores([]);
      setSelectedStoreId(null);
      setIsDemoMode(true);
      setPageLoading(false);
    }
    async function loadUserAndData() {
      if (isMounted) setPageLoading(true);
      const demoSession = getDemoSession();
      if (demoSession?.id) {
        loadDemoDashboard(demoSession);
        return;
      }
      if (!hasSupabaseEnv) {
        if (!isMounted) return;
        setSetupError(supabaseConfigError || "Supabase ENV belum lengkap.");
        setCurrentUserId(null);
        setUserEmail(null);
        setProducts([]);
        setExpenses([]);
        setProfile(null);
        setWorkspaceId(null);
        setStores([]);
        setSelectedStoreId(null);
        setIsDemoMode(false);
        setPageLoading(false);
        return;
      }

      let sessionData: any = { session: null };
      let sessionError: any = null;
      try {
        const sessionResult = await supabase?.auth.getSession();
        sessionData = sessionResult?.data;
        sessionError = sessionResult?.error;
      } catch (authError) {
        console.warn("Supabase Auth gagal dihubungi, masuk ke mode demo.", authError);
        loadDemoDashboard({ id: "demo-user", email: "alimafudfe+demo@gmail.com" });
        return;
      }
      const user = sessionData?.session?.user ?? null;
      if (sessionError || !user) {
        if (!isMounted) return;
        setCurrentUserId(null);
        setUserEmail(null);
        setProducts([]);
        setExpenses([]);
        setProfile(null);
        setWorkspaceId(null);
        setStores([]);
        setSelectedStoreId(null);
        setIsDemoMode(false);
        setPageLoading(false);
        router.replace(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      setSetupError(null);

      if (!isMounted) return;
      setCurrentUserId(user.id);
      setUserEmail(user.email ?? null);
      setIsDemoMode(false);
      let activeWorkspaceId: string | null = null;

      try {
        const workspace = await getOrCreateDefaultWorkspace({ id: user.id, email: user.email });
        if (!isMounted) return;
        setWorkspaceId(workspace.id);
        activeWorkspaceId = workspace.id;
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

      const productQuery = db.from("products").select("*").order("created_at", { ascending: false });
      const { data: productData, error: productError } = activeWorkspaceId
        ? await productQuery.eq("workspace_id", activeWorkspaceId)
        : await productQuery.eq("user_id", user.id);
      if (!isMounted) return;
      if (productError) {
        console.error(productError);
        alert("Gagal mengambil data produk dari database.");
      } else {
        setProducts(((productData || []) as ProductRow[]).map(mapProductRow));
      }

      const expenseQuery = db.from("expenses").select("*").order("expense_date", { ascending: false }).limit(100);
      const { data: expenseData, error: expenseError } = activeWorkspaceId
        ? await expenseQuery.eq("workspace_id", activeWorkspaceId)
        : await expenseQuery.eq("user_id", user.id);
      if (!isMounted) return;
      if (expenseError) {
        console.warn("Expenses table belum tersedia atau belum diberi RLS. Jalankan schema Supabase production.", expenseError);
        setExpenses([]);
      } else {
        setExpenses(((expenseData || []) as ExpenseRow[]).map(mapExpenseRow));
      }
      setPageLoading(false);
    }

    loadUserAndData();
    const authListener = supabase?.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") { loadUserAndData(); return; }
      if (event === "SIGNED_OUT" || !session?.user) {
        if (getDemoSession()?.id) return;
        setCurrentUserId(null); setUserEmail(null); setWorkspaceId(null); setStores([]); setSelectedStoreId(null); setProducts([]); setExpenses([]); setProfile(null); setIsDemoMode(false); setPageLoading(false); router.replace(`/login?next=${encodeURIComponent("/")}`);
      }
    });

    return () => { 
      isMounted = false; 
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!currentUserId || isDemoMode) return;
    const channel = supabase?
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
      supabase?.removeChannel(channel);
    };
  }, [currentUserId, isDemoMode]);

  function ensureLoggedIn() {
    if (!hasSupabaseEnv) { alert("Supabase ENV belum lengkap. Isi ENV di Vercel dulu."); return false; }
    if (!currentUserId || isDemoMode) { router.replace(`/login?next=${encodeURIComponent("/")}`); return false; }
    return true;
  }

  function openUpgradeModal(plan: UpgradePlan = "lifetime") { setSelectedPlan(plan); setShowUpgradeModal(true); }

  async function handleUpgradeMidtrans(plan: UpgradePlan = selectedPlan) {
    if (!ensureLoggedIn()) return;
    if (MIDTRANS_REVIEW_MODE) { alert("Midtrans sedang review. Silakan coba lagi nanti."); return; }
    if (!userEmail) { alert("Email user tidak ditemukan. Coba logout lalu login ulang."); return; }
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/create-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail, plan, amount: getPlanAmount(plan), workspaceId, userId: currentUserId }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(data?.error || data));
      if (data?.invoice_url) {
        window.location.href = data.invoice_url;
        return;
      }
      if (data?.manual) {
        alert("Manual transfer aktif. Catat order: " + data.order_id + ". Setelah dibayar, admin bisa approve PRO dari database/admin.");
        setUpgradeLoading(false);
        return;
      }
      if (!data?.token) throw new Error("Link pembayaran tidak ditemukan dari server. Cek PAYMENT_PROVIDER dan ENV billing.");
      if (!window.snap?.pay) throw new Error("Midtrans Snap belum siap. Untuk akun Midtrans ditolak, gunakan PAYMENT_PROVIDER=xendit atau manual.");
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
    if (typeof window !== "undefined") window.localStorage.removeItem("untungin_demo_session");
    await supabase?.auth.signOut().catch(() => null);
    setCurrentUserId(null); setUserEmail(null); setProducts([]); setProfile(null); router.replace("/login");
  }

  function findExistingProductByFormName(name: string, marketplace: string) {
    const normalizedName = name.trim().toLowerCase();
    const normalizedMarketplace = marketplace.trim().toLowerCase();
    return products.find((item) => {
      const sameName = item.name.trim().toLowerCase() === normalizedName;
      const sameMarketplace = (item.marketplace || "Manual").trim().toLowerCase() === normalizedMarketplace;
      return sameName && sameMarketplace;
    }) || products.find((item) => item.name.trim().toLowerCase() === normalizedName);
  }

  async function logManualSaleOrder(product: Product, qty: number, extraCost: number, stockBefore: number, stockAfter: number) {
    if (isDemoMode || !workspaceId || !selectedStoreId) return;
    try {
      const saleProfit = calculateProfit({ costPrice: product.costPrice, sellingPrice: product.sellingPrice, quantitySold: qty, otherCost: extraCost });
      const grossRevenue = product.sellingPrice * qty;
      const { data: order } = await db.from("orders").insert({
        workspace_id: workspaceId,
        store_id: selectedStoreId,
        marketplace: product.marketplace || "Manual",
        external_order_id: `manual-${product.id}-${Date.now()}`,
        status: "completed",
        gross_revenue: grossRevenue,
        marketplace_fee: 0,
        ads_cost: 0,
        voucher_cost: 0,
        aggregate_cost: 0,
        net_revenue: grossRevenue - extraCost,
        source_file: "manual-sale",
        raw: { source: "product_form_autocomplete", auto_stock_deducted: true, stock_before: stockBefore, stock_after: stockAfter },
      }).select("id").single();
      if (order?.id) {
        await db.from("order_items").insert({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          unit_price: product.sellingPrice,
          cost_price: product.costPrice,
          total_fee: extraCost,
          profit: saleProfit,
          raw: { source: "product_form_autocomplete", marketplace: product.marketplace || "Manual" },
        });
      }
    } catch (orderError) {
      console.warn("Order log belum tersimpan, tapi stok sudah otomatis berkurang.", orderError);
    }
  }

  async function saveProduct(finishAfterSave = false) {
    if (!ensureLoggedIn()) return;
    const name = form.productName.trim();
    const costPrice = parseNumber(form.costPrice);
    const sellingPrice = parseNumber(form.sellingPrice);
    const stockInitial = parseNumber(form.stockInitial);
    const quantitySold = parseNumber(form.quantitySold);
    const otherCost = parseNumber(form.otherCost);
    const existingProduct = name ? findExistingProductByFormName(name, form.marketplace) : null;

    if (existingProduct) {
      if (quantitySold <= 0) { alert("Produk sudah ada. Isi jumlah terjual untuk mengurangi stok otomatis, atau gunakan menu Stok untuk restock."); return; }
      if (quantitySold > existingProduct.stockRemaining) { alert(`Qty terjual melebihi stok tersedia (${existingProduct.stockRemaining}).`); return; }
      if (costPrice < 0 || sellingPrice <= 0 || otherCost < 0) { alert("Cek lagi modal, harga jual, dan biaya lain."); return; }
      setLoading(true);
      try {
        const stockBefore = existingProduct.stockRemaining;
        const updatedCostPrice = costPrice || existingProduct.costPrice;
        const updatedSellingPrice = sellingPrice || existingProduct.sellingPrice;
        const updatedQuantitySold = existingProduct.quantitySold + quantitySold;
        const updatedStockRemaining = Math.max(existingProduct.stockRemaining - quantitySold, 0);
        const updatedOtherCost = existingProduct.otherCost + otherCost;
        const profit = calculateProfit({ costPrice: updatedCostPrice, sellingPrice: updatedSellingPrice, quantitySold: updatedQuantitySold, otherCost: updatedOtherCost });
        const margin = calculateMargin(updatedCostPrice, updatedSellingPrice);
        const ok = await persistProductUpdate(existingProduct.id, {
          costPrice: updatedCostPrice,
          sellingPrice: updatedSellingPrice,
          quantitySold: updatedQuantitySold,
          stockRemaining: updatedStockRemaining,
          otherCost: updatedOtherCost,
          profit,
          margin,
          marketplace: existingProduct.marketplace || form.marketplace,
        });
        if (ok) {
          await logManualSaleOrder({ ...existingProduct, costPrice: updatedCostPrice, sellingPrice: updatedSellingPrice }, quantitySold, otherCost, stockBefore, updatedStockRemaining);
          setForm(initialProductForm);
          setActiveTab(finishAfterSave ? "overview" : "products");
          alert("Penjualan produk lama tersimpan. Stok otomatis berkurang tanpa membuat produk dobel.");
        }
      } catch (error) { console.error(error); alert("Gagal menyimpan penjualan produk."); } finally { setLoading(false); }
      return;
    }

    if (!isPro && products.length >= FREE_PRODUCT_LIMIT) { openUpgradeModal("lifetime"); return; }
    if (!name || costPrice < 0 || sellingPrice <= 0 || stockInitial < 0 || quantitySold < 0 || quantitySold > stockInitial || otherCost < 0) { alert("Cek lagi input. Nama, harga jual, stok, dan terjual harus valid."); return; }
    const stockRemaining = Math.max(stockInitial - quantitySold, 0);
    const profit = calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost });
    const margin = calculateMargin(costPrice, sellingPrice);
    setLoading(true);
    try {
      const { data, error } = await db.from("products").insert([{ user_id: currentUserId, workspace_id: workspaceId, store_id: selectedStoreId, name, cost_price: costPrice, selling_price: sellingPrice, stock_initial: stockInitial, stock_remaining: stockRemaining, quantity_sold: quantitySold, other_cost: otherCost, profit, margin, marketplace: form.marketplace } as any]).select("*").single();
      if (error) throw error;
      if (data) setProducts((prev) => [mapProductRow(data as ProductRow), ...prev]);
      setForm(initialProductForm);
      setActiveTab(finishAfterSave ? "overview" : "products");
    } catch (error) { console.error(error); alert("Gagal menyimpan produk."); } finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveProduct(false);
  }

  async function handleSubmitAndFinish() {
    await saveProduct(true);
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
    if (ok) {
      try {
        const saleProfit = calculateProfit({ costPrice: product.costPrice, sellingPrice: product.sellingPrice, quantitySold: qty, otherCost: extraCost });
        const grossRevenue = product.sellingPrice * qty;
        const { data: order } = await db.from("orders").insert({
          workspace_id: workspaceId,
          store_id: selectedStoreId,
          marketplace: product.marketplace || "Manual",
          external_order_id: `manual-${product.id}-${Date.now()}`,
          status: "completed",
          gross_revenue: grossRevenue,
          marketplace_fee: 0,
          ads_cost: 0,
          voucher_cost: 0,
          aggregate_cost: 0,
          net_revenue: grossRevenue - extraCost,
          source_file: "manual-sale",
          raw: { source: "manual_input", auto_stock_deducted: true, stock_before: product.stockRemaining, stock_after: stockRemaining },
        }).select("id").single();
        if (order?.id) {
          await db.from("order_items").insert({
            order_id: order.id,
            product_id: product.id,
            product_name: product.name,
            quantity: qty,
            unit_price: product.sellingPrice,
            cost_price: product.costPrice,
            total_fee: extraCost,
            profit: saleProfit,
            raw: { source: "manual_input", marketplace: product.marketplace || "Manual" },
          });
        }
      } catch (orderError) {
        console.warn("Order log belum tersimpan, tapi stok sudah otomatis berkurang.", orderError);
      }
      setSaleForm({ productId: product.id, qty: "", otherCost: "" });
      alert("Penjualan tersimpan. Stok otomatis berkurang dan histori order ikut dicatat.");
    }
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
    e.target.value = "";
    if (!file) return;
    if (!ensureLoggedIn()) return;
    if (!workspaceId || !currentUserId) {
      alert("Workspace belum siap. Refresh halaman atau cek Supabase ENV.");
      return;
    }
    setSyncing(true);
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
      if (parsed.errors.length) console.warn("CSV parse warnings", parsed.errors);
      const rows = (parsed.data || []).filter((row) => Object.values(row).some((value) => String(value || "").trim() !== ""));
      const preview = createImportPreview(rows, currentUserId, "auto");
      
      setPendingImportFile(file);
      setPendingImportPreview(preview);
    } catch (error) {
      console.error("Gagal memproses file CSV:", error);
      alert("Format CSV tidak didukung atau rusak.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isPro={isPro}
      proExpired={proExpired}
      onExport={() => exportSummaryJSON(products, expenses, metrics as any)}
      onUpgrade={openUpgradeModal}
      onLogout={handleLogout}
    >
      {activeTab === "overview" && (
        <ExecutiveDashboard
          products={products}
          metrics={metrics as any}
          filteredProducts={filteredProducts}
          cashflowTrend={cashflowTrend}
          profitTrend={profitTrend}
          isPro={isPro}
          isDemoMode={isDemoMode}
          lastSync={lastSync}
          onAddProduct={() => setActiveTab("add-product")}
          onAddCashflow={() => setActiveTab("expenses")}
          onImportCSV={() => setActiveTab("marketplace")}
          syncing={syncing}
          onGoAI={() => setActiveTab("ai-insights")}
          onGoProducts={() => setActiveTab("products")}
          onGoMarketplace={() => setActiveTab("marketplace")}
          onGoReports={() => setActiveTab("reports")}
          onGoBilling={() => openUpgradeModal("lifetime")}
          onStock={(id) => {
            setStockMove((prev) => ({ ...prev, productId: id }));
            setActiveTab("stock");
          }}
        />
      )}

      {activeTab === "ai-insights" && (
        <div className="space-y-6">
          <AIRecommendationPanel 
            products={products} 
            expenses={expenses} 
            metrics={metrics as any} 
            aiQuestion={aiQuestion} 
            setAiQuestion={setAiQuestion} 
            aiAnswer={aiAnswer} 
            setAiAnswer={setAiAnswer} 
            loading={loading} 
          />
          <FinanceChatPanel 
            messages={chatMessages} 
            question={chatQuestion}
            onQuestionChange={setChatQuestion}
            loading={chatLoading} 
            setMessages={setChatMessages} 
            setChatLoading={setChatLoading} 
            products={products} 
            expenses={expenses} 
            metrics={metrics as any} 
          />
          <ForecastingPanel 
            products={products} 
            metrics={metrics as any} 
          />
        </div>
      )}

      {activeTab !== "overview" && activeTab !== "ai-insights" && (
        <div className="p-6 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
          Menu <span className="font-bold text-gray-800">"{activeTab}"</span> siap diintegrasikan dengan sub-layout Anda.
        </div>
      )}
    </AppShell>
  );
}
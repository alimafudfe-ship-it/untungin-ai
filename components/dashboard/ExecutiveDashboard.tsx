import type React from "react";
import type { Product, DashboardMetrics, Tone } from "@/types/dashboard";
import { getOneThingAction } from "@/lib/dashboard/insights";
import { localeTag, useDashboardLocale, type Locale } from "@/lib/dashboard/i18n";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";
import { LineChartCard } from "./Charts";
import { ProductCards, ProductTable } from "./ProductTable";

type TrendPoint = { label: string; value: number; secondary?: number };

const EXEC_COPY: Record<Locale, {
  safe: string; days: string; new: string; stable: string; veryGood: string; healthy: string; monitor: string; risky: string;
  demoWorkspace: string; proWorkspace: string; freeWorkspace: string; notSynced: string; connected: string; waiting: string; active: string; inactive: string; today: string; justNow: string; aiInsight: string; marketplace: string;
  heroTitle: string; heroSubtitle: string; addProduct: string; addCashflow: string; importing: string; importCSV: string;
  opsScore: string; cashRunway: string; cashRunwayHelper: string; marketSync: string; aiPriority: string; dailyFocus: string;
  focusToday: string; stockNeedCheck: string; opsSafe: string; startFromBestSeller: string; readyToSell: string; topProduct: string; noProduct: string; profitRecorded: string; addProductForRank: string; workRhythm: string; workRhythmValue: string; workRhythmHelper: string;
  netCash: string; cashHealthy: string; actionNeeded: string; profitToStock: string; expensePressure: string; riskControl: string; aiDecisionToday: string; openActionPlan: string;
  opsControl: string; dailySellerControl: string; liveBoard: string; autoAction: string; nextSuggestion: string; openAiCenter: string;
  marginAnomaly: string; restockRisk: string; operatingCash: string; noNegativeMargin: string; checkCostFees: string; controlled: string; priority: string; stockSafe: string; positive: string; deficit: string; leakEstimate: string; noDailyCostPressure: string;
  validateOrder: string; orderRecorded: string; updateStock: string; unitsAvailable: string; reviewProfit: string; avgMargin: string; takeAction: string;
  quickRestockPlan: string; pushBestMargin: string; secureSku: string; useTopProfit: string; fixLossPrice: string; keepDataRhythm: string; adjustPrice: string; recordDaily: string;
  businessSummary: string; revenue: string; unitsSold: string; grossProfit: string; avgMarginText: string; inventoryValue: string; unitsAvailableShort: string; proReadiness: string; proActive: string; proActiveText: string; proReadyText: string;
  onboardingStatus: string; operationalReadiness: string; done: string; notYet: string; connectData: string; activatePro: string; addCoreProducts: string; recordCashflow: string; syncMarketplace: string; activateAiReport: string;
  productProfit: string; criticalStock: string; riskScore: string; dailyLeak: string; cashflowTrend: string; inflowOutflow: string; cashIn: string; cashOut: string; profitTrend: string; profit7Days: string; skuPerformance: string; priorityProducts: string; manageProducts: string;
  bestNextAction: string; aiDetail: string; reviewLowMargin: string; lossDetected: string; seeProducts: string; secureFastStock: string; criticalSkuText: string; stock: string; sendWeeklyReport: string; exportReportText: string; reports: string; recentActivity: string; dataStatus: string; bestProducts: string; noRanking: string; growthSetup: string; setupTitle: string; setupText: string; integrations: string; managePlan: string; viewPro: string;
  globalBadge: string; globalTitle: string; globalDescription: string; expansionReadiness: string; scaleReady: string; buildPhase: string; viewReports: string;
}> = {
  id: {
    safe: "Aman", days: "hari", new: "Baru", stable: "Stabil", veryGood: "Sangat baik", healthy: "Sehat", monitor: "Pantau", risky: "Berisiko",
    demoWorkspace: "Ruang kerja demo", proWorkspace: "Ruang kerja PRO", freeWorkspace: "Ruang kerja gratis", notSynced: "Belum sinkron", connected: "Terhubung", waiting: "Menunggu", active: "Aktif", inactive: "Belum", today: "Hari ini", justNow: "Baru saja", aiInsight: "Insight AI", marketplace: "Marketplace",
    heroTitle: "Kelola profit, stok, dan arus kas dalam satu pusat kontrol premium.", heroSubtitle: "Pantau KPI, risiko stok, performa SKU, dan aksi AI harian tanpa berpindah halaman.", addProduct: "Tambah produk", addCashflow: "Catat arus kas", importing: "Mengimpor...", importCSV: "Impor CSV",
    opsScore: "Skor operasi", cashRunway: "Runway kas", cashRunwayHelper: "Estimasi daya tahan kas", marketSync: "Sinkron marketplace", aiPriority: "Prioritas AI", dailyFocus: "Fokus harian",
    focusToday: "Fokus hari ini", stockNeedCheck: "stok perlu dicek", opsSafe: "Operasi aman", startFromBestSeller: "Mulai dari produk paling laris.", readyToSell: "Siap dorong penjualan.", topProduct: "Produk unggulan", noProduct: "Belum ada produk", profitRecorded: "profit tercatat", addProductForRank: "Tambah produk untuk ranking.", workRhythm: "Ritme kerja", workRhythmValue: "Cek profit → stok → aksi", workRhythmHelper: "Alur harian untuk seller.",
    netCash: "Posisi kas bersih", cashHealthy: "Sehat", actionNeeded: "Perlu aksi", profitToStock: "Profit ke stok", expensePressure: "Tekanan biaya", riskControl: "Kontrol risiko", aiDecisionToday: "Keputusan AI hari ini", openActionPlan: "Buka rencana aksi",
    opsControl: "Ruang kendali operasional", dailySellerControl: "Kontrol harian seller", liveBoard: "Live board", autoAction: "Aksi otomatis", nextSuggestion: "Saran berikutnya", openAiCenter: "Buka pusat keputusan AI",
    marginAnomaly: "Anomali margin", restockRisk: "Risiko restock", operatingCash: "Kas operasional", noNegativeMargin: "Tidak ada margin negatif aktif.", checkCostFees: "Cek HPP, voucher, dan biaya admin.", controlled: "Terkendali", priority: "Prioritas", stockSafe: "Stok inti masih aman untuk dijual.", positive: "Positif", deficit: "Defisit", leakEstimate: "Estimasi bocor", noDailyCostPressure: "Belum ada tekanan biaya harian.",
    validateOrder: "Validasi order", orderRecorded: "unit terjual tercatat", updateStock: "Update stok", unitsAvailable: "unit tersedia lintas produk", reviewProfit: "Tinjau profit", avgMargin: "margin rata-rata", takeAction: "Ambil aksi",
    quickRestockPlan: "Buat rencana restock cepat", pushBestMargin: "Dorong produk margin terbaik", secureSku: "Amankan SKU yang mulai menipis sebelum kampanye berikutnya.", useTopProfit: "Pakai produk profit tertinggi sebagai fokus iklan dan bundling.", fixLossPrice: "Perbaiki harga rugi", keepDataRhythm: "Jaga ritme input data", adjustPrice: "Sesuaikan harga jual atau kurangi promo yang menekan margin.", recordDaily: "Catat order dan biaya harian agar insight tetap akurat.",
    businessSummary: "Ringkasan bisnis", revenue: "Omzet", unitsSold: "unit terjual", grossProfit: "Profit kotor", avgMarginText: "margin rata-rata", inventoryValue: "Nilai stok", unitsAvailableShort: "unit tersedia", proReadiness: "Kesiapan PRO", proActive: "Aktif", proActiveText: "AI CFO, laporan, dan fitur ruang kerja sudah aktif.", proReadyText: "Lengkapi impor data, aktifkan alur kerja inti, lalu upgrade saat siap tumbuh.",
    onboardingStatus: "Onboarding & status", operationalReadiness: "Kesiapan operasional", done: "Selesai", notYet: "Belum", connectData: "Hubungkan data", activatePro: "Aktifkan PRO", addCoreProducts: "Tambahkan minimal 3 produk inti", recordCashflow: "Catat arus kas atau biaya operasional", syncMarketplace: "Sinkronkan marketplace atau impor CSV", activateAiReport: "Aktifkan AI report rutin / PRO",
    productProfit: "Profit produk", criticalStock: "Stok kritis", riskScore: "Skor risiko", dailyLeak: "Estimasi bocor", cashflowTrend: "Tren arus kas", inflowOutflow: "Kas masuk vs keluar", cashIn: "Kas masuk", cashOut: "Kas keluar", profitTrend: "Tren profit", profit7Days: "Estimasi profit 7 hari", skuPerformance: "Performa SKU", priorityProducts: "Produk prioritas", manageProducts: "Kelola produk",
    bestNextAction: "Aksi terbaik berikutnya", aiDetail: "Detail AI", reviewLowMargin: "Tinjau SKU margin rendah", lossDetected: "produk rugi terdeteksi. Cek HPP, voucher, fee admin, dan harga jual.", seeProducts: "Lihat produk", secureFastStock: "Amankan stok cepat habis", criticalSkuText: "SKU perlu isi ulang stok atau dipantau agar tidak kehilangan penjualan.", stock: "Stok", sendWeeklyReport: "Kirim laporan mingguan", exportReportText: "Ekspor PDF/CSV untuk pemilik, mitra, atau arsip operasional.", reports: "Laporan", recentActivity: "Aktivitas terbaru", dataStatus: "Status data", bestProducts: "Produk terbaik", noRanking: "Tambahkan produk atau impor CSV untuk melihat peringkat profit.", growthSetup: "Setup Tumbuh", setupTitle: "Naikkan level dari pencatatan manual ke alur kerja SaaS", setupText: "Hubungkan data marketplace, aktifkan AI CFO, dan jadikan laporan otomatis sebagai ritme operasional harian.", integrations: "Integrasi", managePlan: "Kelola paket", viewPro: "Lihat PRO",
    globalBadge: "Global SaaS readiness", globalTitle: "Siap dibangun sebagai seller OS internasional", globalDescription: "Untungin.ai sekarang diarahkan sebagai command center multi-bahasa untuk seller marketplace: profit, inventory, cash flow, forecast, report, dan AI action plan dalam satu ruang kerja.", expansionReadiness: "Expansion readiness", scaleReady: "Scale-ready", buildPhase: "Build phase", viewReports: "Lihat laporan"
  },
  en: {
    safe: "Safe", days: "days", new: "New", stable: "Stable", veryGood: "Excellent", healthy: "Healthy", monitor: "Watch", risky: "Risky",
    demoWorkspace: "Demo workspace", proWorkspace: "PRO workspace", freeWorkspace: "Free workspace", notSynced: "Not synced", connected: "Connected", waiting: "Pending", active: "Active", inactive: "Pending", today: "Today", justNow: "Just now", aiInsight: "AI insight", marketplace: "Marketplace",
    heroTitle: "Manage profit, inventory, and cash flow from one premium command center.", heroSubtitle: "Monitor KPIs, stock risk, SKU performance, and daily AI actions without switching pages.", addProduct: "Add product", addCashflow: "Log cash flow", importing: "Importing...", importCSV: "Import CSV",
    opsScore: "Operating score", cashRunway: "Cash runway", cashRunwayHelper: "Estimated cash endurance", marketSync: "Marketplace sync", aiPriority: "AI priority", dailyFocus: "Daily focus",
    focusToday: "Today’s focus", stockNeedCheck: "stock items need review", opsSafe: "Operations safe", startFromBestSeller: "Start from your best-selling product.", readyToSell: "Ready to push sales.", topProduct: "Top product", noProduct: "No product yet", profitRecorded: "profit recorded", addProductForRank: "Add products to build ranking.", workRhythm: "Work rhythm", workRhythmValue: "Check profit → stock → action", workRhythmHelper: "Daily operating flow for sellers.",
    netCash: "Net cash position", cashHealthy: "Healthy", actionNeeded: "Action needed", profitToStock: "Profit to inventory", expensePressure: "Expense pressure", riskControl: "Risk control", aiDecisionToday: "Today’s AI decision", openActionPlan: "Open action plan",
    opsControl: "Operating control room", dailySellerControl: "Daily seller control", liveBoard: "Live board", autoAction: "Automated actions", nextSuggestion: "Next suggestions", openAiCenter: "Open AI decision center",
    marginAnomaly: "Margin anomaly", restockRisk: "Restock risk", operatingCash: "Operating cash", noNegativeMargin: "No active negative margin.", checkCostFees: "Review COGS, vouchers, and admin fees.", controlled: "Controlled", priority: "Priority", stockSafe: "Core stock is still safe to sell.", positive: "Positive", deficit: "Deficit", leakEstimate: "Estimated leakage", noDailyCostPressure: "No daily expense pressure yet.",
    validateOrder: "Validate orders", orderRecorded: "units sold recorded", updateStock: "Update stock", unitsAvailable: "units available across products", reviewProfit: "Review profit", avgMargin: "average margin", takeAction: "Take action",
    quickRestockPlan: "Create a fast restock plan", pushBestMargin: "Push your best-margin product", secureSku: "Secure thinning SKUs before the next campaign.", useTopProfit: "Use the highest-profit product for ads and bundles.", fixLossPrice: "Fix loss-making prices", keepDataRhythm: "Keep data entry rhythm", adjustPrice: "Adjust selling price or reduce margin-killing promos.", recordDaily: "Record daily orders and expenses to keep insights accurate.",
    businessSummary: "Business summary", revenue: "Revenue", unitsSold: "units sold", grossProfit: "Gross profit", avgMarginText: "average margin", inventoryValue: "Inventory value", unitsAvailableShort: "units available", proReadiness: "PRO readiness", proActive: "Active", proActiveText: "AI CFO, reports, and workspace features are active.", proReadyText: "Complete data import, activate core workflows, then upgrade when ready to scale.",
    onboardingStatus: "Onboarding & status", operationalReadiness: "Operational readiness", done: "Done", notYet: "Pending", connectData: "Connect data", activatePro: "Activate PRO", addCoreProducts: "Add at least 3 core products", recordCashflow: "Record cash flow or operating expenses", syncMarketplace: "Sync marketplace or import CSV", activateAiReport: "Activate scheduled AI report / PRO",
    productProfit: "Product profit", criticalStock: "Critical stock", riskScore: "Risk score", dailyLeak: "Estimated leakage", cashflowTrend: "Cash flow trend", inflowOutflow: "Cash in vs cash out", cashIn: "Cash in", cashOut: "Cash out", profitTrend: "Profit trend", profit7Days: "Estimated 7-day profit", skuPerformance: "SKU performance", priorityProducts: "Priority products", manageProducts: "Manage products",
    nextBestActions: "Next best actions", aiDetail: "AI details", reviewLowMargin: "Review low-margin SKUs", lossDetected: "loss-making products detected. Review COGS, vouchers, admin fees, and selling price.", seeProducts: "View products", secureFastStock: "Secure fast-moving stock", criticalSkuText: "SKUs need restock or monitoring to avoid missed sales.", stock: "Stock", sendWeeklyReport: "Send weekly report", exportReportText: "Export PDF/CSV for owners, partners, or operating archives.", reports: "Reports", recentActivity: "Recent activity", dataStatus: "Data status", bestProducts: "Best products", noRanking: "Add products or import CSV to see profit ranking.", growthSetup: "Growth setup", setupTitle: "Move from manual tracking to a SaaS operating workflow", setupText: "Connect marketplace data, activate AI CFO, and make automated reports part of your daily operating rhythm.", integrations: "Integrations", managePlan: "Manage plan", viewPro: "View PRO",
    globalBadge: "Global SaaS readiness", globalTitle: "Ready to become an international seller OS", globalDescription: "Untungin.ai is now positioned as a multi-language command center for marketplace sellers: profit, inventory, cash flow, forecast, reports, and AI action plans in one workspace.", expansionReadiness: "Expansion readiness", scaleReady: "Scale-ready", buildPhase: "Build phase", viewReports: "View reports"
  },
  ms: {
    safe: "Selamat", days: "hari", new: "Baharu", stable: "Stabil", veryGood: "Sangat baik", healthy: "Sihat", monitor: "Pantau", risky: "Berisiko",
    demoWorkspace: "Ruang kerja demo", proWorkspace: "Ruang kerja PRO", freeWorkspace: "Ruang kerja percuma", notSynced: "Belum diselaraskan", connected: "Terhubung", waiting: "Menunggu", active: "Aktif", inactive: "Belum", today: "Hari ini", justNow: "Baru sahaja", aiInsight: "Insight AI", marketplace: "Marketplace",
    heroTitle: "Urus profit, inventori, dan aliran tunai dalam satu pusat kawalan premium.", heroSubtitle: "Pantau KPI, risiko stok, prestasi SKU, dan tindakan AI harian tanpa berpindah halaman.", addProduct: "Tambah produk", addCashflow: "Catat aliran tunai", importing: "Mengimport...", importCSV: "Import CSV",
    opsScore: "Skor operasi", cashRunway: "Runway tunai", cashRunwayHelper: "Anggaran ketahanan tunai", marketSync: "Selaras marketplace", aiPriority: "Prioriti AI", dailyFocus: "Fokus harian",
    focusToday: "Fokus hari ini", stockNeedCheck: "stok perlu disemak", opsSafe: "Operasi selamat", startFromBestSeller: "Mula daripada produk paling laris.", readyToSell: "Sedia dorong jualan.", topProduct: "Produk unggulan", noProduct: "Belum ada produk", profitRecorded: "profit direkod", addProductForRank: "Tambah produk untuk ranking.", workRhythm: "Ritma kerja", workRhythmValue: "Semak profit → stok → tindakan", workRhythmHelper: "Alur harian untuk seller.",
    netCash: "Posisi tunai bersih", cashHealthy: "Sihat", actionNeeded: "Perlu tindakan", profitToStock: "Profit ke stok", expensePressure: "Tekanan belanja", riskControl: "Kawalan risiko", aiDecisionToday: "Keputusan AI hari ini", openActionPlan: "Buka pelan tindakan",
    opsControl: "Ruang kawalan operasi", dailySellerControl: "Kawalan harian seller", liveBoard: "Papan langsung", autoAction: "Tindakan automatik", nextSuggestion: "Cadangan seterusnya", openAiCenter: "Buka pusat keputusan AI",
    marginAnomaly: "Anomali margin", restockRisk: "Risiko restock", operatingCash: "Tunai operasi", noNegativeMargin: "Tiada margin negatif aktif.", checkCostFees: "Semak kos, voucher, dan fi admin.", controlled: "Terkawal", priority: "Prioriti", stockSafe: "Stok utama masih selamat untuk dijual.", positive: "Positif", deficit: "Defisit", leakEstimate: "Anggaran bocor", noDailyCostPressure: "Belum ada tekanan belanja harian.",
    validateOrder: "Sahkan pesanan", orderRecorded: "unit jualan direkod", updateStock: "Kemas kini stok", unitsAvailable: "unit tersedia merentas produk", reviewProfit: "Semak profit", avgMargin: "margin purata", takeAction: "Ambil tindakan",
    quickRestockPlan: "Buat pelan restock cepat", pushBestMargin: "Dorong produk margin terbaik", secureSku: "Amankan SKU yang mula menipis sebelum kempen seterusnya.", useTopProfit: "Gunakan produk profit tertinggi untuk iklan dan bundling.", fixLossPrice: "Baiki harga rugi", keepDataRhythm: "Jaga ritma input data", adjustPrice: "Laraskan harga jual atau kurangkan promosi yang menekan margin.", recordDaily: "Catat pesanan dan belanja harian agar insight kekal tepat.",
    businessSummary: "Ringkasan bisnes", revenue: "Jualan", unitsSold: "unit terjual", grossProfit: "Profit kasar", avgMarginText: "margin purata", inventoryValue: "Nilai inventori", unitsAvailableShort: "unit tersedia", proReadiness: "Kesiapan PRO", proActive: "Aktif", proActiveText: "AI CFO, laporan, dan fitur ruang kerja sudah aktif.", proReadyText: "Lengkapkan import data, aktifkan alur kerja utama, lalu upgrade bila sedia berkembang.",
    onboardingStatus: "Onboarding & status", operationalReadiness: "Kesiapan operasi", done: "Selesai", notYet: "Belum", connectData: "Hubungkan data", activatePro: "Aktifkan PRO", addCoreProducts: "Tambah sekurang-kurangnya 3 produk utama", recordCashflow: "Catat aliran tunai atau belanja operasi", syncMarketplace: "Selaraskan marketplace atau import CSV", activateAiReport: "Aktifkan laporan AI rutin / PRO",
    productProfit: "Profit produk", criticalStock: "Stok kritikal", riskScore: "Skor risiko", dailyLeak: "Anggaran bocor", cashflowTrend: "Tren aliran tunai", inflowOutflow: "Tunai masuk vs keluar", cashIn: "Tunai masuk", cashOut: "Tunai keluar", profitTrend: "Tren profit", profit7Days: "Anggaran profit 7 hari", skuPerformance: "Prestasi SKU", priorityProducts: "Produk prioriti", manageProducts: "Urus produk",
    bestNextAction: "Tindakan terbaik seterusnya", aiDetail: "Butiran AI", reviewLowMargin: "Semak SKU margin rendah", lossDetected: "produk rugi dikesan. Semak kos, voucher, fi admin, dan harga jual.", seeProducts: "Lihat produk", secureFastStock: "Amankan stok cepat habis", criticalSkuText: "SKU perlu restock atau dipantau agar tidak kehilangan jualan.", stock: "Stok", sendWeeklyReport: "Hantar laporan mingguan", exportReportText: "Eksport PDF/CSV untuk pemilik, rakan niaga, atau arkib operasi.", reports: "Laporan", recentActivity: "Aktiviti terbaru", dataStatus: "Status data", bestProducts: "Produk terbaik", noRanking: "Tambah produk atau import CSV untuk melihat ranking profit.", growthSetup: "Setup berkembang", setupTitle: "Naik taraf daripada catatan manual ke alur kerja SaaS", setupText: "Hubungkan data marketplace, aktifkan AI CFO, dan jadikan laporan automatik sebagai ritme operasi harian.", integrations: "Integrasi", managePlan: "Urus pelan", viewPro: "Lihat PRO",
    globalBadge: "Kesiapan SaaS global", globalTitle: "Sedia menjadi seller OS antarabangsa", globalDescription: "Untungin.ai kini diposisikan sebagai pusat kawalan multi-bahasa untuk seller marketplace: profit, inventori, aliran tunai, ramalan, laporan, dan pelan tindakan AI dalam satu ruang kerja.", expansionReadiness: "Kesiapan ekspansi", scaleReady: "Sedia skala", buildPhase: "Fasa bina", viewReports: "Lihat laporan"
  }
};

type ExecutiveDashboardProps = {
  products: Product[];
  metrics: DashboardMetrics;
  filteredProducts: Product[];
  cashflowTrend: TrendPoint[];
  profitTrend: TrendPoint[];
  isPro: boolean;
  isDemoMode: boolean;
  lastSync: string | null;
  onAddProduct: () => void;
  onAddCashflow: () => void;
  onImportCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
  syncing: boolean;
  onGoAI: () => void;
  onGoProducts: () => void;
  onGoMarketplace: () => void;
  onGoReports: () => void;
  onGoBilling: () => void;
  onStock: (id: string) => void;
  onSale: (id: string) => void;
  onDelete: (id: string) => void;
  onSearchScrape?: (keyword: string) => void; // Properti sakti baru kita!
};

function getRiskTone(score: number): Tone {
  if (score >= 50) return "danger";
  if (score >= 25) return "warning";
  return "success";
}

function getCashRunway(metrics: DashboardMetrics, t: (typeof EXEC_COPY)[Locale]) {
  if (metrics.dailyLeakEstimate <= 0) return t.safe;
  const days = Math.max(1, Math.floor(Math.max(metrics.netCash, 0) / metrics.dailyLeakEstimate));
  return `${days} ${t.days}`;
}

function healthLabel(score: number, t: (typeof EXEC_COPY)[Locale]) {
  if (score >= 82) return t.veryGood;
  if (score >= 65) return t.healthy;
  if (score >= 45) return t.monitor;
  return t.risky;
}

function getDelta(current: number, previous: number, t: (typeof EXEC_COPY)[Locale]): { text: string; tone: Tone } {
  if (!previous) return { text: t.new, tone: "muted" };
  const pct = ((current - previous) / Math.abs(previous || 1)) * 100;
  if (Math.abs(pct) < 1) return { text: t.stable, tone: "muted" };
  const rounded = Math.round(Math.abs(pct) * 10) / 10;
  return pct >= 0
    ? { text: `↑ ${rounded}%`, tone: "success" }
    : { text: `↓ ${rounded}%`, tone: "danger" };
}

export function ExecutiveDashboard({
  products,
  metrics,
  filteredProducts,
  cashflowTrend,
  profitTrend,
  isPro,
  isDemoMode,
  lastSync,
  onAddProduct,
  onAddCashflow,
  onImportCSV,
  syncing,
  onGoAI,
  onGoProducts,
  onGoMarketplace,
  onGoReports,
  onGoBilling,
  onStock,
  onSale,
  onDelete,
  onSearchScrape,
}: ExecutiveDashboardProps) {
  const locale = useDashboardLocale();
  const t = EXEC_COPY[locale];
  const topProducts = [...products].sort((a, b) => b.profit - a.profit).slice(0, 4);
  const criticalProducts = products.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15);
  const criticalPreview = criticalProducts.slice(0, 4);
  const lossProducts = products.filter((item) => item.profit < 0);
  const lossPreview = lossProducts.slice(0, 4);
  const riskTone = getRiskTone(metrics.riskScore);
  const operatingScore = Math.max(0, Math.min(100, 100 - metrics.riskScore));
  const lastSyncText = lastSync ? new Date(lastSync).toLocaleString(localeTag(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : t.notSynced;
  const planLabel = isDemoMode ? t.demoWorkspace : isPro ? t.proWorkspace : t.freeWorkspace;
  const revenueNow = cashflowTrend[cashflowTrend.length - 1]?.value || 0;
  const revenuePrev = cashflowTrend[cashflowTrend.length - 2]?.value || 0;
  const profitNow = profitTrend[profitTrend.length - 1]?.value || 0;
  const profitPrev = profitTrend[profitTrend.length - 2]?.value || 0;
  const revenueDelta = getDelta(revenueNow, revenuePrev, t);
  const profitDelta = getDelta(profitNow, profitPrev, t);
  const lowStockCount = metrics.lowStockCount + metrics.outOfStockCount;
  const actionText = locale === "id" ? getOneThingAction(products) : lossProducts.length ? (locale === "en" ? `Review ${lossProducts[0]?.name || "low-margin SKU"} before restocking.` : `Semak ${lossProducts[0]?.name || "SKU margin rendah"} sebelum restock.`) : lowStockCount > 0 ? (locale === "en" ? `Restock ${criticalPreview[0]?.name || "priority SKU"} before the next campaign.` : `Restock ${criticalPreview[0]?.name || "SKU prioriti"} sebelum kempen seterusnya.`) : (locale === "en" ? "Operations are stable. Push the best-margin product today." : "Operasi stabil. Dorong produk margin terbaik hari ini.");
  const inventoryDelta = lowStockCount > 0 ? { text: locale === "en" ? `${lowStockCount} urgent` : `${lowStockCount} mendesak`, tone: "warning" as Tone } : { text: t.controlled, tone: "success" as Tone };
  const riskDelta = metrics.riskScore <= 15 ? { text: t.stable, tone: "success" as Tone } : metrics.riskScore <= 35 ? { text: t.monitor, tone: "warning" as Tone } : { text: locale === "en" ? "High" : "Tinggi", tone: "danger" as Tone };

  const checklist = [
    { label: t.addCoreProducts, done: products.length >= 3 },
    { label: t.recordCashflow, done: metrics.totalExpenses > 0 || metrics.totalRevenue > 0 },
    { label: t.syncMarketplace, done: Boolean(lastSync) || products.some((item) => Boolean(item.marketplace)) },
    { label: t.activateAiReport, done: isPro },
  ];
  const checklistSelesai = checklist.filter((item) => item.done).length;
  const checklistProgress = Math.round((checklistSelesai / checklist.length) * 100);

  const activityItems = [
    {
      title: lowStockCount > 0 ? (locale === "en" ? `${lowStockCount} SKUs need stock attention` : `${lowStockCount} SKU perlu perhatian stok`) : (locale === "en" ? "Core stock is controlled" : t.stockSafe),
      detail: lowStockCount > 0 ? (locale === "en" ? `Prioritize restock for ${criticalPreview[0]?.name || "the main product"}.` : `${t.priority}: ${criticalPreview[0]?.name || "produk utama"}.`) : (locale === "en" ? "No products are currently in critical status." : "Belum ada produk yang masuk status kritis."),
      time: t.justNow,
    },
    {
      title: lastSync ? (locale === "en" ? "Marketplace synced recently" : "Marketplace terakhir tersinkron") : (locale === "en" ? "No marketplace sync yet" : "Belum ada sinkronisasi marketplace"),
      detail: lastSync ? (locale === "en" ? `Last update ${lastSyncText}.` : `Update terakhir ${lastSyncText}.`) : (locale === "en" ? "Import CSV or connect channels for more accurate data." : "Impor CSV atau hubungkan channel agar data lebih akurat."),
      time: t.today,
    },
    {
      title: lossProducts.length > 0 ? (locale === "en" ? `${lossProducts.length} products need margin review` : `${lossProducts.length} produk margin perlu ditinjau`) : (locale === "en" ? "Product margin is safe" : "Margin produk aman"),
      detail: lossProducts.length > 0 ? (locale === "en" ? `Start from ${lossPreview[0]?.name || "priority SKU"} to review COGS and fees.` : `Mulai dari ${lossPreview[0]?.name || "SKU prioritas"} untuk evaluasi HPP dan fee.`) : (locale === "en" ? "Next focus: grow the highest-margin product." : "Fokus berikutnya: kembangkan produk dengan margin tertinggi."),
      time: t.aiInsight,
    },
  ];

  const opsSignals = [
    {
      label: t.marginAnomaly,
      value: lossProducts.length ? `${lossProducts.length} SKU` : t.safe,
      helper: lossProducts.length ? t.checkCostFees : t.noNegativeMargin,
      tone: lossProducts.length ? "danger" as Tone : "success" as Tone,
    },
    {
      label: t.restockRisk,
      value: lowStockCount ? `${lowStockCount} SKU` : t.controlled,
      helper: lowStockCount ? `${t.priority}: ${criticalPreview[0]?.name || (locale === "en" ? "fast-moving product" : "produk cepat habis")}.` : t.stockSafe,
      tone: lowStockCount ? "warning" as Tone : "success" as Tone,
    },
    {
      label: t.operatingCash,
      value: metrics.netCash >= 0 ? t.positive : t.deficit,
      helper: metrics.dailyLeakEstimate > 0 ? `${t.leakEstimate} ${money(metrics.dailyLeakEstimate)}/${t.days}.` : t.noDailyCostPressure,
      tone: metrics.netCash >= 0 ? "success" as Tone : "danger" as Tone,
    },
  ];

  const workflowSteps = [
    { step: "1", title: t.validateOrder, detail: `${metrics.totalUnits} ${t.orderRecorded}`, active: metrics.totalUnits > 0 },
    { step: "2", title: t.updateStock, detail: `${metrics.totalStock} ${t.unitsAvailable}`, active: products.length > 0 },
    { step: "3", title: t.reviewProfit, detail: `${percent(metrics.avgMargin)} ${t.avgMargin}`, active: metrics.totalProfit !== 0 },
    { step: "4", title: t.takeAction, detail: actionText, active: true },
  ];

  const nextBestActions = [
    { title: lowStockCount ? t.quickRestockPlan : t.pushBestMargin, detail: lowStockCount ? t.secureSku : t.useTopProfit },
    { title: lossProducts.length ? t.fixLossPrice : t.keepDataRhythm, detail: lossProducts.length ? t.adjustPrice : t.recordDaily },
  ];

  return (
    <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
      <style>{`
        .overview-grid, .hero-layout, .metrics-grid, .dashboard-grid, .chart-grid, .right-stack, .status-mini-grid, .kpi-status-grid, .command-side, .feed-grid { min-width: 0; }
        .overview-grid { display: grid; grid-template-columns: minmax(0, 1.42fr) minmax(300px, 0.58fr); gap: 12px; align-items: start; }
        .hero-layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr); gap: 12px; padding: 16px; position: relative; }
        .hero-copy { position: relative; z-index: 1; min-width: 0; }
        .hero-title { margin: 8px 0 6px; font-size: clamp(25px, 2.55vw, 36px); line-height: 1.03; letter-spacing: -1.15px; max-width: 720px; }
        .hero-subtitle { margin: 0; color: #cbd5e1; font-size: 12px; line-height: 1.58; max-width: 720px; }
        .command-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
        .hero-fill-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 12px; }
        .hero-fill-card { padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.13); min-width: 0; }
        .hero-fill-card strong { display: block; color: white; font-size: 13px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hero-fill-card small { color: #94a3b8; font-size: 11px; line-height: 1.45; }
        .status-mini-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
        .command-side { position: relative; z-index: 1; display: grid; gap: 10px; min-width: 0; }
        .kpi-status-grid { display: grid; gap: 10px; }
        .compact-panel { padding: 14px; border-radius: 20px; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.16); backdrop-filter: blur(16px); }
        .board-stack { display: grid; gap: 12px; align-content: start; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .dashboard-grid { display: grid; }
        
        /* Gaya Khusus Kotak Input Pencarian Baru */
        .live-search-container {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 12px 16px;
          border-radius: 16px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .live-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
        }
        .live-search-input::placeholder {
          color: #64748b;
        }
      `}</style>

      {/* KOTAK INPUT PENCARIAN LIVE BARU UNTUK TEMBEK DATA SCRAPER */}
      <div className="live-search-container">
        <span style={{ fontSize: 18 }}>🔍</span>
        <input 
          type="text"
          className="live-search-input"
          placeholder="Ketik produk (Contoh: sepatu, kemeja) lalu tekan ENTER untuk scrape pasar otomatis..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearchScrape) {
              onSearchScrape(e.currentTarget.value);
            }
          }}
        />
        <Badge label="API Live Scraper" tone="success" />
      </div>

            <h1 className="hero-title">{t.heroTitle}</h1>
            <p className="hero-subtitle">{t.heroSubtitle}</p>
            <div className="command-actions">
              <button onClick={onAddProduct} style={{ ...ctaButtonStyle, background: "linear-gradient(135deg,#ffffff,#ccfbf1)", color: "#0f172a", boxShadow: "0 18px 40px rgba(255,255,255,0.12)" }}>{t.addProduct}</button>
              <button onClick={onAddCashflow} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>{t.addCashflow}</button>
              <label style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>{syncing ? "Mengimpor..." : "Impor CSV"}<input type="file" accept=".csv" onChange={onImportCSV} style={{ display: "none" }} /></label>
            </div>
            <div className="status-mini-grid">
              <MiniMetric label={t.opsScore} value={`${operatingScore}/100`} helper={healthLabel(operatingScore, t)} />
              <MiniMetric label={t.cashRunway} value={getCashRunway(metrics, t)} helper={t.cashRunwayHelper} />
              <MiniMetric label={t.marketSync} value={lastSync ? t.connected : t.waiting} helper={lastSyncText} />
              <MiniMetric label={t.aiPriority} value={lossProducts.length ? (locale === "en" ? `${lossProducts.length} to review` : `${lossProducts.length} perlu ditinjau`) : (locale === "en" ? "Ready to grow" : "Siap tumbuh")} helper={t.dailyFocus} />
            </div>
            <div className="hero-fill-grid">
              <HeroFillCard label={t.focusToday} value={lowStockCount > 0 ? `${lowStockCount} ${t.stockNeedCheck}` : t.opsSafe} helper={lowStockCount > 0 ? t.startFromBestSeller : t.readyToSell} />
              <HeroFillCard label={t.topProduct} value={topProducts[0]?.name || t.noProduct} helper={topProducts[0] ? `${compactMoney(topProducts[0].profit)} ${t.profitRecorded}` : t.addProductForRank} />
              <HeroFillCard label={t.workRhythm} value={t.workRhythmValue} helper={t.workRhythmHelper} />
            </div>
          </div>

          <div className="command-side">
            <div className="compact-panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><span style={{ color: "#cbd5e1" }}>{t.netCash}</span><Badge label={metrics.netCash >= 0 ? t.cashHealthy : t.actionNeeded} tone={metrics.netCash >= 0 ? "success" : "danger"} /></div>
              <h2 style={{ margin: "8px 0 14px", fontSize: 30, letterSpacing: -1.1 }}>{money(metrics.netCash)}</h2>
              <div className="kpi-status-grid">
                <HealthRow label={t.profitToStock} value={Math.min(100, (metrics.totalProfit / Math.max(metrics.inventoryValue, 1)) * 100)} right={compactMoney(metrics.totalProfit)} />
                <HealthRow label={t.expensePressure} value={Math.min(100, (metrics.totalExpenses / Math.max(metrics.totalProfit, 1)) * 100)} right={compactMoney(metrics.totalExpenses)} />
                <HealthRow label={t.riskControl} value={Math.max(0, 100 - metrics.riskScore)} right={`${metrics.riskScore}/100`} />
              </div>
            </div>
            <div style={{ padding: 17, borderRadius: 22, background: "rgba(255,255,255,0.94)", color: "#111827", border: "1px solid rgba(255,255,255,0.20)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><strong>{t.aiDecisionToday}</strong><Badge label={t.today} tone="blue" /></div>
              <p style={{ margin: "8px 0 12px", color: "#667085", lineHeight: 1.6, fontSize: 14 }}>{actionText}</p>
              <button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "9px 12px" }}>{t.openActionPlan}</button>
            </div>
          </div>
        </div>
        <section className="ops-suite">
          <div className="ops-suite-card">
            <div className="ops-suite-header">
              <div>
                <Badge label={t.opsControl} tone="success" />
                <h3 style={{ margin: "8px 0 0", color: "white", letterSpacing: -0.4 }}>{t.dailySellerControl}</h3>
              </div>
              <span style={{ color: "#99f6e4", fontSize: 12, fontWeight: 900 }}>{t.liveBoard}</span>
            </div>
            <div className="ops-signal-grid">
              {opsSignals.map((item) => <OpsSignalCard key={item.label} {...item} />)}
            </div>
            <div className="ops-workflow">
              {workflowSteps.map((item) => <div key={item.title} className="ops-workflow-row">
                <span className="ops-step">{item.step}</span>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</strong>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.detail}</small>
                </div>
                <Badge label={item.active ? t.active : t.notYet} tone={item.active ? "success" : "neutral"} />
              </div>)}
            </div>
          </div>
          <div className="ops-suite-card">
            <div className="ops-suite-header">
              <div>
                <Badge label={t.autoAction} tone="warning" />
                <h3 style={{ margin: "8px 0 0", color: "white", letterSpacing: -0.4 }}>{t.nextSuggestion}</h3>
              </div>
            </div>
            <div className="ops-action-list">
              {nextBestActions.map((item, index) => <div key={item.title} className="ops-action-item">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <strong>{item.title}</strong>
                  <span style={{ width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center", background: "#ecfdf5", color: "#047857", fontWeight: 900, fontSize: 12 }}>{index + 1}</span>
                </div>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.55 }}>{item.detail}</p>
              </div>)}
            </div>
            <button onClick={onGoAI} style={{ ...ghostButtonStyle, marginTop: 12, width: "100%", background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>{t.openAiCenter}</button>
          </div>
        </section>
      </div>

      <aside className="board-stack">
        <section style={{ ...cardStyle, display: "grid", gap: 16, alignContent: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><Badge label={t.businessSummary} tone="blue" /><span style={{ color: "#667085", fontSize: 12 }}>{t.today}</span></div>
          <BriefRow label={t.revenue} value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} ${t.unitsSold}`} />
          <BriefRow label={t.grossProfit} value={money(metrics.totalProfit)} helper={`${percent(metrics.avgMargin)} ${t.avgMarginText}`} />
          <BriefRow label={t.inventoryValue} value={money(metrics.inventoryValue)} helper={`${metrics.totalStock} ${t.unitsAvailableShort}`} />
          <div style={{ padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{t.proReadiness}</strong><span style={{ color: "#0f766e", fontWeight: 900 }}>{isPro ? t.proActive : `${Math.max(62, checklistProgress)}%`}</span></div>
            <div style={{ margin: "10px 0" }}><Progress value={isPro ? 100 : Math.max(62, checklistProgress)} /></div>
            <p style={{ margin: 0, color: "#667085", fontSize: 12, lineHeight: 1.55 }}>{isPro ? t.proActiveText : t.proReadyText}</p>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <Badge label={t.onboardingStatus} tone="success" />
              <h3 style={{ margin: "10px 0 0", letterSpacing: -0.4 }}>{t.operationalReadiness}</h3>
            </div>
            <strong style={{ color: "#0f766e" }}>{checklistProgress}%</strong>
          </div>
          <div style={{ marginTop: 10 }}><Progress value={checklistProgress} /></div>
          <div style={{ display: "grid", gap: 2, marginTop: 10 }}>
            {checklist.map((item) => <div key={item.label} className="checklist-row">
              <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", background: item.done ? "#ecfdf5" : "#f8fafc", color: item.done ? "#047857" : "#98a2b3", border: `1px solid ${item.done ? "#a7f3d0" : "#e2e8f0"}`, fontSize: 12, fontWeight: 900 }}>{item.done ? "✓" : "•"}</span>
              <span style={{ color: item.done ? "#111827" : "#667085", fontSize: 12 }}>{item.label}</span>
              <span style={{ color: item.done ? "#047857" : "#98a2b3", fontSize: 12, fontWeight: 800 }}>{item.done ? t.done : t.notYet}</span>
            </div>)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={onGoMarketplace} style={ghostButtonStyle}>{t.connectData}</button>
            {!isPro && <button onClick={onGoBilling} style={ctaButtonStyle}>{t.activatePro}</button>}
          </div>
        </section>
      </aside>
    </section>

    <GlobalSaaSPanel
      isPro={isPro}
      products={products}
      lowStockCount={lowStockCount}
      lossCount={lossProducts.length}
      onGoMarketplace={onGoMarketplace}
      onGoReports={onGoReports}
      onGoBilling={onGoBilling}
    />

    <section className="metrics-grid">
      <StatCard label={t.revenue} value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} ${t.unitsSold}`} tone="blue" delta={revenueDelta.text} deltaTone={revenueDelta.tone} />
      <StatCard label={t.productProfit} value={money(metrics.totalProfit)} helper={`${t.avgMarginText} ${percent(metrics.avgMargin)}`} tone={metrics.totalProfit >= 0 ? "success" : "danger"} delta={profitDelta.text} deltaTone={profitDelta.tone} />
      <StatCard label={t.criticalStock} value={lowStockCount} helper={`${metrics.totalStock} ${t.unitsAvailableShort}`} tone={lowStockCount ? "warning" : "success"} delta={inventoryDelta.text} deltaTone={inventoryDelta.tone} />
      <StatCard label={t.riskScore} value={`${metrics.riskScore}/100`} helper={`${t.dailyLeak} ${money(metrics.dailyLeakEstimate)} per ${t.days}`} tone={riskTone} delta={riskDelta.text} deltaTone={riskDelta.tone} />
    </section>

    <section className="dashboard-grid">
      <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
        <div className="chart-grid">
          <LineChartCard title={t.cashflowTrend} subtitle={t.inflowOutflow} data={cashflowTrend} valueLabel={t.cashIn} secondaryLabel={t.cashOut} />
          <LineChartCard title={t.profitTrend} subtitle={t.profit7Days} data={profitTrend} valueLabel="Profit" />
        </div>
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <div><Badge label={t.skuPerformance} tone="blue" /><h2 style={{ margin: "8px 0 0", letterSpacing: -0.5 }}>{t.priorityProducts}</h2></div>
            <button onClick={onGoProducts} style={ghostButtonStyle}>{t.manageProducts}</button>
          </div>
          <div className="desktop-table"><ProductTable products={filteredProducts.slice(0, 6)} onStock={onStock} onSale={onSale} onDelete={onDelete} /></div>
          <ProductCards products={filteredProducts.slice(0, 4)} onStock={onStock} onSale={onSale} />
        </section>
      </div>

      <aside className="right-stack">
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><Badge label={t.bestNextAction} tone="success" /><button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>{t.aiDetail}</button></div>
          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <ActionItem index="01" title={t.reviewLowMargin} detail={`${lossProducts.length} ${t.lossDetected}`} cta={t.seeProducts} onClick={onGoProducts} />
            <ActionItem index="02" title={t.secureFastStock} detail={`${criticalProducts.length} ${t.criticalSkuText}`} cta={t.stock} onClick={onGoProducts} />
            <ActionItem index="03" title={t.sendWeeklyReport} detail={t.exportReportText} cta={t.reports} onClick={onGoReports} />
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Badge label={t.recentActivity} tone="neutral" /><button onClick={onGoMarketplace} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>{t.dataStatus}</button></div>
          <div style={{ display: "grid", marginTop: 10 }}>
            {activityItems.map((item) => <div key={item.title} className="activity-row">
              <span className="activity-dot" />
              <div><strong>{item.title}</strong><div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{item.detail}</div></div>
              <span style={{ color: "#98a2b3", fontSize: 12, fontWeight: 800 }}>{item.time}</span>
            </div>)}
          </div>
        </section>

        <section style={cardStyle}>
          <Badge label={t.bestProducts} tone="blue" />
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {topProducts.length ? topProducts.map((product, index) => <div key={product.id} className="top-performer-row">
              <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#ecfdf5", color: "#047857" }}>{index + 1}</strong>
              <div style={{ minWidth: 0 }}><strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{product.marketplace || t.marketplace} · {t.avgMargin} {percent(product.margin)}</div></div>
              <strong style={{ color: product.profit >= 0 ? "#047857" : "#b42318" }}>{compactMoney(product.profit)}</strong>
            </div>) : <p style={{ color: "#64748b", lineHeight: 1.65 }}>{t.noRanking}</p>}
          </div>
        </section>

        <section style={{ ...cardStyle, background: "linear-gradient(135deg,#ecfdf5,#ffffff)" }}>
          <Badge label={t.growthSetup} tone="warning" />
          <h3 style={{ margin: "12px 0 8px", letterSpacing: -0.3 }}>{t.setupTitle}</h3>
          <p style={{ color: "#64748b", lineHeight: 1.65, marginTop: 0 }}>{t.setupText}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onGoMarketplace} style={ghostButtonStyle}>{t.integrations}</button>
            <button onClick={onGoBilling} style={ctaButtonStyle}>{isPro ? t.managePlan : t.viewPro}</button>
          </div>
        </section>
      </aside>
    </section>
  </div>;
}

function HeroFillCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div className="hero-fill-card"><small>{label}</small><strong>{value}</strong><small>{helper}</small></div>;
}

function OpsSignalCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: Tone }) {
  const toneColor = tone === "danger" ? "#fecaca" : tone === "warning" ? "#fde68a" : "#99f6e4";
  return <div className="ops-signal-card">
    <small style={{ color: "#94a3b8" }}>{label}</small>
    <strong style={{ display: "block", marginTop: 6, color: toneColor, fontSize: 18, letterSpacing: -0.4 }}>{value}</strong>
    <small style={{ display: "block", marginTop: 5, color: "#cbd5e1", lineHeight: 1.45 }}>{helper}</small>
  </div>;
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ padding: 10, borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", minWidth: 0 }}><small style={{ color: "#cbd5e1" }}>{label}</small><br /><strong style={{ display: "block", marginTop: 4, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</strong><small style={{ color: "#94a3b8" }}>{helper}</small></div>;
}

function HealthRow({ label, value, right }: { label: string; value: number; right: string }) {
  return <div><div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd5e1", fontSize: 12, marginBottom: 7 }}><span>{label}</span><strong style={{ color: "white" }}>{right}</strong></div><Progress value={value} /></div>;
}

function BriefRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ paddingBottom: 10, borderBottom: "1px solid #e5e7eb" }}><div style={{ color: "#667085", fontSize: 12, fontWeight: 800 }}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 21, letterSpacing: -0.7 }}>{value}</strong><small style={{ color: "#667085" }}>{helper}</small></div>;
}

function ActionItem({ index, title, detail, cta, onClick }: { index: string; title: string; detail: string; cta: string; onClick: () => void }) {
  return <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#0f172a", color: "white", fontSize: 12 }}>{index}</strong>
    <div><strong>{title}</strong><p style={{ margin: "6px 0 12px", color: "#64748b", lineHeight: 1.55, fontSize: 12 }}>{detail}</p><button onClick={onClick} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>{cta}</button></div>
  </div>;
}


function GlobalSaaSPanel({
  isPro,
  products,
  lowStockCount,
  lossCount,
  onGoMarketplace,
  onGoReports,
  onGoBilling,
}: {
  isPro: boolean;
  products: Product[];
  lowStockCount: number;
  lossCount: number;
  onGoMarketplace: () => void;
  onGoReports: () => void;
  onGoBilling: () => void;
}) {
  const locale = useDashboardLocale();
  const t = EXEC_COPY[locale];
  const activeMarketplaces = Array.from(new Set(products.map((item) => item.marketplace).filter(Boolean))).length;
  const readiness = Math.min(100,
    (products.length > 0 ? 24 : 0) +
    (products.length >= 3 ? 18 : 0) +
    (activeMarketplaces > 0 ? 18 : 0) +
    (lowStockCount === 0 && products.length > 0 ? 14 : 0) +
    (lossCount === 0 && products.length > 0 ? 14 : 0) +
    (isPro ? 12 : 0)
  );

  const regions = [
    { code: "ID", label: "Indonesia", status: locale === "en" ? "Live" : locale === "ms" ? "Langsung" : "Live" },
    { code: "MY", label: "Malaysia", status: locale === "en" ? "Ready" : locale === "ms" ? "Sedia" : "Siap" },
    { code: "SG", label: "Singapore", status: locale === "en" ? "Next" : locale === "ms" ? "Seterusnya" : "Berikutnya" },
  ];

  const pillars = [
    { title: locale === "en" ? "Multi-language UI" : locale === "ms" ? "UI multi-bahasa" : "UI multi-bahasa", detail: locale === "en" ? "ID, EN, and MY are ready as the base for regional expansion." : locale === "ms" ? "ID, EN, dan MY sedia sebagai asas ekspansi regional." : "ID, EN, dan MY siap sebagai dasar ekspansi regional.", done: true },
    { title: locale === "en" ? "Marketplace data layer" : "Lapisan data marketplace", detail: locale === "en" ? "CSV/API foundation for Shopee, Tokopedia, TikTok Shop, and new channels." : locale === "ms" ? "CSV/API sedia untuk Shopee, Tokopedia, TikTok Shop, dan channel baharu." : "CSV/API siap untuk Shopee, Tokopedia, TikTok Shop, dan channel baru.", done: activeMarketplaces > 0 },
    { title: locale === "en" ? "Operating intelligence" : "Intelijen operasional", detail: locale === "en" ? "Profit, inventory, cash runway, risks, and AI recommendations in one command center." : locale === "ms" ? "Profit, inventori, runway tunai, risiko, dan cadangan AI dalam satu pusat kawalan." : "Profit, stok, cash runway, risiko, dan rekomendasi AI dalam satu command center.", done: products.length > 0 },
    { title: locale === "en" ? "PRO monetization" : "Monetisasi PRO", detail: locale === "en" ? "Free limits, PRO, team, automation, and reports form the SaaS revenue path." : locale === "ms" ? "Limit percuma, PRO, pasukan, automasi, dan laporan sebagai laluan revenue SaaS." : "Limit Free, PRO, team, automation, dan report sebagai jalur SaaS revenue.", done: isPro },
  ];

  return <section style={{ ...cardStyle, padding: 0, overflow: "hidden", background: "linear-gradient(135deg,#ffffff,#f8fafc)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(280px,0.95fr)", gap: 0 }}>
      <div style={{ padding: 18, borderRight: "1px solid #e2e8f0", minWidth: 0 }}>
        <Badge label={t.globalBadge} tone="blue" />
        <h2 style={{ margin: "10px 0 6px", letterSpacing: -0.7 }}>{t.globalTitle}</h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.65 }}>{t.globalDescription}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 14 }}>
          {pillars.map((item) => <div key={item.title} style={{ padding: 12, borderRadius: 16, background: item.done ? "#ecfdf5" : "#f8fafc", border: `1px solid ${item.done ? "#a7f3d0" : "#e2e8f0"}` }}>
            <strong style={{ display: "block", fontSize: 13, color: item.done ? "#047857" : "#0f172a" }}>{item.title}</strong>
            <small style={{ display: "block", color: "#64748b", lineHeight: 1.45, marginTop: 5 }}>{item.detail}</small>
          </div>)}
        </div>
      </div>
      <div style={{ padding: 18, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div><small style={{ color: "#64748b", fontWeight: 800 }}>{t.expansionReadiness}</small><strong style={{ display: "block", fontSize: 28, letterSpacing: -1, marginTop: 2 }}>{readiness}%</strong></div>
          <Badge label={readiness >= 70 ? t.scaleReady : t.buildPhase} tone={readiness >= 70 ? "success" : "warning"} />
        </div>
        <div style={{ marginTop: 10 }}><Progress value={readiness} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
          {regions.map((region) => <div key={region.code} style={{ padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "#ffffff" }}>
            <strong>{region.code}</strong>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>{region.label}</div>
            <small style={{ color: region.code === "ID" ? "#047857" : "#0f766e", fontWeight: 900 }}>{region.status}</small>
          </div>)}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <button onClick={onGoMarketplace} style={ghostButtonStyle}>{t.connectData}</button>
          <button onClick={onGoReports} style={ghostButtonStyle}>{t.viewReports}</button>
          {!isPro && <button onClick={onGoBilling} style={ctaButtonStyle}>{t.activatePro}</button>}
        </div>
      </div>
    </div>
  </section>;
}
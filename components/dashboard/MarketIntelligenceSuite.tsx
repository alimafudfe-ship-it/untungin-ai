"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, Tone } from "@/types/dashboard";
import type { MIBundle, MICategory, MICreator, MILivestream, MIMarketplace, MIProduct, MIProviderStatus, MIResearchSource, MIShop, MISortKey, MISourceType, MITrendPeriod, MIVideoAd } from "@/lib/market-intelligence/types";
import { scoreCategory, scoreCreator, scoreLive, scoreProduct, scoreShop, scoreVideo, summarizeBundle } from "@/lib/market-intelligence/scoring";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, colors, ctaButtonStyle, EmptyState, ghostButtonStyle, inputStyle, Progress, StatCard } from "./ui";

type IntelligenceTab = "overview" | "products" | "categories" | "shops" | "creators" | "videos" | "lives" | "import";
type QuickMarket = "All" | "Shopee" | "TikTok Shop" | "Tokopedia" | "Lazada";

type ApiState = MIBundle;

const EMPTY_BUNDLE: MIBundle = {
  products: [],
  categories: [],
  shops: [],
  creators: [],
  videos: [],
  lives: [],
  sources: [],
  providers: [],
  errors: [],
  generatedAt: new Date().toISOString(),
  dataMode: "empty",
  activeSource: "Memuat sumber data",
  isDemo: false,
  rowCount: 0,
};

const TABS: { key: IntelligenceTab; label: string; helper: string }[] = [
  { key: "overview", label: "Overview", helper: "Ringkasan peluang" },
  { key: "products", label: "Produk Trending", helper: "Sales, revenue, growth" },
  { key: "categories", label: "Kategori", helper: "Niche naik" },
  { key: "shops", label: "Toko", helper: "Kompetitor" },
  { key: "creators", label: "Kreator", helper: "Affiliate fit" },
  { key: "videos", label: "Video & Ads", helper: "Hook perform" },
  { key: "lives", label: "Live", helper: "Live commerce" },
  { key: "import", label: "Import/Admin", helper: "CSV & feed" },
];

const MARKETPLACES: { key: QuickMarket; label: string; helper: string }[] = [
  { key: "All", label: "Semua", helper: "Gabungan channel" },
  { key: "TikTok Shop", label: "TikTok Shop", helper: "Viral, kreator, live" },
  { key: "Shopee", label: "Shopee", helper: "Listing & search" },
  { key: "Tokopedia", label: "Tokopedia", helper: "Demand evergreen" },
  { key: "Lazada", label: "Lazada", helper: "Harga kompetitif" },
];

const PERIOD_LABEL: Record<MITrendPeriod, string> = {
  today: "Hari ini",
  week: "Minggu ini",
  month: "Bulan ini",
  special_day: "Hari besar",
};

const SORT_LABEL: Record<MISortKey, string> = {
  opportunity: "Peluang terbaik",
  sales: "Sales tertinggi",
  revenue: "Revenue tertinggi",
  growth: "Growth tertinggi",
  competition: "Kompetisi rendah",
  updated: "Update terbaru",
};


const AI_FEATURES = [
  { title: "AI hook video viral", result: "Hook terbaik hari ini: 'Produk receh ini ternyata bikin dapur rapi dalam 5 menit'" },
  { title: "AI script konten otomatis", result: "Script: Masalah → demo produk → bukti hasil → CTA checkout sekarang." },
  { title: "AI prediksi produk musiman", result: "Prediksi: kategori fashion muslim dan perlengkapan hujan naik 34% minggu ini." },
  { title: "Deteksi produk mau trending", result: "Alert: produk organizer kosmetik naik cepat di TikTok Shop." },
  { title: "AI rekomendasi harga jual", result: "Harga optimal: Rp49.900 dengan estimasi margin bersih 32%." },
  { title: "AI anti boncos produk", result: "Warning: kompetisi tinggi dan rating supplier menurun." },
];

const CSV_COLUMNS = [
  "module",
  "id",
  "name",
  "marketplace",
  "country",
  "category",
  "keyword",
  "price_min",
  "price_max",
  "sold_7d",
  "sold_30d",
  "revenue_7d",
  "revenue_30d",
  "growth_7d",
  "growth_30d",
  "seller_count",
  "creator_count",
  "video_count",
  "live_count",
  "ad_count",
  "rating",
  "review_count",
  "demand_score",
  "growth_score",
  "competition_score",
  "opportunity_score",
  "source",
  "source_url",
  "notes",
];

function count(value: number | undefined) {
  return Number(value || 0).toLocaleString("id-ID");
}

function scoreTone(score: number): Tone {
  if (score >= 82) return "success";
  if (score >= 68) return "blue";
  if (score >= 52) return "warning";
  return "neutral";
}

function signalTone(signal: string): Tone {
  if (signal === "viral" || signal === "rising") return "success";
  if (signal === "seasonal") return "warning";
  if (signal === "declining") return "danger";
  return "blue";
}

function providerTone(status: MIProviderStatus["status"]): Tone {
  if (status === "ready") return "success";
  if (status === "demo") return "blue";
  if (status === "error") return "danger";
  return "neutral";
}

function dataModeTone(mode?: MIBundle["dataMode"]): Tone {
  if (mode === "supabase" || mode === "feed" || mode === "mixed") return "success";
  if (mode === "demo") return "warning";
  return "neutral";
}

function csvEscape(value: unknown) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function productToCsv(item: MIProduct) {
  return [
    "product",
    item.id,
    item.productName,
    item.marketplace,
    item.country,
    item.category,
    item.keyword,
    item.priceMin,
    item.priceMax,
    item.sold7d,
    item.sold30d,
    item.revenue7d,
    item.revenue30d,
    item.growth7d,
    item.growth30d,
    item.sellerCount,
    item.creatorCount,
    item.videoCount,
    item.liveCount,
    item.adCount,
    item.avgRating,
    item.reviewCount,
    item.demandScore,
    item.growthScore,
    item.competitionScore,
    Math.round(scoreProduct(item)),
    item.source,
    item.sourceUrl || "",
    item.notes || "",
  ].map(csvEscape).join(",");
}

function exportProducts(rows: MIProduct[]) {
  const lines = [CSV_COLUMNS.join(","), ...rows.map(productToCsv)];
  downloadText(`untungin-market-intelligence-products-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"));
}

function exportTemplate() {
  const example = [
    CSV_COLUMNS.join(","),
    ["product", "manual-001", "Nama produk contoh", "TikTok Shop", "ID", "Beauty", "keyword produk", "15000", "49000", "120", "800", "3000000", "21000000", "15", "42", "18", "12", "40", "6", "3", "4.7", "120", "80", "76", "44", "78", "Manual research", "", "Catatan riset"].map(csvEscape).join(","),
  ];
  downloadText("template-untungin-market-intelligence-v2.csv", example.join("\n"));
}

function categoryOptions(bundle: MIBundle) {
  return ["All", ...Array.from(new Set(bundle.products.map((item) => item.category).concat(bundle.categories.map((item) => item.name)))).sort()];
}

function marketplaceOptions(bundle: MIBundle) {
  const values = bundle.products.map((item) => item.marketplace);
  return ["All", ...Array.from(new Set(values)).sort()] as MIMarketplace[];
}

function countryOptions(bundle: MIBundle) {
  return ["All", ...Array.from(new Set(bundle.products.map((item) => item.country))).sort()];
}

function productName(products: MIProduct[], id?: string) {
  if (!id) return "-";
  return products.find((item) => item.id === id)?.productName || id;
}

function recommendationForProduct(item: MIProduct) {
  const score = scoreProduct(item);
  if (item.competitionScore <= 50 && score >= 75) return "Layak dites kecil: cari supplier, hitung margin bersih, lalu validasi 3 angle konten.";
  if (item.competitionScore >= 65) return "Masuk hanya dengan diferensiasi: bundling, foto lebih kuat, bonus, atau kreator niche.";
  if (item.marginSignal >= 78) return "Menarik untuk bundling dan upsell karena sinyal margin kuat.";
  return "Pantau 7 hari: cek review negatif, seller baru, dan stabilitas demand sebelum stok besar.";
}

function buildPlaybook(bundle: MIBundle) {
  const summary = summarizeBundle(bundle);
  const top = summary.topProduct;
  const low = summary.lowCompetition;
  return [
    top ? `Prioritas pertama: ${top.productName}. Skor peluang ${Math.round(scoreProduct(top))}/100, sold 30d ${count(top.sold30d)}, revenue 30d ${compactMoney(top.revenue30d)}.` : "Belum ada produk prioritas.",
    low ? `Peluang kompetisi rendah: ${low.productName}. Demand ${low.demandScore}/100, kompetisi ${low.competitionScore}/100.` : "Belum ada produk dengan kombinasi demand tinggi dan kompetisi rendah.",
    "Aksi 1: ambil 5 produk teratas, cek 20 listing kompetitor, lalu catat keluhan review 1-2 bintang.",
    "Aksi 2: validasi supplier, berat paket, retur, garansi, fee marketplace, voucher, dan komisi affiliate.",
    "Aksi 3: tes konten 7 hari sebelum stok besar: demo, problem-solution, before-after, dan testimoni.",
  ];
}

function MiniMetric({ label, value, helper, tone = "neutral" }: { label: string; value: string | number; helper?: string; tone?: Tone }) {
  const color = tone === "success" ? colors.brand : tone === "blue" ? "#175cd3" : tone === "warning" ? "#b45309" : colors.ink;
  return <div style={{ padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", minWidth: 0 }}>
    <div style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>{label}</div>
    <strong style={{ display: "block", marginTop: 4, fontSize: 18, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</strong>
    {helper ? <small style={{ color: colors.muted }}>{helper}</small> : null}
  </div>;
}

function ProductCard({ item }: { item: MIProduct }) {
  const score = scoreProduct(item);
  return <div style={{ padding: 16, borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 10px 28px rgba(15,23,42,0.04)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <strong style={{ fontSize: 17 }}>{item.productName}</strong>
        <div style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>{item.marketplace} · {item.country} · {PERIOD_LABEL[item.period]} · {item.category} · keyword: {item.keyword}</div>
      </div>
      <Badge label={`${Math.round(score)}/100`} tone={scoreTone(score)} />
    </div>
    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
      <MiniMetric label="Sold 30d" value={count(item.sold30d)} helper={`7d ${count(item.sold7d)}`} tone="blue" />
      <MiniMetric label="Revenue 30d" value={compactMoney(item.revenue30d)} helper={`7d ${compactMoney(item.revenue7d)}`} tone="success" />
      <MiniMetric label="Growth" value={`${item.growth30d}%`} helper={`7d ${item.growth7d}%`} tone="warning" />
      <MiniMetric label="Harga" value={`${money(item.priceMin)}-${money(item.priceMax)}`} helper="range pasar" />
    </div>
    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 }}>
      <MiniMetric label="Seller" value={count(item.sellerCount)} />
      <MiniMetric label="Kreator" value={count(item.creatorCount)} />
      <MiniMetric label="Video/Ads" value={`${count(item.videoCount)} / ${count(item.adCount)}`} />
      <MiniMetric label="Live" value={count(item.liveCount)} />
    </div>
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, color: colors.muted, fontSize: 12 }}>
        <span>Demand <b>{item.demandScore}/100</b></span>
        <span>Growth <b>{item.growthScore}/100</b></span>
        <span>Kompetisi <b>{item.competitionScore}/100</b></span>
      </div>
      <Progress value={score} />
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      <Badge label={item.signal} tone={signalTone(item.signal)} />
      <Badge label={`Rating ${item.avgRating}/5 · ${count(item.reviewCount)} review`} tone="neutral" />
      <Badge label={`Saturasi ${item.saturationScore}/100`} tone={item.saturationScore >= 65 ? "warning" : "success"} />
      <Badge label={`Margin signal ${item.marginSignal}/100`} tone={item.marginSignal >= 70 ? "success" : "neutral"} />
    </div>
    <p style={{ color: colors.ink, lineHeight: 1.6, margin: "12px 0 0", fontSize: 13 }}>{recommendationForProduct(item)}</p>
    {item.notes ? <p style={{ color: colors.muted, lineHeight: 1.55, margin: "8px 0 0", fontSize: 12 }}>{item.notes}</p> : null}
  </div>;
}

function CategoryTable({ rows }: { rows: MICategory[] }) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((item) => <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><strong>{item.name}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.marketplace} · {item.country} · {item.parent || "Kategori"}</div></div>
        <Badge label={`Opportunity ${Math.round(scoreCategory(item))}/100`} tone={scoreTone(scoreCategory(item))} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
        <MiniMetric label="Produk" value={count(item.productCount)} />
        <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
        <MiniMetric label="Revenue 30d" value={compactMoney(item.revenue30d)} />
        <MiniMetric label="Kompetisi" value={`${item.competitionScore}/100`} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>{item.topKeywords.map((keyword) => <Badge key={keyword} label={keyword} tone="blue" />)}</div>
      {item.notes ? <p style={{ color: colors.muted, fontSize: 13, marginBottom: 0 }}>{item.notes}</p> : null}
    </div>)}
  </div>;
}

function ShopTable({ rows, products }: { rows: MIShop[]; products: MIProduct[] }) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((item) => <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><strong>{item.shopName}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.marketplace} · {item.country} · Fokus {item.categoryFocus}</div></div>
        <Badge label={`Benchmark ${Math.round(scoreShop(item))}/100`} tone={scoreTone(scoreShop(item))} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
        <MiniMetric label="SKU" value={count(item.productCount)} />
        <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
        <MiniMetric label="Revenue" value={compactMoney(item.revenue30d)} />
        <MiniMetric label="Follower" value={count(item.followers)} />
        <MiniMetric label="Rating" value={`${item.avgRating}/5`} helper={`${count(item.reviewCount)} review`} />
      </div>
      <p style={{ color: colors.ink, fontSize: 13, lineHeight: 1.55, margin: "10px 0 0" }}>Produk top: <b>{productName(products, item.topProductId)}</b>. Gap: {item.opportunityGap}</p>
    </div>)}
  </div>;
}

function CreatorTable({ rows, products }: { rows: MICreator[]; products: MIProduct[] }) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((item) => <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><strong>{item.creatorName}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.handle} · {item.marketplace} · {item.categoryFocus}</div></div>
        <Badge label={`Fit ${Math.round(scoreCreator(item))}/100`} tone={scoreTone(scoreCreator(item))} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
        <MiniMetric label="Follower" value={count(item.followers)} />
        <MiniMetric label="Avg views" value={count(item.avgViews)} />
        <MiniMetric label="Engagement" value={percent(item.engagementRate)} />
        <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
        <MiniMetric label="Komisi" value={`${item.commissionRate}%`} />
      </div>
      <p style={{ color: colors.ink, fontSize: 13, lineHeight: 1.55, margin: "10px 0 0" }}>Produk cocok: <b>{productName(products, item.topProductId)}</b>. {item.notes || "Prioritaskan briefing konten yang spesifik dan sample produk."}</p>
    </div>)}
  </div>;
}

function VideoTable({ rows, products }: { rows: MIVideoAd[]; products: MIProduct[] }) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((item) => <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><strong>{item.title}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.format} · {item.marketplace} · {productName(products, item.productId)}</div></div>
        <Badge label={`Creative ${Math.round(scoreVideo(item))}/100`} tone={scoreTone(scoreVideo(item))} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 12 }}>
        <MiniMetric label="Views" value={count(item.views)} />
        <MiniMetric label="Likes" value={count(item.likes)} />
        <MiniMetric label="Comment" value={count(item.comments)} />
        <MiniMetric label="CTR" value={`${item.ctr}%`} />
        <MiniMetric label="CVR" value={`${item.cvr}%`} />
        <MiniMetric label="GMV est." value={compactMoney(item.gmvEstimate)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }} className="main-grid">
        <div style={{ padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}><strong>Hook</strong><p style={{ margin: "6px 0 0", color: colors.muted }}>{item.hook}</p></div>
        <div style={{ padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}><strong>CTA</strong><p style={{ margin: "6px 0 0", color: colors.muted }}>{item.cta}</p></div>
      </div>
    </div>)}
  </div>;
}

function LiveTable({ rows, products }: { rows: MILivestream[]; products: MIProduct[] }) {
  return <div style={{ display: "grid", gap: 10 }}>
    {rows.map((item) => <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><strong>{item.title}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.hostName} · {item.hostType} · {item.marketplace} · {item.categoryFocus}</div></div>
        <Badge label={`Live ${Math.round(scoreLive(item))}/100`} tone={scoreTone(scoreLive(item))} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
        <MiniMetric label="Peak viewers" value={count(item.viewersPeak)} />
        <MiniMetric label="Durasi" value={`${item.durationMin}m`} />
        <MiniMetric label="Sold" value={count(item.soldUnits)} />
        <MiniMetric label="Revenue" value={compactMoney(item.revenue)} />
        <MiniMetric label="Conversion" value={`${item.conversionRate}%`} />
      </div>
      <p style={{ color: colors.ink, fontSize: 13, lineHeight: 1.55, margin: "10px 0 0" }}>Produk live: {item.productIds.map((id) => productName(products, id)).join(" · ")}</p>
      {item.notes ? <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.55, margin: "6px 0 0" }}>{item.notes}</p> : null}
    </div>)}
  </div>;
}

function SourceStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "active" || status === "checked" ? "success" : status === "failed" ? "danger" : status === "archived" ? "neutral" : "warning";
  return <Badge label={status} tone={tone} />;
}

function SourceLinkCard({ item }: { item: MIResearchSource }) {
  return <div style={{ padding: 14, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", display: "grid", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</strong>
        <div style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.marketplace} · {item.sourceType} · {item.country} · {item.category || "Tanpa kategori"}</div>
      </div>
      <SourceStatusBadge status={item.status} />
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {item.keyword ? <Badge label={`Keyword: ${item.keyword}`} tone="blue" /> : null}
      <Badge label={`Extracted: ${count(item.extractedCount)}`} tone="neutral" />
      <Badge label={`Update: ${new Date(item.updatedAt).toLocaleDateString("id-ID")}`} tone="neutral" />
    </div>
    <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ color: colors.brand, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sourceUrl}</a>
    {item.notes ? <p style={{ color: colors.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>{item.notes}</p> : null}
  </div>;
}

function ImportPanel() {
  const jsonExample = `{
  "products": [],
  "categories": [],
  "shops": [],
  "creators": [],
  "videos": [],
  "lives": [],
  "sources": []
}`;
  const [adminToken, setAdminToken] = useState("");
  const [sourceRows, setSourceRows] = useState<MIResearchSource[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceMessage, setSourceMessage] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [form, setForm] = useState({
    title: "",
    marketplace: "Tokopedia",
    sourceType: "search" as MISourceType,
    sourceUrl: "",
    keyword: "",
    category: "",
    country: "ID",
    status: "queued",
    notes: "",
  });

  const updateForm = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const loadSources = () => {
    setSourceLoading(true);
    fetch("/api/market-intelligence/sources")
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) throw new Error(payload.error || "Gagal membaca source link.");
        setSourceRows(payload.sources || []);
        setSourceError("");
      })
      .catch((error: Error) => setSourceError(error.message || "Gagal membaca source link. Pastikan migration V4 sudah dijalankan."))
      .finally(() => setSourceLoading(false));
  };

  useEffect(() => {
    loadSources();
  }, []);

  const saveSource = async () => {
    setSourceMessage("");
    setSourceError("");
    if (!adminToken.trim()) {
      setSourceError("Masukkan Admin Token yang sama dengan MARKET_INTELLIGENCE_ADMIN_TOKEN di Vercel.");
      return;
    }
    if (!form.sourceUrl.trim()) {
      setSourceError("Paste URL marketplace dulu.");
      return;
    }
    setSourceLoading(true);
    try {
      const response = await fetch("/api/market-intelligence/sources", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-market-intelligence-token": adminToken.trim(),
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Gagal menyimpan source link.");
      setSourceMessage("Link marketplace berhasil disimpan ke Supabase.");
      setForm((current) => ({ ...current, title: "", sourceUrl: "", keyword: "", notes: "" }));
      loadSources();
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : "Gagal menyimpan source link.");
    } finally {
      setSourceLoading(false);
    }
  };

  return <div style={{ display: "grid", gap: 14 }}>
    <section style={cardStyle}>
      <Badge label="V5 Partner Feed Ready" tone="success" />
      <h2 style={{ margin: "10px 0 6px" }}>Partner Feed API + source link manager</h2>
      <p style={{ color: colors.muted, lineHeight: 1.7, marginTop: 0 }}>V5 menyiapkan aplikasi untuk dijual sebagai SaaS: simpan link sumber riset, terima data legal dari partner/API resmi, lalu upsert otomatis ke Supabase untuk produk, toko, kreator, video, live, kategori, dan source link.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={ctaButtonStyle} onClick={exportTemplate}>Download template CSV</button>
        <button style={ghostButtonStyle} onClick={() => downloadText("market-intelligence-feed-example.json", jsonExample, "application/json;charset=utf-8")}>Download contoh JSON feed</button>
        <button style={ghostButtonStyle} onClick={() => downloadText("template-marketplace-source-links-v4.csv", "external_id,title,marketplace,source_type,source_url,keyword,category,country,status,notes\nsrc-tokopedia-powerbank-search,Tokopedia powerbank fast charging,Tokopedia,search,https://www.tokopedia.com/search?st=product&q=powerbank%20fast%20charging,powerbank fast charging,Elektronik,ID,queued,Catatan riset", "text/csv;charset=utf-8")}>Download template source link</button>
        <button style={ghostButtonStyle} onClick={() => window.open("/examples/partner-feed-products-v5.json", "_blank")}>Contoh partner products JSON</button>
        <button style={ghostButtonStyle} onClick={() => window.open("/api/market-intelligence/partner-feed", "_blank")}>Cek Partner API</button>
        <button style={ghostButtonStyle} onClick={loadSources} disabled={sourceLoading}>{sourceLoading ? "Memuat..." : "Refresh source link"}</button>
      </div>
    </section>

    <section style={cardStyle}>
      <Badge label="Tambah link sumber" tone="blue" />
      <h3>Simpan link marketplace ke Supabase</h3>
      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Admin token" type="password" style={inputStyle} />
        <select value={form.marketplace} onChange={(event) => updateForm("marketplace", event.target.value)} style={inputStyle}>
          {["TikTok Shop", "Shopee", "Tokopedia", "Lazada", "Manual", "Public Feed"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={form.sourceType} onChange={(event) => updateForm("sourceType", event.target.value)} style={inputStyle}>
          {["search", "product", "shop", "category", "creator", "video", "live", "keyword", "other"].map((item) => <option key={item} value={item}>Jenis: {item}</option>)}
        </select>
      </div>
      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Judul sumber, contoh: Tokopedia powerbank fast charging" style={inputStyle} />
        <input value={form.sourceUrl} onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="Paste URL marketplace" style={inputStyle} />
      </div>
      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.5fr 0.7fr", gap: 10, marginTop: 10 }}>
        <input value={form.keyword} onChange={(event) => updateForm("keyword", event.target.value)} placeholder="Keyword, contoh: powerbank fast charging" style={inputStyle} />
        <input value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="Kategori, contoh: Elektronik" style={inputStyle} />
        <select value={form.country} onChange={(event) => updateForm("country", event.target.value)} style={inputStyle}>{["ID", "MY", "SG"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={form.status} onChange={(event) => updateForm("status", event.target.value)} style={inputStyle}>{["draft", "queued", "active", "checked", "failed", "archived"].map((item) => <option key={item} value={item}>Status: {item}</option>)}</select>
      </div>
      <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Catatan riset, contoh: cek 20 produk pertama, catat harga dan review negatif" style={{ ...inputStyle, minHeight: 90, marginTop: 10, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <button style={ctaButtonStyle} onClick={saveSource} disabled={sourceLoading}>{sourceLoading ? "Menyimpan..." : "Simpan link marketplace"}</button>
        {sourceMessage ? <Badge label={sourceMessage} tone="success" /> : null}
        {sourceError ? <Badge label={sourceError} tone="warning" /> : null}
      </div>
    </section>

    <section style={cardStyle}>
      <Badge label={`Source tersimpan: ${sourceRows.length}`} tone="success" />
      <h3>Daftar link sumber riset</h3>
      {sourceRows.length ? <div style={{ display: "grid", gap: 10 }}>{sourceRows.map((item) => <SourceLinkCard key={item.id} item={item} />)}</div> : <EmptyState title="Belum ada source link" description="Jalankan migration V4, lalu paste link marketplace di form atas." />}
    </section>

    <section style={cardStyle}>
      <Badge label="Environment Variables" tone="blue" />
      <h3>Supabase / Feed yang didukung</h3>
      <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 16, overflowX: "auto" }}>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
MARKET_INTELLIGENCE_MODE=supabase
MARKET_INTELLIGENCE_USE_DEMO=false

# Wajib untuk tombol Simpan Link Marketplace dan Partner Feed API:
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
MARKET_INTELLIGENCE_ADMIN_TOKEN=token-rahasia-kamu
MARKET_INTELLIGENCE_PARTNER_TOKEN=token-partner-rahasia

# Endpoint partner feed V5:
POST /api/market-intelligence/partner-feed/products
POST /api/market-intelligence/partner-feed/shops
POST /api/market-intelligence/partner-feed/creators
POST /api/market-intelligence/partner-feed/videos
POST /api/market-intelligence/partner-feed/lives

# Opsional kalau pakai JSON feed eksternal/legal:
MARKET_INTELLIGENCE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json
KALODATA_LIKE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json`}</pre>
      <p style={{ color: colors.muted, lineHeight: 1.7 }}>Set <strong>MARKET_INTELLIGENCE_MODE=supabase</strong> dan <strong>MARKET_INTELLIGENCE_USE_DEMO=false</strong> agar dashboard hanya membaca database. <strong>SUPABASE_SERVICE_ROLE_KEY</strong> hanya dipakai server API, jangan taruh di kode frontend.</p>
    </section>
    <section style={cardStyle}>
      <Badge label="Kolom CSV" tone="neutral" />
      <p style={{ color: colors.muted, lineHeight: 1.7 }}>{CSV_COLUMNS.join(", ")}</p>
    </section>
  </div>;
}

function OverviewPanel({ bundle, products }: { bundle: MIBundle; products?: Product[] }) {
  const summary = summarizeBundle(bundle);
  const playbook = buildPlaybook(bundle);
  const topCategories = bundle.categories.slice(0, 4);
  const topCreators = bundle.creators.slice(0, 3);
  const userSkuHint = products?.length ? `${products.length} SKU toko tersedia. Cocokkan katalog sendiri dengan produk trending di bawah.` : "Belum ada SKU toko, gunakan riset ini untuk tambah katalog awal.";

  return <div style={{ display: "grid", gap: 14 }}>
    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      <StatCard label="Top opportunity" value={summary.topProduct?.productName || "-"} helper={summary.topProduct ? `${summary.topProduct.marketplace} · skor ${Math.round(scoreProduct(summary.topProduct))}/100` : "-"} tone="success" />
      <StatCard label="Sales 30d" value={count(summary.totalSales)} helper="Gabungan produk terfilter" tone="blue" />
      <StatCard label="Revenue 30d" value={compactMoney(summary.totalRevenue)} helper={bundle.isDemo ? "Demo intelligence" : "Live/feed intelligence"} tone="success" />
      <StatCard label="Avg opportunity" value={`${Math.round(summary.avgOpportunity)}/100`} helper={userSkuHint} tone="warning" />
    </div>
    <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <section style={cardStyle}>
        <Badge label="AI Research Playbook" tone="success" />
        <h2 style={{ margin: "10px 0 8px" }}>Aksi riset hari ini</h2>
        <div style={{ display: "grid", gap: 10 }}>{playbook.map((item, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start", padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}><Badge label={String(index + 1)} tone="blue" /><div style={{ color: colors.ink, lineHeight: 1.55 }}>{item}</div></div>)}</div>
      </section>
      <section style={cardStyle}>
        <Badge label="Kategori naik" tone="blue" />
        <h2 style={{ margin: "10px 0 8px" }}>Niche prioritas</h2>
        <div style={{ display: "grid", gap: 10 }}>{topCategories.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}><div><strong>{item.name}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.topKeywords.slice(0, 3).join(" · ")}</div></div><Badge label={`${Math.round(scoreCategory(item))}/100`} tone={scoreTone(scoreCategory(item))} /></div>)}</div>
      </section>
    </div>
    <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <section style={cardStyle}>
        <Badge label="Kreator affiliate" tone="success" />
        <h3>Prioritas outreach</h3>
        <div style={{ display: "grid", gap: 10 }}>{topCreators.map((item) => <div key={item.id} style={{ padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}><strong>{item.creatorName}</strong><div style={{ color: colors.muted, fontSize: 12 }}>{item.handle} · {count(item.followers)} followers · fit {Math.round(scoreCreator(item))}/100</div></div>)}</div>
      </section>
      <section style={cardStyle}>
        <Badge label="Status data" tone="neutral" />
        <h3>Provider aktif</h3>
        <div style={{ marginBottom: 10 }}><Badge label={`Sumber data: ${bundle.activeSource || "-"}`} tone={dataModeTone(bundle.dataMode)} /> <Badge label={bundle.isDemo ? "Mode demo lokal" : "Bukan data lokal"} tone={bundle.isDemo ? "warning" : "success"} /></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{bundle.providers.map((provider) => <Badge key={provider.id} label={`${provider.name}: ${provider.status}`} tone={providerTone(provider.status)} />)}</div>
        {bundle.errors.length ? <div style={{ marginTop: 10, display: "grid", gap: 6 }}>{bundle.errors.map((error, index) => <Badge key={index} label={error} tone="warning" />)}</div> : null}
        <p style={{ color: colors.muted, lineHeight: 1.65 }}>Jika mode Supabase aktif dan tabel sudah terisi, data akan berasal dari database. Data real-time marketplace tetap membutuhkan API resmi, partner feed, atau upload riset legal.</p>
      </section>
    </div>
  </div>;
}

export function MarketIntelligenceSuite({ products }: { products?: Product[] }) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("overview");
  const [period, setPeriod] = useState<MITrendPeriod>("week");
  const [marketplace, setMarketplace] = useState<QuickMarket>("All");
  const [country, setCountry] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<MISortKey>("opportunity");
  const [query, setQuery] = useState("");
  const [bundle, setBundle] = useState<ApiState>(EMPTY_BUNDLE);
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ period, marketplace, country, category, sort, q: query });
    setLoading(true);
fetch(`/api/market-intelligence?${params.toString()}`, {
  signal: controller.signal,
  cache: "no-store",
})
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Market Intelligence API error")))
      .then((payload: ApiState) => setBundle(payload))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setBundle({ ...EMPTY_BUNDLE, errors: ["API Market Intelligence belum tersedia atau gagal dibaca."], generatedAt: new Date().toISOString() });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [period, marketplace, country, category, sort, query]);

  const categories = useMemo(() => categoryOptions(bundle), [bundle]);
  const marketplaces = useMemo(() => marketplaceOptions(bundle), [bundle]);
  const countries = useMemo(() => countryOptions(bundle), [bundle]);
  const summary = useMemo(() => summarizeBundle(bundle), [bundle]);

  return <section style={{ display: "grid", gap: 14 }}>
    <style>{`
      @media (max-width: 900px) {
        .market-intel-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `}</style>
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 920 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge label="V5 Partner Feed + Supabase Live" tone="success" />
            <Badge label="Produk · Kategori · Toko · Kreator · Video & Ads · Live · Partner API" tone="blue" />
            {loading ? <Badge label="Memuat data..." tone="warning" /> : <Badge label={`Generated ${new Date(bundle.generatedAt).toLocaleTimeString("id-ID")}`} tone="neutral" />}
            <Badge label={`Source: ${bundle.activeSource || "-"}`} tone={dataModeTone(bundle.dataMode)} />
          </div>
          <h2 style={{ margin: "10px 0 6px", fontSize: 30, letterSpacing: -0.9 }}>Market Intelligence seperti Kalodata, versi Untungin</h2>
          <p style={{ margin: 0, color: colors.muted, lineHeight: 1.7 }}>Dashboard riset produk dengan ranking peluang, kategori naik, kompetitor, kreator affiliate, video/ads, live commerce, export CSV, dan partner feed/API legal-ready.</p>
        </div>
        <button onClick={() => exportProducts(bundle.products)} disabled={!bundle.products.length} style={{ ...ctaButtonStyle, opacity: bundle.products.length ? 1 : 0.55 }}>Export produk CSV</button>
      </div>

      <div className="market-intel-tabs" style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 8, marginTop: 18 }}>
        {TABS.map((tab) => <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ ...(activeTab === tab.key ? ctaButtonStyle : ghostButtonStyle), textAlign: "left", padding: 12 }}>
          <span style={{ display: "block" }}>{tab.label}</span>
          <small style={{ opacity: 0.76 }}>{tab.helper}</small>
        </button>)}
      </div>
    </section>

    <section style={cardStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          {MARKETPLACES.map((item) => <button key={item.key} onClick={() => setMarketplace(item.key)} style={{ ...(marketplace === item.key ? ctaButtonStyle : ghostButtonStyle), textAlign: "left", padding: 12 }}>
            <span style={{ display: "block" }}>{item.label}</span>
            <small style={{ opacity: 0.76 }}>{item.helper}</small>
          </button>)}
        </div>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr 0.7fr 0.8fr 0.8fr", gap: 10 }}>
          <select value={period} onChange={(event) => setPeriod(event.target.value as MITrendPeriod)} style={inputStyle}>{(Object.keys(PERIOD_LABEL) as MITrendPeriod[]).map((item) => <option key={item} value={item}>Periode: {PERIOD_LABEL[item]}</option>)}</select>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, toko, kreator, hook, keyword..." style={inputStyle} />
          <select value={country} onChange={(event) => setCountry(event.target.value)} style={inputStyle}>{countries.map((item) => <option key={item} value={item}>Negara: {item === "All" ? "Semua" : item}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} style={inputStyle}>{categories.map((item) => <option key={item} value={item}>Kategori: {item === "All" ? "Semua" : item}</option>)}</select>
          <select value={sort} onChange={(event) => setSort(event.target.value as MISortKey)} style={inputStyle}>{(Object.keys(SORT_LABEL) as MISortKey[]).map((item) => <option key={item} value={item}>Sort: {SORT_LABEL[item]}</option>)}</select>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {marketplaces.filter((item) => item !== "All").map((item) => <button key={item} onClick={() => setMarketplace(item as QuickMarket)} style={{ ...(marketplace === item ? ctaButtonStyle : ghostButtonStyle), padding: "7px 10px", fontSize: 12 }}>{item}</button>)}
        </div>
      </div>
    </section>

    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      <StatCard label="Produk terfilter" value={bundle.products.length} helper="Ranking siap dianalisis" tone="blue" />
      <StatCard label="Top product" value={summary.topProduct?.productName || "-"} helper={summary.topProduct ? `${summary.topProduct.marketplace} · ${Math.round(scoreProduct(summary.topProduct))}/100` : "-"} tone="success" />
      <StatCard label="Revenue 30d" value={compactMoney(summary.totalRevenue)} helper={bundle.isDemo ? "Demo intelligence" : "Live/feed intelligence"} tone="success" />
      <StatCard label="Low competition" value={summary.lowCompetition?.productName || "-"} helper={summary.lowCompetition ? `Kompetisi ${summary.lowCompetition.competitionScore}/100` : "Ubah filter untuk cari peluang"} tone={summary.lowCompetition ? "warning" : "neutral"} />
    </div>

    {activeTab === "overview" && <OverviewPanel bundle={bundle} products={products} />}
    {activeTab === "products" && <div style={{ display: "grid", gap: 12 }}>{bundle.products.length ? bundle.products.map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState title="Produk belum ditemukan" description="Ubah filter, marketplace, atau keyword pencarian." />}</div>}
    {activeTab === "categories" && (bundle.categories.length ? <CategoryTable rows={bundle.categories} /> : <EmptyState title="Kategori belum ditemukan" description="Ubah filter untuk melihat kategori lain." />)}
    {activeTab === "shops" && (bundle.shops.length ? <ShopTable rows={bundle.shops} products={bundle.products} /> : <EmptyState title="Toko belum ditemukan" description="Ubah filter untuk melihat kompetitor lain." />)}
    {activeTab === "creators" && (bundle.creators.length ? <CreatorTable rows={bundle.creators} products={bundle.products} /> : <EmptyState title="Kreator belum ditemukan" description="Ubah filter untuk melihat kreator affiliate lain." />)}
    {activeTab === "videos" && (bundle.videos.length ? <VideoTable rows={bundle.videos} products={bundle.products} /> : <EmptyState title="Video belum ditemukan" description="Ubah filter untuk melihat video/ads lain." />)}
    {activeTab === "lives" && (bundle.lives.length ? <LiveTable rows={bundle.lives} products={bundle.products} /> : <EmptyState title="Live belum ditemukan" description="Ubah filter untuk melihat live commerce lain." />)}
    {activeTab === "import" && <ImportPanel />}
  </section>;
}

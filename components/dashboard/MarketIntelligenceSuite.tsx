"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, Tone } from "@/types/dashboard";
import type { MIBundle, MICategory, MICreator, MILivestream, MIProduct, MIResearchSource, MIShop, MIVideoAd } from "@/lib/market-intelligence/types";
import { scoreProduct, summarizeBundle } from "@/lib/market-intelligence/scoring";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, colors, ctaButtonStyle, EmptyState, ghostButtonStyle, inputStyle, Progress } from "./ui";

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

const PERIOD_LABEL: Record<string, string> = {
  today: "Hari ini",
  week: "Minggu ini",
  month: "Bulan ini",
  special_day: "Hari besar",
};

const CSV_COLUMNS = [
  "module", "id", "name", "marketplace", "country", "category", "keyword",
  "price_min", "price_max", "sold_7d", "sold_30d", "revenue_7d", "revenue_30d",
  "growth_7d", "growth_30d", "seller_count", "creator_count", "video_count",
  "live_count", "ad_count", "rating", "review_count", "demand_score",
  "growth_score", "competition_score", "opportunity_score", "source",
  "source_url", "notes",
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

function signalTone(signal: string | undefined): Tone {
  if (signal === "viral" || signal === "rising") return "success";
  if (signal === "seasonal") return "warning";
  if (signal === "declining") return "danger";
  return "blue";
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
    "product", item.id, item.productName, item.marketplace, item.country, item.category, item.keyword,
    item.priceMin, item.priceMax, item.sold7d, item.sold30d, item.revenue7d, item.revenue30d,
    item.growth7d, item.growth30d, item.sellerCount, item.creatorCount, item.videoCount,
    item.liveCount, item.adCount, item.avgRating, item.reviewCount, item.demandScore,
    item.growthScore, item.competitionScore, Math.round(scoreProduct(item)), item.source,
    item.sourceUrl || "", item.notes || "",
  ].map(csvEscape).join(",");
}

function exportProducts(rows: MIProduct[]) {
  const lines = [CSV_COLUMNS.join(","), ...rows.map(productToCsv)];
  downloadText(`untungin-market-intelligence-products-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"));
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
  return (
    <div style={{ padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", minWidth: 0 }}>
      <div style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>{label}</div>
      <strong style={{ display: "block", marginTop: 4, fontSize: 18, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</strong>
      {helper ? <small style={{ color: colors.muted, display: "block", fontSize: 11, marginTop: 2 }}>{helper}</small> : null}
    </div>
  );
}

function ProductCard({ item }: { item: MIProduct }) {
  const score = scoreProduct(item);
  return (
    <div style={{ padding: 16, borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 10px 28px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontSize: 17 }}>{item.productName}</strong>
          <div style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>{item.marketplace} · {item.country} · {PERIOD_LABEL[item.period] || "Bulan ini"} · {item.category} · keyword: {item.keyword}</div>
        </div>
        <Badge label={`${Math.round(score)}/100`} tone={scoreTone(score)} />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
        <MiniMetric label="Sold 30d" value={count(item.sold30d)} helper={`7d ${count(item.sold7d)}`} tone="blue" />
        <MiniMetric label="Revenue 30d" value={compactMoney(item.revenue30d)} helper={`7d ${compactMoney(item.revenue7d)}`} tone="success" />
        <MiniMetric label="Growth" value={`${item.growth30d}%`} helper={`7d ${item.growth7d}%`} tone="warning" />
        <MiniMetric label="Harga" value={`${money(item.priceMin)}-${money(item.priceMax)}`} helper="range pasar" />
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 8 }}>
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
        <Badge label={item.signal || "stable"} tone={signalTone(item.signal)} />
        <Badge label={`Rating ${item.avgRating}/5 · ${count(item.reviewCount)} review`} tone="neutral" />
        <Badge label={`Saturasi ${item.saturationScore}/100`} tone={item.saturationScore >= 65 ? "warning" : "success"} />
        <Badge label={`Margin signal ${item.marginSignal}/100`} tone={item.marginSignal >= 70 ? "success" : "neutral"} />
      </div>
      <p style={{ color: colors.ink, lineHeight: 1.6, margin: "12px 0 0", fontSize: 13 }}>{recommendationForProduct(item)}</p>
      {item.notes ? <p style={{ color: colors.muted, lineHeight: 1.55, margin: "8px 0 0", fontSize: 12 }}>{item.notes}</p> : null}
    </div>
  );
}

interface MarketIntelligenceSuiteProps {
  onSearch: (keyword: string) => void;
  loading: boolean;
  marketData: any; 
  products?: Product[];
}

export function MarketIntelligenceSuite({ onSearch, loading, marketData, products }: MarketIntelligenceSuiteProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("products");
  const [selectedMarketplace, setSelectedMarketplace] = useState<QuickMarket>("All");
  const [keyword, setKeyword] = useState("");
  const [apiState, setApiState] = useState<ApiState>(EMPTY_BUNDLE);

  useEffect(() => {
    if (marketData) {
      const rawProducts = marketData.products || marketData.items || marketData.results || [];
      const rootKeyword = marketData.keyword || keyword || "-";

      const normalizedProducts = rawProducts.map((item: any, index: number): MIProduct => {
        return {
          id: item.id || `scraped-prod-${index}-${Date.now()}`,
          productName: item.productName || item.product_name || item.title || item.name || "Produk Tanpa Nama",
          marketplace: item.marketplace || "TikTok Shop",
          country: item.country || "ID",
          category: item.category || "General",
          keyword: rootKeyword,
          period: item.period || "month",
          
          priceMin: Number(item.priceMin || item.price_min || item.sellingPrice || item.selling_price || item.price || 0),
          priceMax: Number(item.priceMax || item.price_max || item.sellingPrice || item.selling_price || item.price || 0),
          
          sold7d: Number(item.sold7d || item.sold_7d || 0),
          sold30d: Number(item.sold30d || item.sold_30d || item.sales || item.sold || item.quantitySold || item.quantity_sold || 0),
          
          revenue7d: Number(item.revenue7d || item.revenue_7d || 0),
          revenue30d: Number(item.revenue30d || item.revenue_30d || item.revenue || 0),
          
          growth7d: Number(item.growth7d || item.growth_7d || 0),
          growth30d: Number(item.growth30d || item.growth_30d || 0),
          
          sellerCount: Number(item.sellerCount || item.seller_count || 1),
          creatorCount: Number(item.creatorCount || item.creator_count || 0),
          videoCount: Number(item.videoCount || item.video_count || 0),
          adCount: Number(item.adCount || item.ad_count || 0),
          liveCount: Number(item.liveCount || item.live_count || 0),
          
          avgRating: Number(item.avgRating || item.avg_rating || item.rating || 5),
          reviewCount: Number(item.reviewCount || item.review_count || 0),
          
          demandScore: Number(item.demandScore || item.demand_score || 75),
          growthScore: Number(item.growthScore || item.growth_score || 60),
          competitionScore: Number(item.competitionScore || item.competition_score || 35),
          saturationScore: Number(item.saturationScore || item.saturation_score || 25),
          marginSignal: Number(item.marginSignal || item.margin_signal || 80),
          
          signal: item.signal || "rising",
          source: item.source || "TikTok Scraper API",
          sourceUrl: item.sourceUrl || item.source_url || "",
          notes: item.notes || item.description || ""
        };
      });

      setApiState({
        products: normalizedProducts,
        categories: marketData.categories || [],
        shops: marketData.shops || [],
        creators: marketData.creators || [],
        videos: marketData.videos || [],
        lives: marketData.lives || [],
        sources: marketData.sources || [],
        providers: marketData.providers || [],
        errors: marketData.errors || [],
        generatedAt: marketData.generatedAt || new Date().toISOString(),
        dataMode: "mixed",
        activeSource: "TikTok Real-time API",
        isDemo: false,
        rowCount: normalizedProducts.length,
      });
    }
  }, [marketData]);

  const filteredProducts = useMemo(() => {
    let list = apiState.products || [];
    
    if (selectedMarketplace !== "All") {
      list = list.filter((p) => {
        const normalizedMarketProduct = (p.marketplace || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const normalizedSelectedMarket = selectedMarketplace.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        return normalizedMarketProduct === normalizedSelectedMarket || normalizedMarketProduct.includes(normalizedSelectedMarket);
      });
    }

    return list;
  }, [apiState.products, selectedMarketplace]);

  const handleSearchClick = () => {
    if (!keyword.trim()) return;
    onSearch(keyword);
  };

  return (
    <div style={{ display: "grid", gap: 24, padding: "24px 0" }}>
      <div style={cardStyle}>
        <Badge label="Market Intelligence Search" tone="blue" />
        <h2 style={{ margin: "10px 0 6px" }}>Pantau produk kompetitor terlaris dan analisis tren omzet pasar secara real-time.</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Ketik keyword riset market (contoh: BAJU RENANG, MUKENA, dll)"
          />
          <button style={ctaButtonStyle} onClick={handleSearchClick} disabled={loading}>
            {loading ? "Mencari data..." : "Riset Pasar"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MARKETPLACES.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMarketplace(m.key)}
            style={selectedMarketplace === m.key ? ctaButtonStyle : ghostButtonStyle}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 8, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === t.key ? "#f1f5f9" : "transparent",
              fontWeight: activeTab === t.key ? "bold" : "normal",
              color: activeTab === t.key ? colors.brand : colors.muted,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Produk Kompetitor Terlaris untuk "{marketData?.keyword || keyword || "Semua"}"</h3>
            <button style={ghostButtonStyle} onClick={() => exportProducts(filteredProducts)}>Export CSV</button>
          </div>
          {loading ? (
            <EmptyState title="Sedang memproses" description="Menghubungkan ke API pemantau dan menyusun data pasar terbaru..." />
          ) : filteredProducts.length > 0 ? (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} item={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Data kosong" description="Belum ada data untuk keyword ini. Silakan ketik kata kunci di atas lalu klik Riset Pasar." />
          )}
        </div>
      )}

      {activeTab === "overview" && <OverviewPanel bundle={apiState} products={products} />}
      {activeTab === "categories" && <CategoryTable rows={apiState.categories || []} />}
      {activeTab === "shops" && <ShopTable rows={apiState.shops || []} />}
      {activeTab === "creators" && <CreatorTable rows={apiState.creators || []} />}
      {activeTab === "videos" && <VideoTable rows={apiState.videos || []} />}
      {activeTab === "lives" && <LiveTable rows={apiState.lives || []} />}
      {activeTab === "import" && <ImportPanel />}
    </div>
  );
}

function OverviewPanel({ bundle }: { bundle: MIBundle; products?: Product[] }) {
  const playbook = buildPlaybook(bundle);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section style={cardStyle}>
        <h3>AI Market Playbook</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {playbook.map((p, idx) => <li key={idx}>{p}</li>)}
        </ul>
      </section>
    </div>
  );
}

function CategoryTable({ rows }: { rows: MICategory[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState title="Kategori Kosong" description="Belum ada rekaman ceruk data pasar terlampir." />
      ) : (
        rows.map((item) => (
          <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
            <strong>{item.name}</strong>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
              <MiniMetric label="Produk" value={count(item.productCount)} />
              <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
              <MiniMetric label="Revenue 30d" value={compactMoney(item.revenue30d)} />
              <MiniMetric label="Kompetisi" value={`${item.competitionScore}/100`} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ShopTable({ rows }: { rows: MIShop[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState title="Toko Kosong" description="Tidak ada profil penjual kompetitor terdeteksi saat ini." />
      ) : (
        rows.map((item) => (
          <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
            <strong>{item.shopName}</strong>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
              <MiniMetric label="SKU" value={count(item.productCount)} />
              <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
              <MiniMetric label="Revenue" value={compactMoney(item.revenue30d)} />
              <MiniMetric label="Follower" value={count(item.followers)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CreatorTable({ rows }: { rows: MICreator[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState title="Kreator Kosong" description="Data afiliasi ataupun talenta video kreatif belum dikaitkan." />
      ) : (
        rows.map((item) => (
          <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
            <strong>{item.creatorName}</strong>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
              <MiniMetric label="Follower" value={count(item.followers)} />
              <MiniMetric label="Avg views" value={count(item.avgViews)} />
              <MiniMetric label="Engagement" value={percent(item.engagementRate)} />
              <MiniMetric label="Sold 30d" value={count(item.sold30d)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function VideoTable({ rows }: { rows: MIVideoAd[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState title="Iklan Video Kosong" description="Belum ada pancingan (hook) matriks performa iklan tersaring." />
      ) : (
        rows.map((item) => (
          <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
            <strong>{item.title}</strong>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
              <MiniMetric label="Views" value={count(item.views)} />
              <MiniMetric label="Likes" value={count(item.likes)} />
              <MiniMetric label="CTR" value={`${item.ctr}%`} />
              <MiniMetric label="GMV est." value={compactMoney(item.gmvEstimate)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LiveTable({ rows }: { rows: MILivestream[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState title="Sesi Sederhana Live Commerce Nihil" description="Aktivitas pantauan promosi siaran langsung kosong." />
      ) : (
        rows.map((item) => (
          <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0" }}>
            <strong>{item.title}</strong>
            <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
              <MiniMetric label="Peak viewers" value={count(item.viewersPeak)} />
              <MiniMetric label="Durasi" value={`${item.durationMin}m`} />
              <MiniMetric label="Sold" value={count(item.soldUnits)} />
              <MiniMetric label="Revenue" value={compactMoney(item.revenue)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ImportPanel() {
  return (
    <div style={cardStyle}>
      <h3>Partner Feed Management & CSV Utility</h3>
      <p style={{ color: colors.muted, marginBottom: 12 }}>Gunakan panel ini untuk mengunggah CSV manual jika API sedang maintenance.</p>
      <button style={ghostButtonStyle} onClick={exportTemplate}>Unduh Format Template Inteligensi (.CSV)</button>
    </div>
  );
}

function exportTemplate() {
  const example = [
    CSV_COLUMNS.join(","),
    ["product", "manual-001", "Nama produk contoh", "TikTok Shop", "ID", "Beauty", "keyword produk", "15000", "49000", "120", "800", "3000000", "21000000", "15", "42", "18", "12", "40", "6", "3", "4.7", "120", "80", "76", "44", "78", "Manual research", "", "Catatan riset"].map(csvEscape).join(","),
  ];
  downloadText("template-untungin-market-intelligence-v2.csv", example.join("\n"));
}
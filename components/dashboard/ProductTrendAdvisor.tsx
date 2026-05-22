"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, Tone } from "@/types/dashboard";
import { FALLBACK_MARKET_TRENDS } from "@/lib/trends/catalog";
import { filterTrends, scoreTrend } from "@/lib/trends/scoring";
import type { MarketTrend, TrendPeriod, TrendProviderStatus } from "@/lib/trends/types";
import { compactMoney, money } from "@/lib/dashboard/format";
import { useDashboardLocale, type Locale } from "@/lib/dashboard/i18n";
import { Badge, cardStyle, ctaButtonStyle, EmptyState, ghostButtonStyle, Progress, StatCard } from "./ui";

type MarketQuestion = "hot" | "category" | "marketplace" | "lowCompetition" | "pricing" | "today";

type QuickMarket = "All" | "Shopee" | "TikTok Shop" | "Tokopedia";

type TrendApiResponse = {
  items: MarketTrend[];
  providers: TrendProviderStatus[];
  errors: string[];
  generatedAt: string;
};

const DEFAULT_PROVIDERS: TrendProviderStatus[] = [
  { id: "reviewer-demo", name: "Demo reviewer aktif", kind: "fallback_seed", enabled: true, status: "fallback", message: "Data sampel Shopee, TikTok Shop, dan Tokopedia siap diuji untuk riset produk." },
];

const COPY: Record<Locale, {
  badge: string;
  title: string;
  subtitle: string;
  search: string;
  all: string;
  country: string;
  category: string;
  marketplace: string;
  period: string;
  periods: Record<TrendPeriod, string>;
  sources: string;
  confidence: string;
  lastUpdated: string;
  questions: Record<MarketQuestion, string>;
  answerTitle: string;
  topTrend: string;
  bestNiche: string;
  strongestMarketplace: string;
  lowCompetition: string;
  demand: string;
  growth: string;
  competition: string;
  priceRange: string;
  monthlyUnits: string;
  monthlyRevenue: string;
  source: string;
  recommendation: string;
  emptyTitle: string;
  emptyDesc: string;
  dataNote: string;
  providerNote: string;
  reviewerBadge: string;
  reviewerNote: string;
}> = {
  id: {
    badge: "Tren Pasar Multi-source",
    title: "Baca tren produk harian, mingguan, bulanan, dan hari besar",
    subtitle: "Untuk seller Shopee, TikTok Shop, dan Tokopedia: baca tren produk harian, mingguan, bulanan, dan hari besar. Gunakan filter marketplace untuk fokus ke Shopee atau TikTok, lalu pilih produk yang demand tinggi dan kompetisi rendah.",
    search: "Cari produk, keyword, kategori...",
    all: "Semua",
    country: "Negara",
    category: "Kategori",
    marketplace: "Marketplace",
    period: "Periode",
    periods: { today: "Hari ini", week: "Minggu ini", month: "Bulan ini", special_day: "Hari besar" },
    sources: "Sumber data",
    confidence: "Keyakinan",
    lastUpdated: "Update",
    questions: {
      hot: "Produk apa yang sedang tren?",
      category: "Kategori mana yang naik?",
      marketplace: "Marketplace mana paling ramai?",
      lowCompetition: "Produk tren tapi kompetisi rendah?",
      pricing: "Rentang harga aman?",
      today: "Aksi riset hari ini?",
    },
    answerTitle: "Jawaban tren pasar",
    topTrend: "Tren terkuat",
    bestNiche: "Niche terbaik",
    strongestMarketplace: "Marketplace terkuat",
    lowCompetition: "Peluang kompetisi rendah",
    demand: "Demand",
    growth: "Growth",
    competition: "Kompetisi",
    priceRange: "Rentang harga",
    monthlyUnits: "Estimasi unit/bulan",
    monthlyRevenue: "Estimasi omzet/bulan",
    source: "Sumber sinyal",
    recommendation: "Rekomendasi",
    emptyTitle: "Belum ada hasil tren",
    emptyDesc: "Ubah filter, periode, atau keyword pencarian.",
    dataNote: "Mode demo reviewer aktif: data contoh disiapkan untuk evaluasi alur dashboard, analisis tren produk, profit, dan workflow integrasi marketplace.",
    providerNote: "Status demo",
    reviewerBadge: "Demo reviewer aktif",
    reviewerNote: "Data sampel Shopee, TikTok Shop, dan Tokopedia siap diuji untuk riset produk.",
  },
  en: {
    badge: "Multi-source Market Trends",
    title: "Read daily, weekly, monthly, and special-day product trends",
    subtitle: "For Shopee, TikTok Shop, and Tokopedia sellers: read daily, weekly, monthly, and special-day product trends. Use the marketplace filter to focus on Shopee or TikTok, then choose products with high demand and lower competition.",
    search: "Search product, keyword, category...",
    all: "All",
    country: "Country",
    category: "Category",
    marketplace: "Marketplace",
    period: "Period",
    periods: { today: "Today", week: "This week", month: "This month", special_day: "Special days" },
    sources: "Data sources",
    confidence: "Confidence",
    lastUpdated: "Updated",
    questions: {
      hot: "What products are trending?",
      category: "Which category is rising?",
      marketplace: "Which marketplace is hottest?",
      lowCompetition: "Trending but low competition?",
      pricing: "Safe price range?",
      today: "Research actions today?",
    },
    answerTitle: "Market trend answer",
    topTrend: "Top trend",
    bestNiche: "Best niche",
    strongestMarketplace: "Strongest marketplace",
    lowCompetition: "Low competition opportunity",
    demand: "Demand",
    growth: "Growth",
    competition: "Competition",
    priceRange: "Price range",
    monthlyUnits: "Est. units/month",
    monthlyRevenue: "Est. revenue/month",
    source: "Signal source",
    recommendation: "Recommendation",
    emptyTitle: "No trend result",
    emptyDesc: "Change filters, period, or search keyword.",
    dataNote: "Reviewer demo mode is active: sample data is prepared to evaluate the dashboard flow, product trend analysis, profit features, and marketplace integration workflow.",
    providerNote: "Demo status",
    reviewerBadge: "Reviewer demo active",
    reviewerNote: "Shopee, TikTok Shop, and Tokopedia sample data is ready for product research testing.",
  },
  ms: {
    badge: "Tren Pasaran Multi-source",
    title: "Baca tren produk harian, mingguan, bulanan, dan hari besar",
    subtitle: "Untuk seller Shopee, TikTok Shop, dan Tokopedia: baca tren produk harian, mingguan, bulanan, dan hari besar. Gunakan filter marketplace untuk fokus ke Shopee atau TikTok, lalu pilih produk dengan demand tinggi dan persaingan rendah.",
    search: "Cari produk, keyword, kategori...",
    all: "Semua",
    country: "Negara",
    category: "Kategori",
    marketplace: "Marketplace",
    period: "Tempoh",
    periods: { today: "Hari ini", week: "Minggu ini", month: "Bulan ini", special_day: "Hari besar" },
    sources: "Sumber data",
    confidence: "Keyakinan",
    lastUpdated: "Update",
    questions: {
      hot: "Produk apa sedang tren?",
      category: "Kategori mana sedang naik?",
      marketplace: "Marketplace mana paling ramai?",
      lowCompetition: "Tren tapi persaingan rendah?",
      pricing: "Julat harga selamat?",
      today: "Aksi riset hari ini?",
    },
    answerTitle: "Jawapan tren pasaran",
    topTrend: "Tren terkuat",
    bestNiche: "Niche terbaik",
    strongestMarketplace: "Marketplace terkuat",
    lowCompetition: "Peluang persaingan rendah",
    demand: "Demand",
    growth: "Growth",
    competition: "Persaingan",
    priceRange: "Julat harga",
    monthlyUnits: "Anggaran unit/bulan",
    monthlyRevenue: "Anggaran revenue/bulan",
    source: "Sumber isyarat",
    recommendation: "Cadangan",
    emptyTitle: "Belum ada hasil tren",
    emptyDesc: "Ubah filter, tempoh, atau keyword carian.",
    dataNote: "Mode demo reviewer aktif: data sampel disiapkan untuk menilai alur dashboard, analisis tren produk, profit, dan workflow integrasi marketplace.",
    providerNote: "Status demo",
    reviewerBadge: "Demo reviewer aktif",
    reviewerNote: "Data sampel Shopee, TikTok Shop, dan Tokopedia siap diuji untuk riset produk.",
  },
};

function toneFor(item: MarketTrend): Tone {
  const score = scoreTrend(item);
  if (score >= 78) return "success";
  if (score >= 62) return "blue";
  if (item.competitionScore > 80) return "warning";
  return "neutral";
}

function signalLabel(item: MarketTrend, locale: Locale) {
  const id = { viral: "Viral", rising: "Naik", stable: "Stabil", seasonal: "Musiman" } as const;
  const en = { viral: "Viral", rising: "Rising", stable: "Stable", seasonal: "Seasonal" } as const;
  const ms = { viral: "Viral", rising: "Naik", stable: "Stabil", seasonal: "Bermusim" } as const;
  return (locale === "en" ? en : locale === "ms" ? ms : id)[item.signal];
}

function providerTone(status: TrendProviderStatus["status"]): Tone {
  if (status === "ready") return "success";
  if (status === "fallback") return "blue";
  if (status === "not_approved") return "warning";
  if (status === "error") return "danger";
  return "neutral";
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function summarizePeriods(rows: MarketTrend[], labels: Record<TrendPeriod, string>) {
  const order: TrendPeriod[] = ["today", "week", "month", "special_day"];
  return order
    .map((period) => ({ period, count: rows.filter((item) => item.period === period).length }))
    .filter((item) => item.count > 0)
    .map((item) => `${labels[item.period]}: ${item.count}`)
    .join(" · ");
}

function buildAnswer(question: MarketQuestion, rows: MarketTrend[], c: typeof COPY[Locale], locale: Locale) {
  if (!rows.length) return c.emptyDesc;
  const top = [...rows].sort((a, b) => scoreTrend(b) - scoreTrend(a))[0];
  const lowCompetition = [...rows].filter((item) => item.demandScore >= 65 && item.competitionScore <= 45).sort((a, b) => scoreTrend(b) - scoreTrend(a))[0];
  const categoryScores = Array.from(rows.reduce((map, item) => {
    const current = map.get(item.category) || { category: item.category, demand: 0, growth: 0, count: 0, revenue: 0 };
    current.demand += item.demandScore;
    current.growth += item.growthScore;
    current.revenue += item.monthlyRevenue;
    current.count += 1;
    map.set(item.category, current);
    return map;
  }, new Map<string, { category: string; demand: number; growth: number; count: number; revenue: number }>()).values()).sort((a, b) => (b.demand + b.growth) / b.count - (a.demand + a.growth) / a.count);
  const marketplaceScores = Array.from(rows.reduce((map, item) => {
    const current = map.get(item.marketplace) || { marketplace: item.marketplace, units: 0, revenue: 0, count: 0, score: 0 };
    current.units += item.monthlyUnits;
    current.revenue += item.monthlyRevenue;
    current.score += scoreTrend(item);
    current.count += 1;
    map.set(item.marketplace, current);
    return map;
  }, new Map<string, { marketplace: string; units: number; revenue: number; count: number; score: number }>()).values()).sort((a, b) => b.score / b.count - a.score / a.count);

  const listTop = rows.slice(0, 5).map((item, index) => `${index + 1}. ${item.productName} - ${item.marketplace} · ${c.demand} ${item.demandScore}/100 · ${c.growth} ${item.growthScore}/100 · ${c.priceRange} ${money(item.priceMin, locale)}-${money(item.priceMax, locale)}`).join("\n");

  if (question === "category") {
    const best = categoryScores[0];
    return `${c.bestNiche}: ${best.category}. ${c.recommendation}: buat shortlist 5-10 SKU di kategori ini, cek harga kompetitor, ulasan buruk, dan gap bundling.\n${categoryScores.slice(0, 5).map((item, index) => `${index + 1}. ${item.category}: avg score ${Math.round((item.demand + item.growth) / item.count / 2)}/100, ${compactMoney(item.revenue, locale)}`).join("\n")}`;
  }
  if (question === "marketplace") {
    const best = marketplaceScores[0];
    return `${c.strongestMarketplace}: ${best.marketplace}. ${c.recommendation}: mulai validasi produk trending di channel ini dulu karena sinyal unit dan omzet paling kuat.\n${marketplaceScores.slice(0, 4).map((item, index) => `${index + 1}. ${item.marketplace}: ${item.units.toLocaleString()} unit, ${compactMoney(item.revenue, locale)}`).join("\n")}`;
  }
  if (question === "lowCompetition") {
    return lowCompetition ? `${c.lowCompetition}: ${lowCompetition.productName} (${lowCompetition.marketplace}). ${c.recommendation}: ini menarik karena demand ${lowCompetition.demandScore}/100, growth ${lowCompetition.growthScore}/100, kompetisi hanya ${lowCompetition.competitionScore}/100. Validasi supplier, berat paket, margin, dan 20 listing kompetitor dulu.` : `${c.lowCompetition}: belum ada peluang kompetisi rendah di filter ini. Turunkan threshold kategori atau cek marketplace lain.`;
  }
  if (question === "pricing") {
    return `${c.priceRange}: untuk tren teratas ${top.productName}, harga pasar berada di ${money(top.priceMin, locale)}-${money(top.priceMax, locale)}. ${c.recommendation}: masuk di tengah rentang harga, bukan paling murah, lalu bedakan lewat bundling, foto, garansi, atau bonus kecil.`;
  }
  if (question === "today") {
    return `1. Ambil 3 produk teratas dari daftar tren periode aktif.\n2. Cek minimal 20 listing kompetitor per produk.\n3. Validasi supplier dan hitung margin setelah fee/voucher/ongkir.\n4. Uji 1 SKU kecil dulu sebelum stok besar.\n5. Prioritaskan produk dengan demand tinggi dan kompetisi di bawah 60/100.`;
  }
  return `${c.topTrend}: ${top.productName} di ${top.marketplace}. ${c.recommendation}: riset kompetitor dan validasi margin sebelum masuk stok.\n${listTop}`;
}

export function ProductTrendAdvisor({ products }: { products?: Product[] }) {
  void products;
  const locale = useDashboardLocale();
  const c = COPY[locale];
  const [question, setQuestion] = useState<MarketQuestion>("hot");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All");
  const [marketplace, setMarketplace] = useState<QuickMarket | string>("All");
  const [category, setCategory] = useState("All");
  const [period, setPeriod] = useState<TrendPeriod>("week");
  const [apiRows, setApiRows] = useState<MarketTrend[] | null>(null);
  const [providers, setProviders] = useState<TrendProviderStatus[]>(DEFAULT_PROVIDERS);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ period, country, marketplace, category, q: query });
    fetch(`/api/marketplace/trends?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Trend API error")))
      .then((payload: TrendApiResponse) => {
        setApiRows(payload.items || []);
        setProviders(payload.providers?.length ? payload.providers : DEFAULT_PROVIDERS);
        setErrors(payload.errors || []);
        setGeneratedAt(payload.generatedAt || "");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setApiRows(null);
          setErrors(["Trend API belum tersedia, memakai fallback lokal."]);
        }
      });
    return () => controller.abort();
  }, [period, country, marketplace, category, query]);

  const sourceRows = apiRows || FALLBACK_MARKET_TRENDS;
  const countries = useMemo(() => ["All", ...unique(sourceRows.map((item) => item.country))], [sourceRows]);
  const marketplaces = useMemo(() => ["All", ...unique(sourceRows.map((item) => item.marketplace))], [sourceRows]);
  const categories = useMemo(() => ["All", ...unique(sourceRows.map((item) => item.category))], [sourceRows]);

  const rows = useMemo(() => filterTrends(sourceRows, { period, country, marketplace, category, q: query }), [sourceRows, query, country, marketplace, category, period]);
  const answer = useMemo(() => buildAnswer(question, rows, c, locale), [question, rows, c, locale]);
  const top = rows[0];
  const lowCompetition = rows.find((item) => item.demandScore >= 65 && item.competitionScore <= 45);
  const strongestMarketplace = rows.reduce((best, item) => {
    const currentScore = rows.filter((row) => row.marketplace === item.marketplace).reduce((sum, row) => sum + scoreTrend(row), 0);
    const bestScore = best ? rows.filter((row) => row.marketplace === best).reduce((sum, row) => sum + scoreTrend(row), 0) : -1;
    return currentScore > bestScore ? item.marketplace : best;
  }, "" as string);
  void providers;
  void errors;
  void generatedAt;

  const quickMarkets: QuickMarket[] = ["All", "Shopee", "TikTok Shop", "Tokopedia"];

  return <section style={cardStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ maxWidth: 840 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge label={c.badge} tone="blue" />
          <Badge label={c.reviewerBadge} tone="success" />
        </div>
        <h2 style={{ margin: "10px 0 6px", fontSize: 28, letterSpacing: -0.8 }}>{c.title}</h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>{c.subtitle}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(c.questions) as MarketQuestion[]).map((key) => <button key={key} onClick={() => setQuestion(key)} style={{ ...(question === key ? ctaButtonStyle : ghostButtonStyle), fontSize: 12, padding: "9px 11px" }}>{c.questions[key]}</button>)}
      </div>
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
      <span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>Fokus marketplace:</span>
      {quickMarkets.map((item) => <button key={item} onClick={() => setMarketplace(item)} style={{ ...(marketplace === item ? ctaButtonStyle : ghostButtonStyle), fontSize: 12, padding: "9px 12px" }}>{item === "All" ? "Semua marketplace" : item}</button>)}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.3fr 0.7fr 0.8fr 0.8fr", gap: 10, marginTop: 12 }} className="main-grid">
      <select value={period} onChange={(event) => setPeriod(event.target.value as TrendPeriod)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}>
        {(Object.keys(c.periods) as TrendPeriod[]).map((item) => <option key={item} value={item}>{c.period}: {c.periods[item]}</option>)}
      </select>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 700 }} />
      <select value={country} onChange={(event) => setCountry(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.country}: {c.all}</option>{countries.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{c.country}: {item}</option>)}</select>
      <select value={marketplace} onChange={(event) => setMarketplace(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.marketplace}: {c.all}</option>{marketplaces.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.category}: {c.all}</option>{categories.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}</select>
    </div>

    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 18 }}>
      <StatCard label={c.topTrend} value={top?.productName || "-"} helper={top ? `${top.marketplace} · ${signalLabel(top, locale)} · ${c.demand} ${top.demandScore}/100` : "-"} tone="blue" />
      <StatCard label={c.strongestMarketplace} value={strongestMarketplace || "-"} helper={rows.length ? `${rows.length} trend signals` : "-"} tone="success" />
      <StatCard label={c.lowCompetition} value={lowCompetition?.productName || "-"} helper={lowCompetition ? `${c.competition} ${lowCompetition.competitionScore}/100` : c.emptyDesc} tone={lowCompetition ? "success" : "warning"} />
      <StatCard label={c.sources} value={c.reviewerBadge} helper={summarizePeriods(sourceRows, c.periods) || c.reviewerNote} tone="success" />
    </div>

    <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", fontSize: 13, lineHeight: 1.6 }}>
      <b>Catatan seller:</b> kamu bisa riset produk untuk Shopee juga. Pilih tombol <b>Shopee</b> untuk melihat daftar produk tren khusus Shopee, atau pilih <b>TikTok Shop</b> untuk tren TikTok. Data live resmi akan aktif setelah akun/API marketplace disetujui; selama itu dashboard memakai data contoh + feed eksternal jika ENV disambungkan.
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
      <Badge label={c.reviewerBadge} tone="success" />
      <Badge label={c.reviewerNote} tone="blue" />
    </div>

    <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 14, marginTop: 16 }}>
      <div style={{ padding: 16, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <Badge label={c.answerTitle} tone="success" />
        <pre style={{ whiteSpace: "pre-wrap", margin: "12px 0 0", lineHeight: 1.7, color: "#334155", fontFamily: "inherit" }}>{answer}</pre>
        <p style={{ margin: "14px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>{c.dataNote}</p>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {!rows.length && <EmptyState title={c.emptyTitle} description={c.emptyDesc} />}
        {rows.slice(0, 8).map((item) => {
          const trendScore = scoreTrend(item);
          const tone = toneFor(item);
          return <div key={item.id} style={{ padding: 14, borderRadius: 18, background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <strong>{item.productName}</strong>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{item.marketplace} · {item.country} · {c.periods[item.period]} · {item.category} · keyword: {item.keyword}</div>
              </div>
              <Badge label={`${signalLabel(item, locale)} ${Math.round(trendScore)}/100`} tone={tone} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 12, fontSize: 12, color: "#64748b" }} className="metrics-grid">
              <span>{c.demand}: <b>{item.demandScore}/100</b></span>
              <span>{c.growth}: <b>{item.growthScore}/100</b></span>
              <span>{c.competition}: <b>{item.competitionScore}/100</b></span>
              <span>{c.confidence}: <b>{item.confidence}/100</b></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, fontSize: 12, color: "#64748b" }}>
              <span>{c.priceRange}: <b>{money(item.priceMin, locale)}-{money(item.priceMax, locale)}</b></span>
              <span>{c.monthlyUnits}: <b>{item.monthlyUnits.toLocaleString()}</b></span>
              <span>{c.monthlyRevenue}: <b>{compactMoney(item.monthlyRevenue, locale)}</b></span>
              <span>{c.lastUpdated}: <b>{new Date(item.lastUpdated).toLocaleDateString()}</b></span>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={trendScore} /></div>
            <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12 }}>{c.source}: {item.source}</p>
          </div>;
        })}
      </div>
    </div>
  </section>;
}

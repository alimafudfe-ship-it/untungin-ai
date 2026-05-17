"use client";

import { useMemo, useState } from "react";
import type { Product, Tone } from "@/types/dashboard";
import { compactMoney, money } from "@/lib/dashboard/format";
import { useDashboardLocale, type Locale } from "@/lib/dashboard/i18n";
import { Badge, cardStyle, ctaButtonStyle, EmptyState, ghostButtonStyle, Progress, StatCard } from "./ui";

type MarketQuestion = "hot" | "category" | "marketplace" | "lowCompetition" | "pricing" | "today";
type MarketTrend = {
  id: string;
  productName: string;
  category: string;
  keyword: string;
  marketplace: "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada";
  country: "ID" | "MY" | "SG";
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  priceMin: number;
  priceMax: number;
  monthlyUnits: number;
  monthlyRevenue: number;
  signal: "viral" | "rising" | "stable" | "seasonal";
  source: string;
};

const MARKET_TRENDS: MarketTrend[] = [
  { id: "mt-1", productName: "Serum brightening niacinamide", category: "Beauty", keyword: "serum brightening", marketplace: "Shopee", country: "ID", demandScore: 92, growthScore: 88, competitionScore: 74, priceMin: 28000, priceMax: 79000, monthlyUnits: 18400, monthlyRevenue: 912000000, signal: "viral", source: "Marketplace search & order signal" },
  { id: "mt-2", productName: "Sunscreen SPF ringan", category: "Beauty", keyword: "sunscreen spf", marketplace: "TikTok Shop", country: "ID", demandScore: 90, growthScore: 86, competitionScore: 69, priceMin: 35000, priceMax: 99000, monthlyUnits: 15100, monthlyRevenue: 1087000000, signal: "rising", source: "Live commerce trend" },
  { id: "mt-3", productName: "Botol minum anak anti bocor", category: "Mom & Baby", keyword: "botol minum anak", marketplace: "Tokopedia", country: "ID", demandScore: 81, growthScore: 65, competitionScore: 44, priceMin: 24000, priceMax: 69000, monthlyUnits: 9600, monthlyRevenue: 392000000, signal: "stable", source: "Search demand" },
  { id: "mt-4", productName: "Organizer kabel meja kerja", category: "Home Office", keyword: "cable organizer", marketplace: "Shopee", country: "ID", demandScore: 76, growthScore: 72, competitionScore: 38, priceMin: 9000, priceMax: 39000, monthlyUnits: 12300, monthlyRevenue: 221000000, signal: "rising", source: "Low competition signal" },
  { id: "mt-5", productName: "Lampu tidur LED aesthetic", category: "Home Living", keyword: "lampu tidur aesthetic", marketplace: "TikTok Shop", country: "ID", demandScore: 84, growthScore: 91, competitionScore: 58, priceMin: 25000, priceMax: 85000, monthlyUnits: 13700, monthlyRevenue: 615000000, signal: "viral", source: "Short video trend" },
  { id: "mt-6", productName: "Tas selempang wanita mini", category: "Fashion", keyword: "tas selempang mini", marketplace: "Shopee", country: "ID", demandScore: 79, growthScore: 63, competitionScore: 82, priceMin: 39000, priceMax: 149000, monthlyUnits: 21400, monthlyRevenue: 1819000000, signal: "stable", source: "Category ranking" },
  { id: "mt-7", productName: "Hampers kopi lokal", category: "F&B", keyword: "hampers kopi", marketplace: "Tokopedia", country: "ID", demandScore: 72, growthScore: 77, competitionScore: 41, priceMin: 65000, priceMax: 189000, monthlyUnits: 4100, monthlyRevenue: 486000000, signal: "seasonal", source: "Seasonal demand" },
  { id: "mt-8", productName: "Car phone holder magnetic", category: "Automotive", keyword: "phone holder mobil", marketplace: "Lazada", country: "ID", demandScore: 69, growthScore: 61, competitionScore: 35, priceMin: 18000, priceMax: 79000, monthlyUnits: 7200, monthlyRevenue: 268000000, signal: "rising", source: "Accessory search" },
  { id: "mt-9", productName: "Instant shawl ironless", category: "Fashion", keyword: "instant shawl", marketplace: "Shopee", country: "MY", demandScore: 88, growthScore: 84, competitionScore: 64, priceMin: 32000, priceMax: 118000, monthlyUnits: 14900, monthlyRevenue: 1220000000, signal: "rising", source: "Regional category trend" },
  { id: "mt-10", productName: "Bento lunch box kids", category: "Mom & Baby", keyword: "bento lunch box", marketplace: "Lazada", country: "MY", demandScore: 74, growthScore: 69, competitionScore: 36, priceMin: 26000, priceMax: 89000, monthlyUnits: 6500, monthlyRevenue: 361000000, signal: "stable", source: "Back-to-school demand" },
  { id: "mt-11", productName: "Portable blender USB", category: "Kitchen", keyword: "portable blender", marketplace: "TikTok Shop", country: "MY", demandScore: 80, growthScore: 83, competitionScore: 51, priceMin: 62000, priceMax: 169000, monthlyUnits: 5300, monthlyRevenue: 629000000, signal: "rising", source: "Video product discovery" },
  { id: "mt-12", productName: "Minimalist desk mat", category: "Home Office", keyword: "desk mat", marketplace: "Shopee", country: "SG", demandScore: 71, growthScore: 68, competitionScore: 29, priceMin: 45000, priceMax: 159000, monthlyUnits: 3900, monthlyRevenue: 392000000, signal: "rising", source: "Low saturation signal" },
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
}> = {
  id: {
    badge: "Tren Pasar Marketplace",
    title: "Cari tren semua produk di marketplace",
    subtitle: "Bukan produk internal. Modul ini membaca sinyal pasar umum dari marketplace: demand, pertumbuhan, kompetisi, kategori, keyword, estimasi unit, dan rentang harga. Dataset bisa diganti nanti dengan API Shopee/Tokopedia/TikTok Shop, Google Trends, atau hasil scraping legal.",
    search: "Cari produk, keyword, kategori...",
    all: "Semua",
    country: "Negara",
    category: "Kategori",
    marketplace: "Marketplace",
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
    emptyDesc: "Ubah filter atau keyword pencarian.",
    dataNote: "Catatan: data ini adalah market intelligence layer. Untuk real-time public trend, hubungkan API/collector marketplace atau upload dataset tren publik.",
  },
  en: {
    badge: "Marketplace Market Trends",
    title: "Explore trends across all marketplace products",
    subtitle: "Not internal products. This module reads general marketplace signals: demand, growth, competition, category, keyword, estimated units, and price range. The dataset can later be replaced with Shopee/Tokopedia/TikTok Shop APIs, Google Trends, or compliant trend collectors.",
    search: "Search product, keyword, category...",
    all: "All",
    country: "Country",
    category: "Category",
    marketplace: "Marketplace",
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
    emptyDesc: "Change filters or search keyword.",
    dataNote: "Note: this is a market intelligence layer. For real-time public trends, connect a marketplace API/collector or upload public trend datasets.",
  },
  ms: {
    badge: "Tren Pasaran Marketplace",
    title: "Cari tren semua produk di marketplace",
    subtitle: "Bukan produk internal. Modul ini membaca isyarat pasaran umum dari marketplace: demand, pertumbuhan, persaingan, kategori, keyword, anggaran unit, dan julat harga. Dataset boleh diganti nanti dengan API Shopee/Tokopedia/TikTok Shop, Google Trends, atau collector trend yang patuh aturan.",
    search: "Cari produk, keyword, kategori...",
    all: "Semua",
    country: "Negara",
    category: "Kategori",
    marketplace: "Marketplace",
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
    emptyDesc: "Ubah filter atau keyword carian.",
    dataNote: "Nota: ini ialah market intelligence layer. Untuk public trend real-time, sambungkan API/collector marketplace atau upload dataset tren publik.",
  },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function scoreTrend(item: MarketTrend) {
  const competitionPenalty = (100 - item.competitionScore) * 0.2;
  return clamp(item.demandScore * 0.38 + item.growthScore * 0.42 + competitionPenalty);
}

function toneFor(item: MarketTrend): Tone {
  const score = scoreTrend(item);
  if (score >= 78) return "success";
  if (score >= 62) return "blue";
  if (item.competitionScore > 80) return "warning";
  return "neutral";
}

function signalLabel(item: MarketTrend, locale: Locale) {
  const id = {
    viral: "Viral",
    rising: "Naik",
    stable: "Stabil",
    seasonal: "Musiman",
  } as const;
  const en = {
    viral: "Viral",
    rising: "Rising",
    stable: "Stable",
    seasonal: "Seasonal",
  } as const;
  const ms = {
    viral: "Viral",
    rising: "Naik",
    stable: "Stabil",
    seasonal: "Bermusim",
  } as const;
  return (locale === "en" ? en : locale === "ms" ? ms : id)[item.signal];
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
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
    return `1. Ambil 3 produk teratas dari daftar tren.\n2. Cek minimal 20 listing kompetitor per produk.\n3. Validasi supplier dan hitung margin setelah fee/voucher/ongkir.\n4. Uji 1 SKU kecil dulu sebelum stok besar.\n5. Prioritaskan produk dengan demand tinggi dan kompetisi di bawah 60/100.`;
  }
  return `${c.topTrend}: ${top.productName} di ${top.marketplace}. ${c.recommendation}: riset kompetitor dan validasi margin sebelum masuk stok.\n${listTop}`;
}

export function ProductTrendAdvisor({ products: _products }: { products?: Product[] }) {
  const locale = useDashboardLocale();
  const c = COPY[locale];
  const [question, setQuestion] = useState<MarketQuestion>("hot");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All");
  const [marketplace, setMarketplace] = useState("All");
  const [category, setCategory] = useState("All");

  const countries = useMemo(() => ["All", ...unique(MARKET_TRENDS.map((item) => item.country))], []);
  const marketplaces = useMemo(() => ["All", ...unique(MARKET_TRENDS.map((item) => item.marketplace))], []);
  const categories = useMemo(() => ["All", ...unique(MARKET_TRENDS.map((item) => item.category))], []);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MARKET_TRENDS.filter((item) => {
      const matchQuery = !normalized || [item.productName, item.keyword, item.category, item.marketplace].join(" ").toLowerCase().includes(normalized);
      const matchCountry = country === "All" || item.country === country;
      const matchMarketplace = marketplace === "All" || item.marketplace === marketplace;
      const matchCategory = category === "All" || item.category === category;
      return matchQuery && matchCountry && matchMarketplace && matchCategory;
    }).sort((a, b) => scoreTrend(b) - scoreTrend(a));
  }, [query, country, marketplace, category]);

  const answer = useMemo(() => buildAnswer(question, rows, c, locale), [question, rows, c, locale]);
  const top = rows[0];
  const lowCompetition = rows.find((item) => item.demandScore >= 65 && item.competitionScore <= 45);
  const strongestMarketplace = rows.reduce((best, item) => {
    const currentScore = rows.filter((row) => row.marketplace === item.marketplace).reduce((sum, row) => sum + scoreTrend(row), 0);
    const bestScore = best ? rows.filter((row) => row.marketplace === best).reduce((sum, row) => sum + scoreTrend(row), 0) : -1;
    return currentScore > bestScore ? item.marketplace : best;
  }, "" as string);

  return <section style={cardStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ maxWidth: 820 }}>
        <Badge label={c.badge} tone="blue" />
        <h2 style={{ margin: "10px 0 6px", fontSize: 28, letterSpacing: -0.8 }}>{c.title}</h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>{c.subtitle}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(c.questions) as MarketQuestion[]).map((key) => <button key={key} onClick={() => setQuestion(key)} style={{ ...(question === key ? ctaButtonStyle : ghostButtonStyle), fontSize: 12, padding: "9px 11px" }}>{c.questions[key]}</button>)}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr 0.8fr 0.8fr", gap: 10, marginTop: 18 }} className="main-grid">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 700 }} />
      <select value={country} onChange={(event) => setCountry(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.country}: {c.all}</option>{countries.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{c.country}: {item}</option>)}</select>
      <select value={marketplace} onChange={(event) => setMarketplace(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.marketplace}: {c.all}</option>{marketplaces.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ef", fontWeight: 800 }}><option value="All">{c.category}: {c.all}</option>{categories.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}</select>
    </div>

    <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 18 }}>
      <StatCard label={c.topTrend} value={top?.productName || "-"} helper={top ? `${top.marketplace} · ${signalLabel(top, locale)} · ${c.demand} ${top.demandScore}/100` : "-"} tone="blue" />
      <StatCard label={c.strongestMarketplace} value={strongestMarketplace || "-"} helper={rows.length ? `${rows.length} trend signals` : "-"} tone="success" />
      <StatCard label={c.lowCompetition} value={lowCompetition?.productName || "-"} helper={lowCompetition ? `${c.competition} ${lowCompetition.competitionScore}/100` : c.emptyDesc} tone={lowCompetition ? "success" : "warning"} />
      <StatCard label={c.monthlyRevenue} value={compactMoney(rows.reduce((sum, item) => sum + item.monthlyRevenue, 0), locale)} helper={`${rows.reduce((sum, item) => sum + item.monthlyUnits, 0).toLocaleString()} unit`} tone="neutral" />
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
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{item.marketplace} · {item.country} · {item.category} · keyword: {item.keyword}</div>
              </div>
              <Badge label={`${signalLabel(item, locale)} ${Math.round(trendScore)}/100`} tone={tone} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 12, fontSize: 12, color: "#64748b" }} className="metrics-grid">
              <span>{c.demand}: <b>{item.demandScore}/100</b></span>
              <span>{c.growth}: <b>{item.growthScore}/100</b></span>
              <span>{c.competition}: <b>{item.competitionScore}/100</b></span>
              <span>{c.priceRange}: <b>{money(item.priceMin, locale)}-{money(item.priceMax, locale)}</b></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, fontSize: 12, color: "#64748b" }}>
              <span>{c.monthlyUnits}: <b>{item.monthlyUnits.toLocaleString()}</b></span>
              <span>{c.monthlyRevenue}: <b>{compactMoney(item.monthlyRevenue, locale)}</b></span>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={trendScore} /></div>
            <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12 }}>{c.source}: {item.source}</p>
          </div>;
        })}
      </div>
    </div>
  </section>;
}

import type { DashboardMetrics, Product } from "@/types/dashboard";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";

type Props = {
  products: Product[];
  metrics: DashboardMetrics;
  onGoMarketplace: () => void;
  onGoAI: () => void;
  onGoBilling: () => void;
};

const competitorMap = [
  { name: "Jubelio/Ginee", strength: "Omnichannel, stok, order, WMS, chat", weakness: "Umumnya terasa operasional/ERP-heavy untuk UMKM kecil", untungin: "AI profit decision layer di atas data marketplace" },
  { name: "Sirclo", strength: "Commerce enablement, webstore, enterprise service", weakness: "Lebih cocok brand yang butuh layanan end-to-end", untungin: "Self-serve AI CFO untuk seller marketplace harian" },
  { name: "Spreadsheet manual", strength: "Murah dan familiar", weakness: "Tidak realtime, rawan salah hitung fee/COD/retur/iklan", untungin: "Import CSV + AI action plan otomatis" },
];

const wedgeCards = [
  { title: "Profit asli, bukan omzet", metric: "Fee + iklan + voucher", detail: "Seller Indonesia sering merasa omzet besar, tapi uang hilang di fee marketplace, iklan, affiliate, COD gagal, dan retur." },
  { title: "Daily AI Briefing", metric: "1 keputusan/hari", detail: "Setiap pagi owner dapat prioritas: produk scale, stop promo, restock, naik harga, atau tekan expense." },
  { title: "Mobile-first operator", metric: "HP dulu", detail: "Staff gudang dan owner bisa input stok, cek alert, dan baca insight tanpa buka laptop." },
  { title: "Billing anti-blocker", metric: "Xendit + manual", detail: "Saat Midtrans ditolak, growth tidak berhenti. Sistem menyiapkan payment provider alternatif dan manual approval." },
];

export function StartupMoatPanel({ products, metrics, onGoMarketplace, onGoAI, onGoBilling }: Props) {
  const topProduct = [...products].sort((a, b) => b.profit - a.profit)[0];
  const lowStock = products.filter((item) => item.stockInitial > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  const realDataScore = products.length > 0 ? 70 : 20;
  const aiScore = products.length > 0 ? 82 : 35;
  const billingScore = 60;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, background: "linear-gradient(135deg,#08111f,#0f172a)", color: "white", border: "1px solid rgba(255,255,255,0.14)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18 }} className="main-grid">
          <div>
            <Badge label="Startup Moat" tone="success" />
            <h2 style={{ margin: "14px 0 8px", fontSize: 36, lineHeight: 1.05, letterSpacing: -1.2 }}>Jangan jadi ERP lain. Jadilah AI decision engine untuk seller Indonesia.</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.75, maxWidth: 860 }}>Kompetitor besar menang di integrasi dan operasi. Untungin.ai harus menang di kecepatan keputusan: profit asli, cashflow aman, stok tidak mati, dan owner tahu harus melakukan apa hari ini.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button onClick={onGoMarketplace} style={ctaButtonStyle}>Masukkan data real</button>
              <button onClick={onGoAI} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)" }}>Generate AI plan</button>
              <button onClick={onGoBilling} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)" }}>Siapkan billing</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)" }}>
              <small style={{ color: "#99f6e4" }}>North-star metric</small>
              <h3 style={{ margin: "8px 0" }}>Keputusan profit yang dieksekusi / hari</h3>
              <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.65 }}>Bukan jumlah menu. Ukur berapa banyak seller mengambil tindakan karena Untungin.ai.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)" }}>
              <small style={{ color: "#99f6e4" }}>Action hari ini</small>
              <h3 style={{ margin: "8px 0" }}>{topProduct ? `Scale ${topProduct.name}` : "Import CSV marketplace pertama"}</h3>
              <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.65 }}>{topProduct ? `Profit ${money(topProduct.profit)} · margin ${percent(topProduct.margin)}.` : "Data real adalah pembeda pertama dari demo."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Real-data readiness" value={`${realDataScore}/100`} helper="CSV/API/import pipeline" tone="blue" />
        <StatCard label="AI decision score" value={`${aiScore}/100`} helper="Insight berbasis data" tone="success" />
        <StatCard label="Billing readiness" value={`${billingScore}/100`} helper="Xendit/manual fallback" tone="warning" />
        <StatCard label="Stock risk" value={lowStock.length} helper="SKU kritis" tone={lowStock.length ? "danger" : "success"} />
      </section>

      <section className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {competitorMap.map((item) => (
          <div key={item.name} style={cardStyle}>
            <Badge label={item.name} tone="blue" />
            <h3 style={{ margin: "12px 0 6px" }}>Cara mengalahkan</h3>
            <p style={{ color: "#475569", lineHeight: 1.65 }}><strong>Kuat mereka:</strong> {item.strength}</p>
            <p style={{ color: "#475569", lineHeight: 1.65 }}><strong>Gap:</strong> {item.weakness}</p>
            <p style={{ color: "#0f766e", lineHeight: 1.65, fontWeight: 800 }}><strong>Untungin.ai:</strong> {item.untungin}</p>
          </div>
        ))}
      </section>

      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={cardStyle}>
          <Badge label="Growth wedge" tone="success" />
          <h2 style={{ margin: "12px 0" }}>Fitur yang harus lebih kuat dari kompetitor</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {wedgeCards.map((item) => (
              <div key={item.title} style={{ padding: 15, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{item.title}</strong><Badge label={item.metric} tone="neutral" /></div>
                <p style={{ color: "#64748b", lineHeight: 1.65, marginBottom: 0 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <Badge label="Execution roadmap" tone="warning" />
          <h2 style={{ margin: "12px 0" }}>Urutan kerja paling serius</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div><small>1. Real data activation <b style={{ float: "right" }}>CSV first</b></small><Progress value={realDataScore} /></div>
            <div><small>2. AI daily briefing <b style={{ float: "right" }}>Core moat</b></small><Progress value={aiScore} /></div>
            <div><small>3. Marketplace API <b style={{ float: "right" }}>Partner path</b></small><Progress value={35} /></div>
            <div><small>4. Billing <b style={{ float: "right" }}>Xendit/manual</b></small><Progress value={billingScore} /></div>
            <div><small>5. Mobile operator app <b style={{ float: "right" }}>Retention</b></small><Progress value={68} /></div>
          </div>
          <p style={{ color: "#64748b", lineHeight: 1.7, marginTop: 16 }}>Prioritas minggu ini: jangan tambah menu terlalu banyak. Pastikan seller upload CSV, mendapat insight pertama, lalu bisa upgrade tanpa Midtrans.</p>
        </div>
      </section>
    </div>
  );
}

import type { Tone } from "@/types/dashboard";
import { money, compactMoney, percent } from "@/lib/dashboard/format";
import { cardStyle, Badge } from "./ui";

export type LinePoint = { label: string; value: number; secondary?: number };
export type DonutSegment = { label: string; value: number; tone?: Tone };

type ChartDomain = { min: number; max: number };

const toneColor: Record<Tone, string> = {
  success: "#0f766e",
  warning: "#d97706",
  danger: "#dc2626",
  blue: "#2563eb",
  neutral: "#0f172a",
  muted: "#94a3b8",
};

function normalizeNumber(value: unknown) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function getChartDomain(points: LinePoint[], keys: Array<"value" | "secondary">): ChartDomain {
  const values = points.flatMap((point) => keys.map((key) => normalizeNumber(point[key])));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || Math.max(maxValue, 1);
  const padding = range * 0.1;
  return {
    min: minValue >= 0 ? 0 : minValue - padding,
    max: maxValue + padding,
  };
}

function buildLinePath(points: LinePoint[], key: "value" | "secondary", width: number, height: number, padding = 20, domain?: ChartDomain) {
  const safeDomain = domain || getChartDomain(points, [key]);
  const range = safeDomain.max - safeDomain.min || 1;
  return points
    .map((point, index) => {
      const value = normalizeNumber(point[key]);
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - safeDomain.min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(points: LinePoint[], key: "value" | "secondary", width: number, height: number, padding = 20, domain?: ChartDomain) {
  if (points.length === 0) return "";
  const line = buildLinePath(points, key, width, height, padding, domain);
  const startX = padding;
  const endX = width - padding;
  const baseY = height - padding;
  return `${line} L${endX} ${baseY} L${startX} ${baseY} Z`;
}

function getTickIndexes(length: number) {
  if (length <= 1) return new Set<number>([0]);
  if (length <= 4) return new Set<number>(Array.from({ length }, (_, index) => index));
  const indexes = [0, Math.round((length - 1) * 0.33), Math.round((length - 1) * 0.66), length - 1];
  return new Set(indexes);
}

function formatTickLabel(label: unknown, index: number) {
  const raw = String(label ?? "").trim();
  if (!raw || /undefined|null|nan/i.test(raw)) return `D${index + 1}`;
  const dPlus = raw.match(/^D\+?(\d+)$/i);
  if (dPlus) return `D${dPlus[1]}`;
  return raw.length > 10 ? `${raw.slice(0, 10)}…` : raw;
}

function chartStat(value: number) {
  return Math.abs(value) >= 1_000_000 ? compactMoney(value) : money(value);
}

export function LineChartCard({ title, subtitle, data, valueLabel, secondaryLabel }: { title: string; subtitle: string; data: LinePoint[]; valueLabel?: string; secondaryLabel?: string }) {
  const width = 560;
  const height = 230;
  const padding = 30;
  const safeData = data.length > 0 ? data.map((item, index) => ({
    ...item,
    label: formatTickLabel(item.label, index),
    value: normalizeNumber(item.value),
    secondary: normalizeNumber(item.secondary),
  })) : [{ label: "D1", value: 0, secondary: 0 }];
  const secondaryTotal = safeData.reduce((acc, item) => acc + normalizeNumber(item.secondary), 0);
  const domain = getChartDomain(safeData, secondaryTotal > 0 ? ["value", "secondary"] : ["value"]);
  const primaryPath = buildLinePath(safeData, "value", width, height, padding, domain);
  const secondaryPath = buildLinePath(safeData, "secondary", width, height, padding, domain);
  const primaryArea = buildAreaPath(safeData, "value", width, height, padding, domain);
  const total = safeData.reduce((acc, item) => acc + item.value, 0);
  const tickIndexes = getTickIndexes(safeData.length);
  const gradientId = `chart-area-${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

  return (
    <section style={{ ...cardStyle, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <Badge label={title} tone="blue" />
          <h3 style={{ margin: "10px 0 2px", letterSpacing: -0.2 }}>{subtitle}</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: 24, letterSpacing: -0.6 }}>{chartStat(total)}</strong>
          {secondaryLabel && <div style={{ color: "#64748b", fontSize: 12 }}>Out {chartStat(secondaryTotal)}</div>}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 258, marginTop: 8, display: "block" }} aria-label={`${title} chart`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => (
          <line key={row} x1={padding} x2={width - padding} y1={32 + row * 46} y2={32 + row * 46} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={primaryArea} fill={`url(#${gradientId})`} />
        {secondaryTotal > 0 && <path d={secondaryPath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.86" />}
        <path d={primaryPath} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {safeData.map((item, index) => {
          if (!tickIndexes.has(index)) return null;
          const x = padding + (index / Math.max(safeData.length - 1, 1)) * (width - padding * 2);
          return <text key={`${item.label}-${index}`} x={x} y={height - 5} textAnchor={index === 0 ? "start" : index === safeData.length - 1 ? "end" : "middle"} fill="#64748b" fontSize="10" fontWeight="700">{item.label}</text>;
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: 13, flexWrap: "wrap", alignItems: "center" }}>
        <span><b style={{ color: "#0f766e" }}>●</b> {valueLabel || "Masuk"}</span>
        {secondaryLabel && <span><b style={{ color: "#d97706" }}>●</b> {secondaryLabel}</span>}
        <span style={{ marginLeft: "auto", color: "#98a2b3" }}>{safeData.length} titik data</span>
      </div>
    </section>
  );
}

export function DonutChartCard({ title, subtitle, segments, centerLabel }: { title: string; subtitle: string; segments: DonutSegment[]; centerLabel?: string }) {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);
  let current = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <section style={cardStyle}>
      <Badge label={title} tone="warning" />
      <h3 style={{ margin: "10px 0 14px" }}>{subtitle}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 18, alignItems: "center" }}>
        <svg viewBox="0 0 120 120" style={{ width: 150, height: 150 }}>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
          {segments.map((segment) => {
            const pct = total > 0 ? segment.value / total : 0;
            const dash = pct * circumference;
            const strokeDasharray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = -current * circumference;
            current += pct;
            return <circle key={segment.label} cx="60" cy="60" r={radius} fill="none" stroke={toneColor[segment.tone || "blue"]} strokeWidth="16" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} transform="rotate(-90 60 60)" strokeLinecap="round" />;
          })}
          <text x="60" y="56" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="800">{centerLabel || compactMoney(total)}</text>
          <text x="60" y="74" textAnchor="middle" fill="#64748b" fontSize="11">Total</text>
        </svg>
        <div style={{ display: "grid", gap: 10 }}>
          {segments.length === 0 && <p style={{ color: "#64748b" }}>Belum ada data kategori.</p>}
          {segments.map((segment) => (
            <div key={segment.label} style={{ display: "grid", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span><b style={{ color: toneColor[segment.tone || "blue"] }}>●</b> {segment.label}</span><strong>{money(segment.value)}</strong></div>
              <div style={{ height: 7, borderRadius: 999, background: "#eef2f7", overflow: "hidden" }}><div style={{ width: `${total ? (segment.value / total) * 100 : 0}%`, height: "100%", background: toneColor[segment.tone || "blue"] }} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AnalyticsTable({ title, rows }: { title: string; rows: { label: string; value: number; helper: string; tone?: Tone }[] }) {
  return (
    <section style={cardStyle}>
      <Badge label={title} tone="neutral" />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: 14, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div><strong>{row.label}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{row.helper}</div></div>
            <strong style={{ color: toneColor[row.tone || "neutral"] }}>{typeof row.value === "number" && row.value <= 100 && row.helper.includes("Margin") ? percent(row.value) : money(row.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketplaceBarChart({ title, subtitle, data }: { title: string; subtitle: string; data: LinePoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <section style={cardStyle}>
      <Badge label={title} tone="blue" />
      <h3 style={{ margin: "10px 0 14px" }}>{subtitle}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {data.length === 0 && <p style={{ color: "#64748b" }}>Belum ada data channel.</p>}
        {data.map((item) => (
          <div key={item.label} style={{ display: "grid", gridTemplateColumns: "130px 1fr auto", gap: 12, alignItems: "center" }}>
            <strong>{item.label}</strong>
            <div style={{ height: 12, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#0f766e,#14b8a6)" }} />
            </div>
            <div style={{ textAlign: "right" }}><strong>{money(item.value)}</strong><div style={{ color: "#64748b", fontSize: 12 }}>Omzet {compactMoney(Number(item.secondary || 0))}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ForecastChartCard({ title, subtitle, data }: { title: string; subtitle: string; data: { label: string; revenue: number; profit: number; expenses: number; netCash: number }[] }) {
  const width = 620;
  const height = 250;
  const padding = 32;
  const points = data.map((item, index) => ({ label: formatTickLabel(item.label, index), value: item.revenue, secondary: item.expenses }));
  const profitPoints = data.map((item, index) => ({ label: formatTickLabel(item.label, index), value: item.profit }));
  const domain = getChartDomain([...points, ...profitPoints], ["value", "secondary"]);
  const revenuePath = buildLinePath(points, "value", width, height, padding, domain);
  const expensePath = buildLinePath(points, "secondary", width, height, padding, domain);
  const profitPath = buildLinePath(profitPoints, "value", width, height, padding, domain);
  const revenueArea = buildAreaPath(points, "value", width, height, padding, domain);
  const totalRevenue = data.reduce((acc, item) => acc + item.revenue, 0);
  const totalNetCash = data.reduce((acc, item) => acc + item.netCash, 0);
  const tickIndexes = getTickIndexes(data.length);
  return (
    <section style={{ ...cardStyle, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div><Badge label={title} tone="success" /><h3 style={{ margin: "10px 0 2px" }}>{subtitle}</h3></div>
        <div style={{ textAlign: "right" }}><strong style={{ fontSize: 22 }}>{compactMoney(totalNetCash)}</strong><div style={{ color: "#64748b", fontSize: 12 }}>Net cash · omzet {compactMoney(totalRevenue)}</div></div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 276, marginTop: 10, display: "block" }}>
        <defs>
          <linearGradient id="forecastRevenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => <line key={row} x1={padding} x2={width - padding} y1={34 + row * 48} y2={34 + row * 48} stroke="#e2e8f0" strokeWidth="1" />)}
        <path d={revenueArea} fill="url(#forecastRevenueArea)" />
        <path d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={profitPath} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={expensePath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        {points.map((item, index) => {
          if (!tickIndexes.has(index)) return null;
          const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
          return <text key={`${item.label}-${index}`} x={x} y={height - 5} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fill="#64748b" fontSize="10" fontWeight="700">{item.label}</text>;
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: 13, flexWrap: "wrap" }}>
        <span><b style={{ color: "#2563eb" }}>●</b> Revenue</span>
        <span><b style={{ color: "#0f766e" }}>●</b> Profit</span>
        <span><b style={{ color: "#d97706" }}>●</b> Expenses</span>
      </div>
    </section>
  );
}

import type React from "react";
import type { Tone } from "@/types/dashboard";
import { money, compactMoney, percent } from "@/lib/dashboard/format";
import { cardStyle, Badge } from "./ui";

export type LinePoint = { label: string; value: number; secondary?: number };
export type DonutSegment = { label: string; value: number; tone?: Tone };

const toneColor: Record<Tone, string> = {
  success: "#0f766e",
  warning: "#d97706",
  danger: "#dc2626",
  blue: "#2563eb",
  neutral: "#0f172a",
  muted: "#94a3b8",
};

function buildLinePath(points: LinePoint[], key: "value" | "secondary", width: number, height: number, padding = 12) {
  const values = points.map((point) => Number(point[key] || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function LineChartCard({ title, subtitle, data, valueLabel, secondaryLabel }: { title: string; subtitle: string; data: LinePoint[]; valueLabel?: string; secondaryLabel?: string }) {
  const width = 520;
  const height = 180;
  const primaryPath = buildLinePath(data, "value", width, height);
  const secondaryPath = buildLinePath(data, "secondary", width, height);
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const secondaryTotal = data.reduce((acc, item) => acc + Number(item.secondary || 0), 0);
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <Badge label={title} tone="blue" />
          <h3 style={{ margin: "10px 0 2px" }}>{subtitle}</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: 22 }}>{compactMoney(total)}</strong>
          {secondaryLabel && <div style={{ color: "#64748b", fontSize: 12 }}>Out {compactMoney(secondaryTotal)}</div>}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 210, marginTop: 10 }}>
        {[0, 1, 2, 3].map((row) => (
          <line key={row} x1="12" x2={width - 12} y1={22 + row * 42} y2={22 + row * 42} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {secondaryTotal > 0 && <path d={secondaryPath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.82" />}
        <path d={primaryPath} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = 12 + (index / Math.max(data.length - 1, 1)) * (width - 24);
          return <text key={item.label} x={x} y={height - 1} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fill="#64748b" fontSize="12">{item.label}</text>;
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: 13, flexWrap: "wrap" }}>
        <span><b style={{ color: "#0f766e" }}>●</b> {valueLabel || "Masuk"}</span>
        {secondaryLabel && <span><b style={{ color: "#d97706" }}>●</b> {secondaryLabel}</span>}
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
          {segments.map((segment, index) => {
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
  const height = 220;
  const points = data.map((item) => ({ label: item.label, value: item.revenue, secondary: item.expenses }));
  const revenuePath = buildLinePath(points, "value", width, height, 18);
  const expensePath = buildLinePath(points, "secondary", width, height, 18);
  const profitPath = buildLinePath(data.map((item) => ({ label: item.label, value: item.profit })), "value", width, height, 18);
  const totalRevenue = data.reduce((acc, item) => acc + item.revenue, 0);
  const totalNetCash = data.reduce((acc, item) => acc + item.netCash, 0);
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div><Badge label={title} tone="success" /><h3 style={{ margin: "10px 0 2px" }}>{subtitle}</h3></div>
        <div style={{ textAlign: "right" }}><strong style={{ fontSize: 22 }}>{compactMoney(totalNetCash)}</strong><div style={{ color: "#64748b", fontSize: 12 }}>Net cash · omzet {compactMoney(totalRevenue)}</div></div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 250, marginTop: 10 }}>
        {[0, 1, 2, 3].map((row) => <line key={row} x1="18" x2={width - 18} y1={26 + row * 46} y2={26 + row * 46} stroke="#e2e8f0" strokeWidth="1" />)}
        <path d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={profitPath} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={expensePath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        {data.filter((_, index) => index % 5 === 0 || index === data.length - 1).map((item) => {
          const index = data.findIndex((point) => point.label === item.label);
          const x = 18 + (index / Math.max(data.length - 1, 1)) * (width - 36);
          return <text key={item.label} x={x} y={height - 1} textAnchor="middle" fill="#64748b" fontSize="11">{item.label}</text>;
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

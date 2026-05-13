import type React from "react";
import type { Tone } from "@/types/dashboard";
import { clamp } from "@/lib/dashboard/format";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid #dbe3ef",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
  fontSize: 14,
};

export const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dde6f1",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
};

export const ctaButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "#0f172a",
  color: "#ffffff",
  border: "0",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};

export const ghostButtonStyle: React.CSSProperties = {
  padding: "10px 13px",
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid #dbe3ef",
  borderRadius: 13,
  cursor: "pointer",
  fontWeight: 800,
};

export function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const palette = {
    success: { color: "#047857", bg: "#dcfce7", border: "#a7f3d0" },
    warning: { color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
    danger: { color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
    blue: { color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
    neutral: { color: "#0f172a", bg: "#f1f5f9", border: "#e2e8f0" },
    muted: { color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
  }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 9px", color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`, fontSize: 12, fontWeight: 800 }}>{label}</span>;
}

export function Progress({ value }: { value: number }) {
  const width = clamp(value, 0, 100);
  return <div style={{ height: 8, borderRadius: 999, background: "#edf2f7", overflow: "hidden" }}><div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#0f766e,#14b8a6)" }} /></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}><h3 style={{ color: "#0f172a", margin: "0 0 8px" }}>{title}</h3><p style={{ margin: 0, lineHeight: 1.7 }}>{description}</p></div>;
}

export function StatCard({ label, value, helper, tone = "success" }: { label: string; value: React.ReactNode; helper: string; tone?: Tone }) {
  const color = tone === "danger" ? "#b91c1c" : tone === "warning" ? "#b45309" : tone === "blue" ? "#2563eb" : tone === "neutral" ? "#0f172a" : "#0f766e";
  return <div style={cardStyle}><p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{label}</p><h2 style={{ margin: "10px 0", color, fontSize: 28, letterSpacing: -0.6 }}>{value}</h2><small style={{ color: "#64748b", lineHeight: 1.5 }}>{helper}</small></div>;
}

export function Sparkline({ data }: { data: number[] }) {
  const width = 260;
  const height = 72;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData.map((value, index) => `${(index / Math.max(safeData.length - 1, 1)) * width},${height - ((value - min) / range) * height}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}><polyline fill="none" stroke="rgba(20,184,166,0.18)" strokeWidth="10" points={points} strokeLinecap="round" strokeLinejoin="round" /><polyline fill="none" stroke="#0f766e" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

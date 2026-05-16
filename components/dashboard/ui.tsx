import type React from "react";
import type { Tone } from "@/types/dashboard";
import { clamp } from "@/lib/dashboard/format";

export const colors = {
  ink: "#101828",
  muted: "#667085",
  line: "rgba(16,24,40,0.10)",
  soft: "#f8fafc",
  brand: "#0f766e",
  brand2: "#14b8a6",
  gold: "#f59e0b",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 16,
  border: "1px solid rgba(16,24,40,0.12)",
  background: "rgba(255,255,255,0.92)",
  color: colors.ink,
  outline: "none",
  fontSize: 14,
  boxShadow: "0 1px 0 rgba(16,24,40,0.02)",
};

export const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
  border: "1px solid rgba(16,24,40,0.09)",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 20px 70px rgba(16,24,40,0.08)",
};

export const ctaButtonStyle: React.CSSProperties = {
  padding: "12px 17px",
  background: "linear-gradient(135deg,#0f766e,#14b8a6)",
  color: "#ffffff",
  border: "0",
  borderRadius: 16,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
  boxShadow: "0 14px 32px rgba(15,118,110,0.24)",
};

export const ghostButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "rgba(255,255,255,0.86)",
  color: colors.ink,
  border: "1px solid rgba(16,24,40,0.12)",
  borderRadius: 15,
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
};

function tonePalette(tone: Tone) {
  return {
    success: { color: "#047857", bg: "#ecfdf3", border: "#a7f3d0" },
    warning: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    danger: { color: "#b42318", bg: "#fff1f1", border: "#fecaca" },
    blue: { color: "#175cd3", bg: "#eff6ff", border: "#bfdbfe" },
    neutral: { color: colors.ink, bg: "#f8fafc", border: "#e2e8f0" },
    muted: { color: colors.muted, bg: "#f8fafc", border: "#e2e8f0" },
  }[tone];
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const palette = tonePalette(tone);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`, fontSize: 12, fontWeight: 850, letterSpacing: 0.1 }}>{label}</span>;
}

export function Progress({ value }: { value: number }) {
  const width = clamp(value, 0, 100);
  return <div style={{ height: 9, borderRadius: 999, background: "#edf2f7", overflow: "hidden" }}><div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#0f766e,#14b8a6,#f59e0b)" }} /></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div style={{ padding: 48, textAlign: "center", color: colors.muted }}><h3 style={{ color: colors.ink, margin: "0 0 8px" }}>{title}</h3><p style={{ margin: 0, lineHeight: 1.7 }}>{description}</p></div>;
}

export function StatCard({
  label,
  value,
  helper,
  tone = "success",
  delta,
  deltaTone = "muted",
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  tone?: Tone;
  delta?: string;
  deltaTone?: Tone;
}) {
  const color = tone === "danger" ? "#b42318" : tone === "warning" ? "#b45309" : tone === "blue" ? "#175cd3" : tone === "neutral" ? colors.ink : colors.brand;
  const deltaPalette = tonePalette(deltaTone);
  return <div style={{ ...cardStyle, position: "relative", overflow: "hidden", minWidth: 0 }}>
    <div style={{ position: "absolute", right: -28, top: -32, width: 105, height: 105, borderRadius: 999, background: `${color}12` }} />
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <p style={{ margin: 0, color: colors.muted, fontSize: 13, fontWeight: 750 }}>{label}</p>
        {delta ? <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 9px", color: deltaPalette.color, background: deltaPalette.bg, border: `1px solid ${deltaPalette.border}`, fontSize: 11, fontWeight: 850 }}>{delta}</span> : null}
      </div>
      <h2 style={{ margin: "10px 0", color, fontSize: 29, letterSpacing: -0.9 }}>{value}</h2>
      <small style={{ color: colors.muted, lineHeight: 1.5 }}>{helper}</small>
    </div>
  </div>;
}

export function Sparkline({ data }: { data: number[] }) {
  const width = 260;
  const height = 72;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData.map((value, index) => `${(index / Math.max(safeData.length - 1, 1)) * width},${height - ((value - min) / range) * height}`).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}><defs><linearGradient id="spark" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#99f6e4" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient></defs><polyline fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" points={points} strokeLinecap="round" strokeLinejoin="round" /><polyline fill="none" stroke="url(#spark)" strokeWidth="3.5" points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

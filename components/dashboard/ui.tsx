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
  borderRadius: 14,
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
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 16px 52px rgba(16,24,40,0.07)",
};

export const ctaButtonStyle: React.CSSProperties = {
  padding: "10px 15px",
  background: "linear-gradient(135deg,#0f766e,#14b8a6)",
  color: "#ffffff",
  border: "0",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
  boxShadow: "0 14px 32px rgba(15,118,110,0.24)",
};

export const ghostButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "rgba(255,255,255,0.86)",
  color: colors.ink,
  border: "1px solid rgba(16,24,40,0.12)",
  borderRadius: 13,
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
};

// Perbaikan fungsi dengan menambahkan Fallback Default Object di akhir kurung kotak
function tonePalette(tone: Tone) {
  const mapping: Record<string, { color: string; bg: string; border: string }> = {
    success: { color: "#047857", bg: "#ecfdf3", border: "#a7f3d0" },
    warning: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    danger: { color: "#b42318", bg: "#fff1f1", border: "#fecaca" },
    blue: { color: "#175cd3", bg: "#eff6ff", border: "#bfdbfe" },
    neutral: { color: colors.ink, bg: "#f8fafc", border: "#e2e8f0" },
    muted: { color: colors.muted, bg: "#f8fafc", border: "#e2e8f0" },
    
    // Tambahan Opsional: Berikan penanganan langsung jika nama marketplace tidak sengaja terlempar ke sini
    shopee: { color: "#ea580c", bg: "#fff7ed", border: "#ffedd5" },
    tokopedia: { color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
    tiktok: { color: "#000000", bg: "#f3f4f6", border: "#e5e7eb" }
  };

  // Gunakan '||' untuk mengembalikan skema 'neutral' jika tone yang dimasukkan tidak terdaftar
  return mapping[tone] || mapping["neutral"];
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  // Ambil palet yang sudah diproteksi oleh fallback di dalam fungsi tonePalette
  const palette = tonePalette(tone);
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 9px",
        color: palette.color,          // Dijamin tidak akan 'undefined' lagi
        background: palette.bg,        // Dijamin aman
        border: `1px solid ${palette.border}`, // Dijamin aman
        fontSize: 12,
        fontWeight: 850,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </span>
  );
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

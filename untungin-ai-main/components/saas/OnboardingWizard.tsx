"use client";

import { useState } from "react";
import { ctaButtonStyle, ghostButtonStyle } from "@/components/dashboard/ui";

type Step = { title: string; body: string; cta: string };
const steps: Step[] = [
  { title: "Buat workspace seller", body: "Pisahkan data per bisnis, brand, atau toko. Cocok untuk owner yang punya beberapa channel.", cta: "Workspace siap" },
  { title: "Tambah toko pertama", body: "Pilih Shopee, Tokopedia, TikTok Shop, Lazada, reseller, atau manual store.", cta: "Tambah toko" },
  { title: "Import CSV marketplace", body: "Upload laporan penjualan agar Untungin.ai menghitung omzet, HPP, fee, stok, dan profit asli.", cta: "Import CSV" },
  { title: "Baca AI action plan", body: "AI CFO memberi prioritas: restock, audit margin, stop rugi, scale produk, dan cashflow warning.", cta: "Lihat insight" },
];

export function OnboardingWizard({ onFinish }: { onFinish?: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  return (
    <section style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "radial-gradient(circle at 10% 10%,rgba(20,184,166,.25),transparent 30%),linear-gradient(135deg,#020617,#0f172a)", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 760, borderRadius: 32, border: "1px solid rgba(255,255,255,.14)", background: "rgba(15,23,42,.82)", padding: 28, boxShadow: "0 30px 90px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>{steps.map((_, index) => <div key={index} style={{ height: 8, flex: 1, borderRadius: 999, background: index <= step ? "linear-gradient(90deg,#14b8a6,#f59e0b)" : "rgba(255,255,255,.12)" }} />)}</div>
        <p style={{ color: "#5eead4", fontWeight: 900 }}>Step {step + 1} / {steps.length}</p>
        <h1 style={{ fontSize: 42, lineHeight: 1.02, letterSpacing: -1.4, margin: "0 0 12px" }}>{current.title}</h1>
        <p style={{ color: "#cbd5e1", lineHeight: 1.8, fontSize: 16 }}>{current.body}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <button style={{ ...ctaButtonStyle, background: "white", color: "#0f172a" }} onClick={() => step === steps.length - 1 ? onFinish?.() : setStep((value) => value + 1)}>{current.cta}</button>
          {step > 0 && <button style={{ ...ghostButtonStyle, background: "rgba(255,255,255,.08)", color: "white", borderColor: "rgba(255,255,255,.18)" }} onClick={() => setStep((value) => value - 1)}>Kembali</button>}
        </div>
      </div>
    </section>
  );
}

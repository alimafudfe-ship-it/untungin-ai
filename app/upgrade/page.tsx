"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UpgradePlan = "monthly" | "lifetime";

const MONTHLY_PRICE = "Rp29.000/bulan";
const LIFETIME_PRICE = "Rp99.000 sekali bayar";
const WHATSAPP_NUMBER = "6285697834766";
const EARLY_USER_SLOT_LEFT = 37;

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>("lifetime");

useEffect(() => {
  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(data.user.email ?? null);

    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("plan, pro_until")
      .eq("id", data.user.id)
      .maybeSingle();

    const profile = profileData as {
      plan: string | null;
      pro_until: string | null;
    } | null;

    const isPro =
      profile?.plan === "pro" &&
      (!profile?.pro_until || new Date(profile.pro_until) > new Date());

    if (isPro) router.replace("/");
  }

  loadUser();
}, [router]);

  function getPlanText(plan: UpgradePlan = selectedPlan) {
    return plan === "monthly" ? `PRO Bulanan ${MONTHLY_PRICE}` : `PRO Lifetime ${LIFETIME_PRICE}`;
  }

  function openWhatsApp(planText: string, email?: string | null) {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Halo admin Untungin.ai, saya mau request upgrade ${planText}. Mohon aktivasi PRO untuk akun ${email || "saya"}. Saya akan kirim bukti transfer di chat ini.`
      )}`,
      "_blank"
    );
  }

  async function handleRequestUpgrade() {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      alert("Login dulu sebelum request upgrade PRO.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    const { data: existingPending } = await supabase
      .from("payment_requests")
      .select("id, status, plan")
      .eq("user_id", userData.user.id)
      .eq("status", "pending")
      .maybeSingle();

    const planText = getPlanText(selectedPlan);

    if (!existingPending) {
const { error } = await (supabase as any)
  .from("payment_requests")
  .insert([
    {
      user_id: userData.user.id,
      email: userData.user.email ?? "",
      plan: selectedPlan,
      status: "pending",
    } as any,
  ] as any);

      if (error) {
        console.error(error);
        alert("Gagal mengirim request upgrade. Coba lagi.");
        setLoading(false);
        return;
      }
    }

    alert("✅ Request upgrade masuk. Kirim bukti transfer via WhatsApp agar admin bisa aktivasi PRO.");
    openWhatsApp(planText, userData.user.email ?? userEmail);
    setLoading(false);
  }

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1080,
    borderRadius: 30,
    padding: 28,
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.94))",
    border: "1px solid rgba(34,197,94,0.28)",
    boxShadow: "0 30px 100px rgba(0,0,0,0.46)",
  };

  const ctaButtonStyle: React.CSSProperties = {
    padding: "16px 18px",
    background: "linear-gradient(135deg, #22c55e, #14b8a6)",
    color: "white",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 17,
    boxShadow: "0 18px 48px rgba(34,197,94,0.28)",
  };

  const ghostButtonStyle: React.CSSProperties = {
    background: "rgba(2,6,23,0.72)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "white",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
  };

  const planButtonStyle = (plan: UpgradePlan): React.CSSProperties => ({
    padding: 20,
    borderRadius: 22,
    border: selectedPlan === plan ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.22)",
    background: selectedPlan === plan ? "rgba(34,197,94,0.14)" : "rgba(2,6,23,0.72)",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 0%, rgba(34,197,94,0.24), transparent 32%), radial-gradient(circle at 90% 10%, rgba(20,184,166,0.18), transparent 30%), linear-gradient(135deg, #020617 0%, #030712 55%, #000 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button { transition: 160ms ease; }
        button:hover { transform: translateY(-1px); filter: brightness(1.04); }
        .upgrade-list p { margin: 0; }
        @media (max-width: 900px) {
          .upgrade-grid, .hero-grid { grid-template-columns: 1fr !important; }
          .upgrade-title { font-size: 38px !important; }
        }
      `}</style>

      <section style={cardStyle}>
        <button onClick={() => router.push("/")} style={ghostButtonStyle}>
          ← Kembali
        </button>

        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 28,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <div>
            <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>
              🚀 Upgrade ke PRO
            </p>

            <h1
              className="upgrade-title"
              style={{
                fontSize: 56,
                lineHeight: 1.02,
                margin: "12px 0",
                letterSpacing: -1.8,
              }}
            >
              Stop tebak profit. Mulai ambil keputusan.
            </h1>

            <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.75, maxWidth: 720 }}>
              90% seller fokus omzet, tapi bocor di profit. AI CFO bantu kamu lihat uang sebenarnya,
              produk mana yang harus di-scale, dan harga mana yang harus dinaikkan.
            </p>

            <div
              className="upgrade-list"
              style={{
                display: "grid",
                gap: 12,
                marginTop: 22,
                padding: 20,
                borderRadius: 22,
                background: "rgba(2,6,23,0.72)",
                border: "1px solid rgba(34,197,94,0.24)",
              }}
            >
              <p>🚀 AI CFO baca semua produk kamu</p>
              <p>📊 Deteksi produk rugi & margin tipis</p>
              <p>💰 Rekomendasi harga jual otomatis</p>
              <p>🔥 Kasih tahu produk mana harus di-scale</p>
              <p>🕳️ Deteksi produk bocor dan biaya yang memakan profit</p>
              <p>✅ Action plan harian untuk scale, optimasi, atau stop produk</p>
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 28,
              background: "linear-gradient(135deg, rgba(6,78,59,0.46), rgba(2,6,23,0.9))",
              border: "1px solid rgba(34,197,94,0.32)",
            }}
          >
            <div
              style={{
                borderRadius: 22,
                padding: 18,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.34)",
                marginBottom: 16,
              }}
            >
              <p style={{ color: "#86efac", fontWeight: 900, margin: 0 }}>
                🔥 Sudah bantu seller menaikkan profit hingga +30%
              </p>
              <p style={{ color: "#cbd5e1", marginBottom: 0, lineHeight: 1.6 }}>
                Karena keputusan tidak lagi berdasarkan feeling, tapi berdasarkan profit, margin, dan biaya real.
              </p>
            </div>

            <p style={{ color: "#fbbf24", fontWeight: 900, margin: "0 0 10px" }}>
              ⚠️ Early user tinggal {EARLY_USER_SLOT_LEFT} slot
            </p>

            <div style={{ marginBottom: 18 }}>
              <p style={{ color: "#94a3b8", textDecoration: "line-through", margin: 0 }}>Rp299.000</p>
              <h2 style={{ color: "#86efac", fontSize: 36, margin: "4px 0" }}>{LIFETIME_PRICE}</h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>Sekali bayar untuk akses PRO early user.</p>
            </div>

            <button
              onClick={handleRequestUpgrade}
              disabled={loading}
              style={{ ...ctaButtonStyle, width: "100%", opacity: loading ? 0.72 : 1 }}
            >
              {loading ? "Mengirim request..." : "🚀 Upgrade Sekarang via WhatsApp"}
            </button>

            <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginBottom: 0 }}>
              Tidak perlu kartu kredit • Aktivasi manual cepat • Admin approve dari panel PRO
            </p>
          </div>
        </div>

        <div className="upgrade-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 26 }}>
          <button onClick={() => setSelectedPlan("monthly")} style={planButtonStyle("monthly")}>
            <strong style={{ fontSize: 18 }}>PRO Bulanan</strong>
            <h2 style={{ color: "#86efac", margin: "8px 0" }}>{MONTHLY_PRICE}</h2>
            <p style={{ color: "#94a3b8", marginBottom: 0 }}>
              Cocok untuk mulai validasi profit dan kontrol produk.
            </p>
          </button>

          <button onClick={() => setSelectedPlan("lifetime")} style={planButtonStyle("lifetime")}>
            <strong style={{ fontSize: 18 }}>Lifetime 🔥</strong>
            <h2 style={{ color: "#86efac", margin: "8px 0" }}>{LIFETIME_PRICE}</h2>
            <p style={{ color: "#fbbf24", marginBottom: 0, fontWeight: 800 }}>
              Best deal untuk early user. Harga bisa naik kapan saja.
            </p>
          </button>
        </div>

        <div
          className="upgrade-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginTop: 18,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(34,197,94,0.24)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Flow jualan simpel</h3>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7, marginBottom: 0 }}>
              1. User klik Request Upgrade.<br />
              2. Request masuk ke admin sebagai pending.<br />
              3. User kirim bukti transfer via WhatsApp.<br />
              4. Admin approve, user langsung PRO.
            </p>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(6,78,59,0.32)",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>💳 Pembayaran Upgrade PRO</h3>
            <p style={{ margin: "0 0 8px", color: "#86efac", fontWeight: 900 }}>
              ✅ Akses dibuka setelah admin verifikasi
            </p>
            <p style={{ margin: 0 }}>🏦 Bank BRI</p>
            <p style={{ margin: 0 }}>👤 AN: Ali Mafud</p>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>🔢 091901036207538</p>
          </div>
        </div>

        <button
          onClick={handleRequestUpgrade}
          disabled={loading}
          style={{ ...ctaButtonStyle, width: "100%", marginTop: 20, opacity: loading ? 0.72 : 1 }}
        >
          {loading ? "Mengirim request..." : `Request Upgrade ${getPlanText(selectedPlan)}`}
        </button>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Tanpa payment gateway, tanpa kartu kredit, tanpa API mahal. Admin approve manual dari panel PRO.
        </p>
      </section>
    </main>
  );
}

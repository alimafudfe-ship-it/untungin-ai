"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lastSentRef = useRef(0);

async function handleGoogleLogin() {
  setLoadingGoogle(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    alert(error.message);
    setLoadingGoogle(false);
  }
}
  async function handleEmailLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      alert("Masukkan email yang valid.");
      return;
    }

    const now = Date.now();
    if (now - lastSentRef.current < 30000) {
      const remaining = Math.ceil((30000 - (now - lastSentRef.current)) / 1000);
      alert(`Tunggu ${remaining} detik sebelum kirim lagi.`);
      return;
    }

    lastSentRef.current = now;
    setLoadingEmail(true);
    setCooldown(30);

    const interval = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
    });

    setLoadingEmail(false);

    if (error) {
      console.error(error);
      alert(
        error.message.toLowerCase().includes("rate limit")
          ? "⚠️ Terlalu sering kirim email. Tunggu sebentar lalu coba lagi."
          : error.message
      );
      return;
    }

    alert("✅ Link login sudah dikirim. Cek email kamu.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f5132 0%, #020617 45%, #000 100%)",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          padding: 30,
          borderRadius: 24,
          background: "rgba(15,23,42,0.94)",
          border: "1px solid #1f2937",
          boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(34,197,94,0.15)",
            color: "#22c55e",
            padding: "7px 12px",
            borderRadius: 999,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Untungin.ai
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Masuk ke Dashboard</h1>
        <p style={{ opacity: 0.7, fontSize: 14, lineHeight: 1.6 }}>
          Login untuk menyimpan data produk, cek profit, dan aktivasi PRO.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          style={{
            width: "100%",
            padding: 13,
            background: "white",
            color: "#111827",
            border: "none",
            borderRadius: 12,
            cursor: loadingGoogle ? "not-allowed" : "pointer",
            opacity: loadingGoogle ? 0.7 : 1,
            fontWeight: "bold",
            fontSize: 15,
            marginTop: 14,
          }}
        >
          {loadingGoogle ? "Membuka Google..." : "🔐 Login dengan Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", opacity: 0.5, fontSize: 12 }}>
          <div style={{ height: 1, background: "#334155", flex: 1 }} />
          atau login via email
          <div style={{ height: 1, background: "#334155", flex: 1 }} />
        </div>

        <input
          type="email"
          placeholder="Email kamu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEmailLogin();
          }}
          style={{
            padding: 13,
            width: "100%",
            marginBottom: 12,
            borderRadius: 12,
            border: "1px solid #334155",
            background: "#020617",
            color: "white",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleEmailLogin}
          disabled={loadingEmail || cooldown > 0}
          style={{
            width: "100%",
            padding: 13,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            border: "none",
            borderRadius: 12,
            cursor: loadingEmail || cooldown > 0 ? "not-allowed" : "pointer",
            opacity: loadingEmail || cooldown > 0 ? 0.6 : 1,
            fontWeight: "bold",
            fontSize: 15,
          }}
        >
          {loadingEmail ? "Mengirim..." : cooldown > 0 ? `Tunggu ${cooldown}s` : "Kirim Link Login"}
        </button>

        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.55 }}>
          Disarankan pakai Google Login agar tidak perlu buka email dan tidak kena limit OTP.
        </p>
      </div>
    </main>
  );
}

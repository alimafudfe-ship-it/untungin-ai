"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    let mounted = true;

    async function redirectIfLoggedIn() {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session?.user) router.replace(nextPath);
    }

    redirectIfLoggedIn();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        router.replace(nextPath);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [nextPath, router]);

  async function loginWithGoogle() {
    setErrorMessage("");
    setMessage("");
    setLoadingGoogle(true);

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoadingGoogle(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Masukkan email dulu.");
      return;
    }

    setLoadingEmail(true);

    const origin = window.location.origin;
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo },
    });

    if (error) setErrorMessage(error.message);
    else setMessage("Link login sudah dikirim. Cek inbox/spam email kamu.");

    setLoadingEmail(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        background:
          "radial-gradient(circle at 28% 18%, rgba(34,197,94,0.24), transparent 30%), linear-gradient(135deg, #020617 0%, #030712 55%, #000 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 28,
          padding: 26,
          background: "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(34,197,94,0.16)",
            color: "#86efac",
            fontWeight: 900,
            marginBottom: 18,
          }}
        >
          Untungin.ai
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Masuk ke Dashboard</h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.7, marginTop: 0 }}>
          Login untuk menyimpan data produk, cek profit, dan aktivasi PRO.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loadingGoogle}
          style={{
            width: "100%",
            padding: "15px 18px",
            borderRadius: 14,
            border: "none",
            cursor: loadingGoogle ? "not-allowed" : "pointer",
            fontWeight: 900,
            fontSize: 15,
            opacity: loadingGoogle ? 0.75 : 1,
          }}
        >
          {loadingGoogle ? "Menghubungkan Google..." : "🔐 Login dengan Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "#64748b", fontSize: 13 }}>
          <div style={{ height: 1, background: "#1f2937", flex: 1 }} />
          atau login via email
          <div style={{ height: 1, background: "#1f2937", flex: 1 }} />
        </div>

        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            placeholder="Email kamu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "15px 16px",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "rgba(2,6,23,0.74)",
              color: "white",
              outline: "none",
              fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={loadingEmail}
            style={{
              padding: "15px 18px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              cursor: loadingEmail ? "not-allowed" : "pointer",
              fontWeight: 900,
              fontSize: 15,
              opacity: loadingEmail ? 0.75 : 1,
            }}
          >
            {loadingEmail ? "Mengirim..." : "Kirim Link Login"}
          </button>
        </form>

        {message && <p style={{ color: "#86efac", fontSize: 13, lineHeight: 1.6 }}>{message}</p>}
        {errorMessage && <p style={{ color: "#fca5a5", fontSize: 13, lineHeight: 1.6 }}>{errorMessage}</p>}

        <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.7, marginBottom: 0 }}>
          Disarankan pakai Google Login agar tidak perlu buka email dan tidak kena limit OTP.
        </p>
      </section>
    </main>
  );
}

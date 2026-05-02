"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const nextPath = searchParams.get("next") || "/";
  const urlError = searchParams.get("error") || "";

  useEffect(() => {
    if (urlError) setErrorMessage(urlError);
  }, [urlError]);

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
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage("Link login sudah dikirim. Cek email kamu.");
    }

    setLoadingEmail(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,197,94,0.28), transparent 35%), linear-gradient(135deg, #020617 0%, #030712 60%, #000 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(15,23,42,0.92)",
          border: "1px solid rgba(148,163,184,0.16)",
          borderRadius: 28,
          padding: 28,
          boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(34,197,94,0.14)",
            color: "#22c55e",
            fontWeight: 900,
            marginBottom: 20,
          }}
        >
          Untungin.ai
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Masuk ke Dashboard</h1>
        <p style={{ margin: "0 0 22px", color: "#cbd5e1", lineHeight: 1.6 }}>
          Login untuk menyimpan data produk, cek profit, dan aktivasi PRO.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loadingGoogle}
          style={{
            width: "100%",
            padding: "15px 16px",
            borderRadius: 16,
            border: "none",
            background: "white",
            color: "#111827",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loadingGoogle ? "Membuka Google..." : "🔐 Login dengan Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "#64748b", fontSize: 13 }}>
          <div style={{ height: 1, background: "rgba(148,163,184,0.18)", flex: 1 }} />
          atau login via email
          <div style={{ height: 1, background: "rgba(148,163,184,0.18)", flex: 1 }} />
        </div>

        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email kamu"
            style={{
              width: "100%",
              padding: "15px 16px",
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.22)",
              background: "rgba(2,6,23,0.74)",
              color: "white",
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loadingEmail}
            style={{
              width: "100%",
              padding: "15px 16px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #14b8a6)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {loadingEmail ? "Mengirim..." : "Kirim Link Login"}
          </button>
        </form>

        {message && <p style={{ color: "#86efac", fontSize: 13 }}>{message}</p>}
        {errorMessage && <p style={{ color: "#fca5a5", fontSize: 13 }}>{errorMessage}</p>}

        <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>
          Disarankan pakai Google Login agar tidak perlu buka email dan tidak kena limit OTP.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

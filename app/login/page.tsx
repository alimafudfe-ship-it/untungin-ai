"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

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
      if (mounted && data.session?.user) {
        router.replace(nextPath);
      }
    }

    redirectIfLoggedIn();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          session?.user
        ) {
          router.replace(nextPath);
        }
      }
    );

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

  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
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
        <h1>Login</h1>

        <button onClick={loginWithGoogle} disabled={loadingGoogle}>
          {loadingGoogle ? "Loading..." : "Login Google"}
        </button>

        <form onSubmit={sendMagicLink}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <button type="submit">
            {loadingEmail ? "Loading..." : "Login Email"}
          </button>
        </form>

        {message && <p>{message}</p>}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
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

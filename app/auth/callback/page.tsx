"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      const next = searchParams.get("next") || "/";
      const code = searchParams.get("code");

      if (!code) {
        router.replace("/login?error=Kode login Google tidak ditemukan");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!active) return;

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace(next);
    }

    void finishLogin();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020617",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <p>Menyelesaikan login...</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}

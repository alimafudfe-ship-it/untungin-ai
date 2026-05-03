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

      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionData.session?.user) {
        router.replace(next);
        return;
      }

      const hasCode = window.location.search.includes("code=");
      if (hasCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!active) return;

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
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
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            border: "4px solid #064e3b",
            borderTopColor: "#22c55e",
            margin: "0 auto 16px",
          }}
        />
        <p>Menyelesaikan login...</p>
      </div>
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

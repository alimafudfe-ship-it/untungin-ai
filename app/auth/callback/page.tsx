"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function finishLogin() {
      const code = searchParams.get("code");
      const error = searchParams.get("error_description") || searchParams.get("error");

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        router.replace("/login?error=Callback tidak menerima kode dari Google");
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`);
        return;
      }

      router.replace("/");
    }

    void finishLogin();
  }, [router, searchParams]);

  return <p style={{ color: "white" }}>Menyelesaikan login...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}

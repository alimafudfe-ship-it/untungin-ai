"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      await supabase.auth.getSession();
      router.replace("/");
    }

    finishLogin();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial",
      }}
    >
      Sedang memproses login...
    </main>
  );
}
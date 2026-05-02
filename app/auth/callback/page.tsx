"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          router.replace("/");
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error(error);
        router.replace("/login");
      }
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

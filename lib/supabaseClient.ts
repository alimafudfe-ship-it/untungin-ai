import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv && typeof window !== "undefined") {
  console.warn("Supabase ENV belum diset. App berjalan dalam mode demo sampai NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY diisi.");
}

export const supabase: any = createClient(
  hasSupabaseEnv ? supabaseUrl : "https://demo.supabase.co",
  hasSupabaseEnv ? supabaseAnonKey : "demo-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError = hasSupabaseEnv
  ? null
  : "Supabase ENV belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di Vercel sebelum app dipakai.";

if (!hasSupabaseEnv && typeof window !== "undefined") {
  console.error(supabaseConfigError);
}

export const supabase: any = createClient(
  hasSupabaseEnv ? supabaseUrl : "https://example.supabase.co",
  hasSupabaseEnv ? supabaseAnonKey : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

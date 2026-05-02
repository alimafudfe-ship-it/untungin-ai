import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase ENV belum lengkap.");
}

const createSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: ReturnType<typeof createSupabaseClient> | undefined;
}

const supabaseClient =
  globalThis.supabaseClient ?? createSupabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.supabaseClient = supabaseClient;
}

export const supabase: any = supabaseClient;

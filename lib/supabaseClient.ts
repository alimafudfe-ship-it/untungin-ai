
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const hasSupabaseEnv =

  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("example.supabase.co");

export const supabaseConfigError = hasSupabaseEnv
  ? null
  : "Supabase environment variables are missing or invalid.";

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function safeSupabaseQuery(table: string) {
  try {
    if (!supabase) {
      return {
        data: [],
        error: null,
        fallback: true,
      };
    }

    const result = await supabase.from(table).select("*").limit(50);

    return {
      data: result.data || [],
      error: result.error || null,
      fallback: false,
    };
  } catch (err) {
    return {
      data: [],
      error: err,
      fallback: true,
    };
  }
}

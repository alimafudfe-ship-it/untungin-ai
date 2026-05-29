import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("example.supabase.co");

function buildClient() {
  if (!isSupabaseConfigured) return null;

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

export const supabase = buildClient();

export const supabaseAdmin = supabase;

export const browserClient = supabase;

export const serverClient = supabase;

export const createBrowserClient = () => supabase;

export const createServerClient = () => supabase;

export default supabase;

export async function safeSupabaseQuery(table: string) {
  try {
    if (!supabase) {
      return {
        data: [],
        error: null,
        fallback: true,
      };
    }

    const result = await supabase
      .from(table)
      .select("*")
      .limit(50);

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
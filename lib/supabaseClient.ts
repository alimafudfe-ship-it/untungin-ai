import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("example.supabase.co");

<<<<<<< HEAD
function buildClient() {
=======
function createSafeClient() {
>>>>>>> b6084b2ca334071d963f988e12dcfcfecd9cf5e9
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

<<<<<<< HEAD
export const supabase = buildClient();

export const supabaseAdmin = supabase;

export const browserClient = supabase;

export const serverClient = supabase;

export const createBrowserClient = () => supabase;

export const createServerClient = () => supabase;

export default supabase;
=======
export const supabase = createSafeClient();

export const supabaseAdmin = supabase;

export const createBrowserClient = () => supabase;

export const createServerClient = () => supabase;
>>>>>>> b6084b2ca334071d963f988e12dcfcfecd9cf5e9

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
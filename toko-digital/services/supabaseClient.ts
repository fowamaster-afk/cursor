import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client singelton - diinisialisasi sekali dan direu pakai
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

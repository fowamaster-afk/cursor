import { supabase } from "./supabaseClient";

/**
 * Mendapatkan user yang sedang login saat ini.
 * Mengembalikan objek user (memiliki `id`) atau null jika belum login.
 */
export async function getCurrentUser(): Promise<{ id: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  getAuthCookieOptions,
} from "@/services/supabaseConfig";

/**
 * utils/supabase/server.ts
 * ------------------------
 * Membuat **Supabase Server Client** — pola resmi dokumentasi Supabase SSR
 * (`createServerClient` dari `@supabase/ssr`).
 *
 * Client ini membaca & menulis cookie sesi lewat `cookies()` dari
 * `next/headers`, sehingga operasi seperti `exchangeCodeForSession` dan
 * penyimpanan sesi dapat dijalankan di Server Component / Route Handler
 * (bukan di browser).
 *
 * Atribut cookie (termasuk `domain` lintas sub-domain untuk SSO) diambil dari
 * `getAuthCookieOptions()` agar konsisten dengan browser client & Proxy.
 *
 * Catatan: Buat instance baru per-request; jangan pernah membagikan client
 * antar request.
 */

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `cookies().set` tidak diizinkan dipanggil dari Server Component.
          // Refresh token ditangani oleh Proxy (middleware); abaikan di sini.
        }
      },
    },
    cookieOptions: getAuthCookieOptions(),
  });
}

/**
 * Mengambil pengguna aktif dari sesi cookie (untuk verifikasi otorisasi).
 *
 * @returns `User` bila login, atau `null` bila tidak ada sesi valid.
 * @throws Tidak melempar; kegagalan verifikasi token dianggap `null`.
 */
export async function getServerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

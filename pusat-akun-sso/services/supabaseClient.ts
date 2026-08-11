import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getAuthCookieOptions } from "@/services/supabaseConfig";

/**
 * services/supabaseClient.ts
 * --------------------------
 * Inisialisasi client Supabase untuk **browser** (Client Side).
 *
 * KRUSIAL (SSO): Penyimpanan sesi Auth memakai **Cookies** (bukan localStorage
 * bawaan) melalui helper `createBrowserClient` dari `@supabase/ssr`.
 * Atribut cookie (termasuk `domain` lintas sub-domain) diatur lewat
 * `getAuthCookieOptions()` agar sesi dibagikan antar sub-domain aplikasi.
 *
 * Digunakan oleh `authService` dan hook `useAuth`.
 */

/**
 * Instance tunggal Supabase untuk konteks browser.
 * Sesuai panduan `@supabase/ssr`, browser client menangani penulisan/pembacaan
 * cookie auth secara otomatis (termasuk refresh token) menggunakan `cookieOptions`.
 */
export const supabase: SupabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  cookieOptions: getAuthCookieOptions(),
});

export default supabase;

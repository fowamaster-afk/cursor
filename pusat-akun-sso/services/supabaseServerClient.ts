import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getAuthCookieOptions } from "@/services/supabaseConfig";

/**
 * services/supabaseServerClient.ts
 * --------------------------------
 * Membuat client Supabase untuk **Server Component / Server Function**.
 * Membaca (dan bila memungkinkan menulis) cookie auth melalui `cookies()`
 * dari `next/headers`, dengan atribut cookie yang sama seperti client browser
 * (`getAuthCookieOptions`) agar sesi SSO ditegakkan lintas sub-domain.
 *
 * Catatan: Setiap panggilan membuat instance baru per-request (sesuai rekomendasi
 * `@supabase/ssr`) — jangan pernah membagikan client di antara request.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
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
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

import type { CookieOptions } from "@supabase/ssr";

/**
 * services/supabaseConfig.ts
 * --------------------------
 * Konfigurasi bersama untuk Supabase yang dipakai oleh client browser,
 * client server, dan Proxy (middleware). Menyamakan nilai env vars agar
 * seluruh konteks memakai kredensial dan atribut cookie yang sama (DRY).
 */

const isProduction = process.env.NODE_ENV === "production";

function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    throw new Error(
      `[Supabase] Environment variable "${name}" belum diatur. Periksa file .env.local`
    );
  }
}

assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Kredensial Supabase — sudah terjamin non-null setelah `assertEnv`.
 * Nilai tersalin ke `const` agar type-script tahu type-nya `string` (bukan
 * `string | undefined`) saat diimpor dari modul lain.
 */
export const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Domain cookie auth.
 *
 * - Jika `AUTH_COOKIE_DOMAIN` diatur → dipakai apa adanya, mis. `.domain-anda.com`
 *   untuk berbagi sesi antar sub-domain (`app.`, `toko.`, dst.).
 * - Jika TIDAK diatur → cookie **host-only** (tanpa atribut `Domain`): berlaku
 *   hanya untuk host yang meng-set-nya. Ini mencegah cookie ditolak browser
 *   karena domain salah (fallback lama `.domain-anda.com` TIDAK valid untuk
 *   host `*.vercel.app`) sekaligus menghindari risiko *public-suffix* cookies
 *   (mis. `Domain=.vercel.app` akan ikut terkirim ke semua app Vercel lain).
 */
export function getAuthCookieDomain(): string | undefined {
  if (process.env.AUTH_COOKIE_DOMAIN) {
    return process.env.AUTH_COOKIE_DOMAIN;
  }
  return undefined; // host-only cookie — aman untuk semua host / deployment
}

/**
 * Opsi cookie auth yang dipakai pada penyimpanan sesi (storage cookies).
 *
 * `sameSite: "lax"` di dev menjaga keamanan; `sameSite: "none"` + `secure`
 * di produksi memastikan cookie (mis. `code_verifier` PKCE) tetap terkirim
 * saat navigasi balik dari provider OAuth (Google).
 */
export function getAuthCookieOptions(): CookieOptions {
  return {
    path: "/",
    domain: getAuthCookieDomain(),
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  };
}

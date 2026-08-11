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
 * Domain cookie auth lintas sub-domain (SSO).
 *
 * - Development:  `localhost`  → sesi dibagikan antar sub-domain `*.localhost`.
 * - Production:   `.domain-anda.com` → sesi dibagikan antar sub-domain
 *   `app.domain-anda.com`, `toko.domain-anda.com`, dst.
 *
 * Bisa di-override via environment variable `AUTH_COOKIE_DOMAIN`.
 */
export function getAuthCookieDomain(): string {
  if (process.env.AUTH_COOKIE_DOMAIN) {
    return process.env.AUTH_COOKIE_DOMAIN;
  }
  return isProduction ? ".domain-anda.com" : "localhost";
}

/**
 * Opsi cookie auth yang dipakai pada penyimpanan sesi (storage cookies).
 *
 * `domain` membuat cookie berlaku lintas sub-domain sesuai konfigurasi SSO.
 * `sameSite: "lax"` menjaga keamanan namun tetap memungkinkan pengiriman pada
 * navigasi tingkat atas dari sub-domain lain saat proses SSO.
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

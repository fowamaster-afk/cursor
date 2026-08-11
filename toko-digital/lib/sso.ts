/**
 * lib/sso.ts
 * ----------
 * Helper integrasi klien (toko-digital) dengan Pusat Akun SSO.
 *
 * Base URL halaman login SSO dibaca dari env `NEXT_PUBLIC_SSO_URL`
 * (contoh produksi: https://pusat-akun-sso.vercel.app). Jika belum
 * disetel, fallback ke http://localhost:3000 untuk development.
 *
 * SEMUA fungsi di file ini hanya boleh dipanggil dari sisi client
 * (misal di dalam event handler onClick), sehingga aman dari error
 * "window is not defined" saat SSR / static prerender.
 */

/** Membaca base URL halaman login SSO dari env (dengan fallback dev). */
export function getSsoBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SSO_URL ?? "http://localhost:3000";
}

/**
 * Membangun URL lengkap halaman login Pusat Akun SSO.
 *
 * @param source Identitas aplikasi asal (mis. "toko", "favorit").
 * @param next   URL tujuan setelah login berhasil (dinamis dari client,
 *               misal `window.location.href`). Wajib disertakan agar SSO
 *               bisa mengembalikan user ke halaman asal.
 * @returns URL absolut login SSO; query `source` & `next` otomatis di-encode.
 */
export function buildSsoLoginUrl(source: string, next?: string): string {
  const url = new URL(getSsoBaseUrl());
  url.searchParams.set("source", source);
  if (next) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

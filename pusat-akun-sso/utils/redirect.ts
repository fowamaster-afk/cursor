/**
 * utils/redirect.ts
 * -----------------
 * Helper "Redirect Cerdas / Smart Redirect" untuk SSO.
 * Setelah login berhasil, user diarahkan ke URL tujuan dari query `?next=`
 * (bisa path internal atau URL pilhan dari sub-domain) — dengan tetap
 * menjaga keamanan dari risiko *open redirect*.
 */

/** Domain utama aplikasi untuk validasi lintas sub-domain. */
const APP_HOST_SUFFIX = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";

const PROTOCOL_WHITELIST = ["http:", "https:"];

/**
 * Menentukan apakah URL tujuan `next` dianggap aman untuk redirect.
 *
 * Kriteria aman:
 *   1. Path relatif dalam origin yang sama (diawali `/`, bukan `//`).
 *   2. URL absolut dengan protokol `http/https` yang hostnya sama dengan
 *      origin saat ini, atau merupakan sub-domain dari `APP_HOST_SUFFIX`.
 *
 * Nilai selain itu dianggap tidak dapat dipercaya.
 */
export function isSafeNextUrl(next: string, currentOrigin: string): boolean {
  if (!next || next.startsWith("//")) return false;

  // Path internal (relative) → aman.
  if (next.startsWith("/")) return true;

  // URL absolut → validasi host.
  try {
    const target = new URL(next.endsWith("/") ? next : next, currentOrigin);
    if (!PROTOCOL_WHITELIST.includes(target.protocol)) return false;

    const host = target.hostname.toLowerCase();
    const currentHost = new URL(currentOrigin).hostname.toLowerCase();

    // Sama persis dengan origin saat ini.
    if (host === currentHost) return true;

    // Sub-domain dari domain aplikasi (mis. `toko.localhost`, `app.domain-anda.com`).
    if (host.endsWith(`.${APP_HOST_SUFFIX.toLowerCase()}`)) return true;
    if (host === APP_HOST_SUFFIX.toLowerCase()) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Mengambil nilai `?next=` yang valid (aman) dari query string.
 *
 * @param next            Nilai mentah dari `searchParams.get('next')`.
 * @param currentOrigin   Origin/URL saat ini sebagai basis resolusi.
 * @returns URL tujuan yang aman, atau `null` bila tidak ada / tidak aman.
 */
export function getSafeNextUrl(next: string | null | undefined, currentOrigin: string): string | null {
  if (!next) return null;
  return isSafeNextUrl(next, currentOrigin) ? next : null;
}

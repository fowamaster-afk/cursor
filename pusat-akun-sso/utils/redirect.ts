/**
 * utils/redirect.ts
 * -----------------
 * Helper "Redirect Cerdas / Smart Redirect" untuk SSO.
 * Setelah login berhasil, user diarahkan ke URL tujuan dari query `?next=`
 * (bisa path internal atau URL pilihan dari sub-domain) — dengan tetap
 * menjaga keamanan dari risiko *open redirect*.
 */

/**
 * Domain utama aplikasi untuk validasi lintas sub-domain.
 * Dapat di-override via env `NEXT_PUBLIC_APP_DOMAIN` (mis. "vercel.app"
 * atau domain custom Anda). Bila TIDAK disetel, akan diturunkan otomatis
 * dari host aplikasi saat ini (2 label terakhir), misalnya:
 *   - "pusat-akun-sso.vercel.app"  -> "vercel.app"   (produksi Vercel)
 *   - "localhost"                  -> "localhost"    (development)
 * Dengan begitu redirect ke sub-domain lain (mis. "toko-digital.vercel.app")
 * tetap diperbolehkan tanpa konfigurasi tambahan.
 */
const APP_HOST_SUFFIX = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "";

const PROTOCOL_WHITELIST = ["http:", "https:"];

/**
 * Menghitung akhiran host yang dipercaya untuk validasi sub-domain.
 * Prioritas: env `NEXT_PUBLIC_APP_DOMAIN` -> turunan otomatis dari host saat ini.
 */
function getTrustedHostSuffix(currentHost: string): string {
  if (APP_HOST_SUFFIX) return APP_HOST_SUFFIX.toLowerCase();

  const labels = currentHost.split(".");
  // "localhost" / "vercel.app" -> langsung pakai host tersebut.
  if (labels.length <= 2) return currentHost;
  // "pusat-akun-sso.vercel.app" -> "vercel.app"
  return labels.slice(-2).join(".");
}

/**
 * Menentukan apakah URL tujuan `next` dianggap aman untuk redirect.
 *
 * Kriteria aman:
 *   1. Path relatif dalam origin yang sama (diawali `/`, bukan `//`).
 *   2. URL absolut dengan protokol `http/https` yang hostnya sama dengan
 *      origin saat ini, atau merupakan sub-domain dari domain yang dipercaya
 *      (`NEXT_PUBLIC_APP_DOMAIN` atau turunan otomatis dari host saat ini).
 *
 * Nilai selain itu dianggap tidak dapat dipercaya.
 */
export function isSafeNextUrl(next: string, currentOrigin: string): boolean {
  if (!next || next.startsWith("//")) return false;

  // Path internal (relative) → aman.
  if (next.startsWith("/")) return true;

  // URL absolut → validasi host.
  try {
    const target = new URL(next, currentOrigin);
    if (!PROTOCOL_WHITELIST.includes(target.protocol)) return false;

    const host = target.hostname.toLowerCase();
    const currentHost = new URL(currentOrigin).hostname.toLowerCase();

    // Sama persis dengan origin saat ini.
    if (host === currentHost) return true;

    // Sub-domain dari domain aplikasi (mis. `toko-digital.vercel.app`
    // saat SSO di `pusat-akun-sso.vercel.app`, atau `toko.localhost`).
    const suffix = getTrustedHostSuffix(currentHost);
    if (host === suffix) return true;
    if (host.endsWith(`.${suffix}`)) return true;

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
export function getSafeNextUrl(
  next: string | null | undefined,
  currentOrigin: string
): string | null {
  if (!next) return null;
  return isSafeNextUrl(next, currentOrigin) ? next : null;
}


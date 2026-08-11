import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * app/auth/callback/route.ts
 * --------------------------
 * Route Handler (GET) untuk callback auth Supabase — praktik terbaik SSR.
 *
 * Setelah user menyelesaikan login (OAuth Google / magic link / dll), Supabase
 * mengarahkan browser ke rute ini dengan query:
 *
 *     /auth/callback?code=<PKCE_CODE>&next=<URL_TUJUAN>
 *
 * Tugas rute ini:
 *   1. Membaca `code` dan `next` dari searchParams.
 *   2. Menukar `code` menjadi sesi aktif memakai Supabase Server Client
 *      (`utils/supabase/server.ts`) — sesi ditulis ke cookie via `cookies()`.
 *   3. Redirect ke `next` bila pertukaran berhasil, atau fallback ke origin.
 *   4. Gagal / tanpa `code` → kembali ke halaman login dengan penanda error.
 */

/**
 * Minimal guard keamanan sebelum redirect ke URL eksternal:
 * tolak skema berbahaya (`javascript:`, `data:`) dan URL protocol-relative
 * (`//...`). Path relatif (`/...`) selalu diizinkan.
 */
function isSafeRedirectTarget(value: string): boolean {
  if (!value || value.startsWith("//")) return false;
  try {
    const parsed = new URL(value, "https://placeholder.local");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Men-decode `next` yang mungkin di-encode dua kali (defensif). */
function decodeNext(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Mengandung `%` tidak valid → kembalikan nilai aslinya.
    return value;
  }
}

/**
 * Respons yang menulis cookie auth TIDAK boleh di-cache oleh CDN / proxy
 * (sesuai panduan `@supabase/ssr`), agar sesi satu user tidak tersaji ke
 * user lain.
 */
function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Pertukaran berhasil → arahkan ke tujuan `next` bila valid.
      const next = rawNext ? decodeNext(rawNext) : null;

      if (next && isSafeRedirectTarget(next)) {
        const target = new URL(next, origin);

        // Path internal → sesi dibagikan via cookie (sama origin); redirect
        // langsung tanpa token.
        if (!next.startsWith("/")) {
          // Lintas origin → SSO Bridge: teruskan token sesi agar aplikasi
          // tujuan (mis. toko) bisa membangun sesinya sendiri via
          // `supabase.auth.setSession()` (lihat SsoReceiver di toko-digital).
          if (data.session?.access_token) {
            target.searchParams.set("access_token", data.session.access_token);
          }
          if (data.session?.refresh_token) {
            target.searchParams.set("refresh_token", data.session.refresh_token);
          }
        }

        return withNoCache(NextResponse.redirect(target));
      }

      // Tanpa `next` yang valid → fallback ke halaman utama (origin).
      return withNoCache(NextResponse.redirect(origin));
    }
  }

  // Gagal / tanpa kode → kembali ke login dengan penanda error.
  const errorUrl = new URL("/", origin);
  errorUrl.searchParams.set("auth_error", "exchange_failed");
  return NextResponse.redirect(errorUrl);
}


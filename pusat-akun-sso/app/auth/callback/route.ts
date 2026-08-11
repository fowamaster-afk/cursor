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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Pertukaran berhasil → arahkan ke tujuan `next` bila valid.
      const next = rawNext ? decodeNext(rawNext) : null;

      if (next && isSafeRedirectTarget(next)) {
        // `new URL(next, origin)` menangani path relatif maupun URL absolut.
        return NextResponse.redirect(new URL(next, origin));
      }

      // Tanpa `next` yang valid → fallback ke halaman utama (origin).
      return NextResponse.redirect(origin);
    }
  }

  // Gagal / tanpa kode → kembali ke login dengan penanda error.
  const errorUrl = new URL("/", origin);
  errorUrl.searchParams.set("auth_error", "exchange_failed");
  return NextResponse.redirect(errorUrl);
}

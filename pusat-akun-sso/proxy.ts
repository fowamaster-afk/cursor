import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getAuthCookieOptions } from "@/services/supabaseConfig";

/**
 * proxy.ts (sebelumnya `middleware.ts`)
 * -------------------------------------
 * Pada Next.js 16, konvensi `middleware.js` diganti menjadi `proxy.js`.
 * Menjalankan kode di server SEBELUM request selesai, berguna untuk
 * otorisasi level rute.
 *
 * Tugas di sini:
 *   1. Menyegarkan sesi (token refresh) bila token expired / mendekati habis.
 *   2. Melindungi rute `/dashboard`: jika user BELUM login, lempar ke `/`
 *      (membawa `?next=` agar setelah login bisa kembali ke dashboard).
 */
export async function proxy(request: NextRequest) {
  // Objek respon awal; nantinya di-isi cookie sesi hasil refresh.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Rebuild respon setelah cookie dimutasi pada request sinkron terbaru.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
    cookieOptions: getAuthCookieOptions(),
  });

  // Memulai verifikasi sesi → juga memicu refresh token bila perlu.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Lindungi rute /dashboard.
  if (pathname.startsWith("/dashboard") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    // Simpan tujuan asal agar redirect cerdas (`?next=`) bisa mengembalikan user.
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Jalankan Proxy pada selain aset statis agar halaman dapat diproteksi
     * tanpa menghalangi CSS, JS, gambar, fonts, dsb.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$).*)",
  ],
};

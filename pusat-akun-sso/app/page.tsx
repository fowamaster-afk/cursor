import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import AuthCallbackHandler from "@/components/AuthCallbackHandler";

/**
 * app/page.tsx
 * -------------
 * Halaman utama (landing / login SSO).
 *
 * Dua mode render:
 *   - Ada `?code=` di URL → render `AuthCallbackHandler` untuk menukar kode
 *     otorisasi PKCE dari Supabase lalu redirect otomatis ke tujuan `?next=`.
 *   - Tanpa `code`        → render `LoginForm` (form masuk / daftar).
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const hasCallbackCode = typeof params.code === "string" && params.code.length > 0;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Lapisan 1: Video Hujan Kaca */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/hujan.mp4" type="video/mp4" />
      </video>

      {/* Lapisan 2: Overlay gelap agar form tetap terbaca */}
      <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>

      {/* Lapisan 3: Kotak Form Glassmorphism / status callback */}
      <div className="relative z-20 w-full max-w-md p-4">
        <Suspense
          fallback={
            <div className="flex h-48 w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            </div>
          }
        >
          {hasCallbackCode ? <AuthCallbackHandler /> : <LoginForm />}
        </Suspense>
      </div>
    </main>
  );
}

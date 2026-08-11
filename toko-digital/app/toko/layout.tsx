"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/services/authService";
import TokoNavigation from "./TokoNavigation";

// URL SSO tujuan (port 3000)
const SSO_LOGIN_URL = "http://localhost:3000/?source=toko";

/**
 * Pengaman auth untuk area toko (Client Component).
 *
 * Alasan dijadikan Client Component:
 * - `supabase.auth.getSession()` membaca dari localStorage (browser),
 *   sehingga TIDAK dapat dipanggil reliabel di Server Component.
 * - Menghindari infinite redirect yang terjadi jika sesi dicek terlalu
 *   cepat sebelum <SsoReceiver> di root layout selesai menyimpan token.
 */
function TokoAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Status UI
  const [status, setStatus] = useState<"checking" | "ready" | "redirecting">(
    "checking"
  );
  // Menyimpan URL tujuan saat ini untuk menghindari redirect berulang
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const redirectTargetRef = useRef<string | null>(null);

  // Konstruksi URL lengkap saat ini (path + query)
  const fullUrl = `${pathname}?${searchParams.toString()}`;

  /**
   * Mengarahkan ke halaman login SSO (port 3000).
   * Hanya sekali — dicegah dengan ref agar tidak memicu loop.
   */
  const goToLogin = useCallback(() => {
    const next = encodeURIComponent(
      typeof window !== "undefined" ? window.location.href : fullUrl
    );
    const target = `${SSO_LOGIN_URL}&next=${next}`;

    // Cegah redirect berulang ke URL yang sama
    if (redirectTargetRef.current === target) return;
    redirectTargetRef.current = target;

    setStatus("redirecting");
    setRedirectingTo(target);
  }, [fullUrl]);

  /**
   * Mengecek sesi. Jika URL masih memuat token, tunggu sebentar lalu cek
   * ulang (polling) hingga <SsoReceiver> selesai menyimpan sesi & menghapus
   * token. Baru redirect ke SSO jika benar-benar tidak ada sesi.
   */
  useEffect(() => {
    let active = true;
    const maxAttempts = 30; // ~6 detik (200ms x 30) sebelum memutuskan redirect
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verify = async () => {
      // Masih ada token di URL -> SsoReceiver sedang memproses. Tunggu.
      if (searchParams.get("access_token")) {
        attempt += 1;
        if (attempt >= maxAttempts) {
          // Amannya: token membandel, coba cek sesi langsung
          return finishCheck();
        }
        timer = setTimeout(verify, 200);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!active) return;

        if (user) {
          setStatus("ready");
          return;
        }

        // Tidak ada sesi -> login
        goToLogin();
      } catch (err) {
        console.error("Gagal memeriksa sesi:", err);
        if (active) goToLogin();
      }
    };

    const finishCheck = async () => {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        if (user) setStatus("ready");
        else goToLogin();
      } catch {
        if (active) goToLogin();
      }
    };

    verify();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [searchParams, goToLogin]);

  // Saat target redirect baru diset, lakukan navigasi setelah render ringan
  useEffect(() => {
    if (status === "redirecting" && redirectingTo) {
      window.location.href = redirectingTo;
    }
  }, [status, redirectingTo]);

  // Tampilkan layar loading selama pengecekan berlangsung
  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">
            {status === "redirecting"
              ? "Mengalihkan ke halaman login..."
              : "Memeriksa sesi login..."}
          </p>
        </div>
      </div>
    );
  }

  // Sesi valid -> render layout toko (sidebar + main)
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar toko (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <TokoNavigation />
      </aside>

      {/* Konten utama */}
      <div className="flex flex-1 flex-col">
        {/* Topbar untuk layar kecil */}
        <header className="border-b border-gray-200 bg-white md:hidden">
          <TokoNavigation />
        </header>

        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

/**
 * Layout terproteksi untuk area toko.
 * Dibungkus <Suspense> karena TokoAuthGuard menggunakan useSearchParams.
 */
export default function tokoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <TokoAuthGuard>{children}</TokoAuthGuard>
    </Suspense>
  );
}

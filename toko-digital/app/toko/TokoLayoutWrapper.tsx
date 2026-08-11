"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/services/authService";
import TokoNavigation from "./TokoNavigation";

// URL SSO tujuan (port 3000)
const SSO_LOGIN_URL = "http://localhost:3000/?source=toko";

/** Judul halaman yang tampil di header mobile, dipetakan dari pathname. */
const PAGE_TITLES: Record<string, string> = {
  "/toko": "Dashboard",
  "/toko/products": "Produk Saya",
  "/toko/edit": "Produk Saya",
  "/toko/upload": "Tambah Produk",
  "/toko/settings": "Pengaturan Toko",
};

/** Mencari judul halaman berdasarkan pathname aktif (fallback: "Dashboard"). */
function getPageTitle(pathname: string): string {
  for (const [href, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return title;
  }
  return "Dashboard";
}

/** Ikon hamburger (3 garis) untuk tombol buka menu mobile. */
function HamburgerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/** Ikon close (X) untuk tombol tutup menu mobile. */
function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

/**
 * Pembungkus layout area toko (Client Component).
 * - Guard auth: mengecek sesi Supabase & redirect ke SSO bila belum login.
 * - Merender sidebar desktop, header mobile (hamburger + judul), dan
 *   slide-over menu yang muncul dari kiri dengan animasi halus.
 */
export default function TokoLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Status UI guard auth
  const [status, setStatus] = useState<"checking" | "ready" | "redirecting">(
    "checking"
  );
  // Menyimpan URL tujuan saat ini untuk menghindari redirect berulang
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const redirectTargetRef = useRef<string | null>(null);

  // Status menu slide-over (mobile)
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Tutup slide-over otomatis saat layar naik ke ukuran desktop (md ke atas).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onMediaChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onMediaChange);
    return () => mq.removeEventListener("change", onMediaChange);
  }, []);

  // Kunci scroll body saat menu mobile terbuka agar konten tidak ikut menggulir.
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

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

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar toko (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <TokoNavigation />
      </aside>

      {/* Konten utama */}
      <div className="flex flex-1 flex-col">
        {/* Header mobile: judul halaman + tombol hamburger/close */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>

          <p className="text-base font-semibold text-gray-900">{pageTitle}</p>

          {/* Spacer agar judul tetap berada di tengah */}
          <span className="h-10 w-10" aria-hidden="true" />
        </header>

        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>

      {/* Slide-over menu (mobile) */}
      <div
        className={`fixed inset-0 z-30 md:hidden ${
          menuOpen ? "" : "pointer-events-none"
        }`}
        inert={!menuOpen}
        aria-hidden={!menuOpen}
      >
        {/* Overlay gelap - klik untuk menutup */}
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-gray-900/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel slide-over muncul dari kiri */}
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <TokoNavigation onNavigate={closeMenu} />
        </aside>
      </div>
    </div>
  );
}
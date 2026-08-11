"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

interface TokoNavigationProps {
  /**
   * Callback opsional yang dipanggil setiap kali sebuah tautan diklik.
   * Dipakai layout mobile (slide-over) agar menu otomatis tertutup setelah
   * pengguna memilih salah satu item navigasi.
   */
  onNavigate?: () => void;
}

/**
 * Daftar menu navigasi area toko (sidebar desktop & slide-over mobile).
 *
 * - `exact: true`  => aktif hanya saat pathname sama persis (mis. Dashboard).
 * - `exact: false` => aktif saat pathname diawali href, sehingga halaman turunan
 *                     (mis. /toko/edit/[id]) tetap menandai "Produk Saya" aktif.
 */
const MENU_ITEMS = [
  { label: "Dashboard", href: "/toko", exact: true },
  { label: "Produk Saya", href: "/toko/products", exact: false },
  { label: "Tambah Produk", href: "/toko/upload", exact: false },
  { label: "Pengaturan Toko", href: "/toko/settings", exact: false },
] as const;

/** Rute halaman utama toko (beranda publik), untuk tautan "Kembali". */
const HOME_HREF = "/";

/**
 * Menentukan apakah sebuah menu sedang aktif berdasarkan pathname saat ini.
 * - `exact`: hanya cocok jika pathname sama persis.
 * - non-exact: cocok jika pathname sama persis ATAU diawali `href + "/"`
 *   (menghindari /toko/products ikut menandai menu /toko/products* lain).
 */
function isMenuActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navigasi area toko (vertikal, cocok untuk sidebar desktop maupun slide-over).
 * Menandai menu aktif berdasarkan pathname saat ini.
 */
export default function TokoNavigation({ onNavigate }: TokoNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Panggil callback penutup menu (jika disediakan) setiap kali user menavigasi.
  const handleNavigate = () => {
    onNavigate?.();
  };

  /**
   * Logout dari area toko:
   * - `supabase.auth.signOut()` menghapus sesi & storage autentikasi.
   * - Kembali ke beranda publik, lalu `router.refresh()` agar Server
   *   Components di-render ulang (mode logged-out).
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onNavigate?.(); // tutup menu mobile bila sedang terbuka
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const linkClasses = (active: boolean) =>
    [
      "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5",
      "text-sm font-medium transition-all duration-150",
      "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1",
      active
        ? "bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
        : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700",
    ].join(" ");

  const menuLinks = MENU_ITEMS.map((item) => {
    const active = isMenuActive(pathname, item.href, item.exact);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavigate}
        aria-current={active ? "page" : undefined}
        className={linkClasses(active)}
      >
        {active && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
          />
        )}
        {item.label}
      </Link>
    );
  });

  return (
    <nav
      aria-label="Navigasi toko"
      className="flex h-full flex-col gap-1 overflow-y-auto p-4"
    >
      <div className="mb-3 px-2 pt-2">
        <p className="text-base font-bold text-gray-900">Toko Panel</p>
        <p className="mt-0.5 text-xs text-gray-400">Menu penjual</p>
      </div>

      {menuLinks}

      <div className="mt-auto">
        <div className="my-3 h-px bg-gray-200" aria-hidden="true" />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
        >
          <span aria-hidden="true">🚪</span>
          Keluar
        </button>
        <Link
          href={HOME_HREF}
          onClick={handleNavigate}
          className={linkClasses(false)}
        >
          <span aria-hidden="true">⬅️</span>
          Kembali ke Beranda
        </Link>
      </div>
    </nav>
  );
}

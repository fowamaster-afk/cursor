"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Ikon hati untuk menu Favorit. */
function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

/**
 * Navbar component - navigasi utama di atas layar.
 * Menampilkan tautan eksplisit Beranda, Favorit, & Dashboard toko
 * agar user tidak tersesat.
 */
export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Judul / Brand */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          Toko Digital
        </Link>

        {/* Menu utama (desktop) */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link href="/" className={linkClass(pathname === "/")}>
            Beranda
          </Link>
          <Link
            href="/favorit"
            className={linkClass(pathname.startsWith("/favorit"))}
          >
            <HeartIcon />
            Favorit
          </Link>
          <Link
            href="/toko"
            className={linkClass(pathname.startsWith("/toko"))}
          >
            Dashboard toko
          </Link>
        </div>

        {/* Tombol Masuk */}
        <a
          href="https://cursor-orpin-two.vercel.app/?source=toko&next=https://cursor-8uhu.vercel.app/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Masuk
        </a>
      </div>

      {/* Menu utama (mobile) */}
      <div className="flex gap-1 border-t border-gray-100 px-4 py-2 sm:hidden">
        <Link href="/" className={linkClass(pathname === "/")}>
          Beranda
        </Link>
        <Link
          href="/favorit"
          className={linkClass(pathname.startsWith("/favorit"))}
        >
          <HeartIcon />
          Favorit
        </Link>
        <Link
          href="/toko"
          className={linkClass(pathname.startsWith("/toko"))}
        >
          Dashboard toko
        </Link>
      </div>
    </nav>
  );
}

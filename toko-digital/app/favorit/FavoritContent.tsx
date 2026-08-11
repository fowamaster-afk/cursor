"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getCurrentUser } from "@/services/authService";
import { getUserFavorites } from "@/services/favoriteService";
import type { Product } from "@/types/product";

// URL SSO tujuan (port 3000) - sumber/fitur: favorit
const SSO_LOGIN_URL = "http://localhost:3000/?source=favorit";

/**
 * Konten halaman Koleksi Favorit (Client Component).
 *
 * Sesi Supabase tersimpan di localStorage browser, sehingga cek login &
 * pengambilan data favorit HARUS dilakukan di sisi client (pola yang sama
 * dengan area toko). Jika belum login, diarahkan ke halaman login SSO.
 */
export default function FavoritContent() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [status, setStatus] = useState<"checking" | "ready" | "redirecting">(
    "checking"
  );
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const redirectTargetRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const user = await getCurrentUser();
        if (!active) return;

        // Belum login -> siapkan redirect ke halaman login SSO (sekali saja).
        if (!user) {
          const next = encodeURIComponent(window.location.href);
          const target = `${SSO_LOGIN_URL}&next=${next}`;
          if (redirectTargetRef.current === target) return;
          redirectTargetRef.current = target;

          setStatus("redirecting");
          setRedirectingTo(target);
          return;
        }

        const items = await getUserFavorites();
        if (active) {
          setFavorites(items);
          setStatus("ready");
        }
      } catch (err) {
        console.error("Gagal memuat favorit:", err);
        if (active) setStatus("ready");
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  // Eksekusi redirect setelah render ringan (mencegah navigasi sebelum commit)
  useEffect(() => {
    if (status === "redirecting" && redirectingTo) {
      window.location.href = redirectingTo;
    }
  }, [status, redirectingTo]);

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Memeriksa sesi login...</p>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <p className="mt-8 text-center text-sm text-gray-500">
        Mengalihkan ke halaman login...
      </p>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">
          Belum ada barang di wishlist Anda
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Tekan tombol hati (❤️) pada produk untuk menyimpannya di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {favorites.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

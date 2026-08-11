"use client";

import { useEffect, useState } from "react";
import { checkIsFavorite, toggleFavorite } from "@/services/favoriteService";

interface FavoriteButtonProps {
  productId: string;
  /** Nilai awal favorit dari server (opsional). Jika tidak diberikan, dicek dari database. */
  initialIsFavorite?: boolean;
}

/**
 * FavoriteButton - tombol hati (wishlist) untuk produk.
 *
 * Posisinya `absolute`, sehingga pastikan parent memiliki class `relative`
 * (misalnya wadah gambar produk).
 */
export default function FavoriteButton({
  productId,
  initialIsFavorite,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite ?? false);
  const [checking, setChecking] = useState(initialIsFavorite === undefined);
  const [busy, setBusy] = useState(false);

  // Jika nilai awal tidak disediakan, cek status favorit dari database.
  useEffect(() => {
    if (initialIsFavorite !== undefined) return;

    let active = true;
    checkIsFavorite(productId)
      .then((fav) => {
        if (active) setIsFavorite(fav);
      })
      .catch((err) => console.error("Gagal memeriksa favorit:", err))
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [productId, initialIsFavorite]);

  /** Toggle favorit - diblokir saat sedang proses agar tidak bisa di-spam. */
  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await toggleFavorite(productId);
      setIsFavorite(next);
    } catch (err) {
      console.error("Gagal mengubah favorit:", err);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || checking;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}
      aria-pressed={isFavorite}
      title={isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}
      className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {checking ? (
        /* Spinner kecil saat pengecekan awal */
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500"
        />
      ) : isFavorite ? (
        /* Hati penuh (merah) */
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-red-500"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        /* Hati kosong (garis) */
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-gray-500"
        >
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )}
    </button>
  );
}

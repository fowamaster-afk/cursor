"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Jarak debounce sebelum URL diperbarui (ms). */
const DEBOUNCE_DELAY = 400;

/**
 * Inti SearchBar - input pencarian yang memperbarui URL `?q=...`.
 * Dikendalikan oleh URL Search Parameters agar hasil pencarian tetap
 * SEO-friendly serta bisa di-share / di-bookmark.
 */
function SearchBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sinkronkan nilai awal input dengan nilai q di URL saat ini
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pola resmi React "adjusting state when props change":
  // jika URL berubah dari luar (back/forward, tautan berbagi), ikuti nilainya.
  // Ditempatkan di render (bukan useEffect) agar tidak melanggar
  // react-hooks/set-state-in-effect.
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  /**
   * Memperbarui URL dengan parameter q. Parameter lain (mis. category)
   * dipertahankan agar filter yang sudah ada tidak hilang.
   */
  const updateUrl = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      const queryString = params.toString();
      router.replace(queryString ? `/?${queryString}` : "/");
    },
    [router, searchParams]
  );

  /** Handler input dengan debounce sederhana. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => updateUrl(value), DEBOUNCE_DELAY);
  };

  /** Hapus pencarian segera (tanpa menunggu debounce). */
  const handleClear = () => {
    setQuery("");
    if (timerRef.current) clearTimeout(timerRef.current);
    updateUrl("");
  };

  // Bersihkan timer debounce saat komponen unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative mt-6 max-w-2xl">
      {/* Ikon kaca pembesar */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Cari produk digital..."
        aria-label="Cari produk"
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      {/* Tombol hapus pencarian (muncul saat input terisi) */}
      {query !== "" && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Hapus pencarian"
          className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <svg
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * SearchBar - pencarian produk via URL Search Parameters.
 * Dibungkus <Suspense> karena menggunakan useSearchParams().
 */
export default function SearchBar() {
  return (
    <Suspense fallback={null}>
      <SearchBarInner />
    </Suspense>
  );
}

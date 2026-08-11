"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "./SearchBar";

/** Daftar kategori yang tersedia. */
const CATEGORIES = ["Semua", "Digital", "Fisik", "Jasa"];

/**
 * Inti SearchFilter - filter kategori + SearchBar.
 * Perubahan kategori langsung memperbarui URL `?category=...` (tanpa debounce),
 * sementara kata kunci pencarian ditangani oleh <SearchBar />.
 */
function SearchFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inisialisasi kategori dari URL (case-insensitive), fallback "Semua".
  const urlCategory = searchParams.get("category") ?? "";
  const [category, setCategory] = useState(
    CATEGORIES.find((c) => c.toLowerCase() === urlCategory.toLowerCase()) ??
      "Semua"
  );

  const handleCategorySelect = (nextCategory: string) => {
    setCategory(nextCategory);

    // Pertahankan parameter lain (mis. q) dan perbarui hanya kategori.
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory && nextCategory !== "Semua") {
      params.set("category", nextCategory.toLowerCase());
    } else {
      params.delete("category");
    }

    const queryString = params.toString();
    router.replace(queryString ? `/?${queryString}` : "/");
  };

  return (
    <div className="mt-6 space-y-5">
      <SearchBar />

      {/* Category Grid */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SearchFilter - SearchBar + Category Grid.
 * Dibungkus <Suspense> karena menggunakan useSearchParams().
 */
export default function SearchFilter() {
  return (
    <Suspense fallback={null}>
      <SearchFilterInner />
    </Suspense>
  );
}

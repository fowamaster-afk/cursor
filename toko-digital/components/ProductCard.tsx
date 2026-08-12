"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { formatRupiah } from "@/lib/whatsapp";

/** Warna badge kategori produk di kartu. */
function getCategoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    fisik: "bg-blue-600 text-white",
    digital: "bg-purple-600 text-white",
    jasa: "bg-amber-500 text-white",
  };
  return map[category.trim().toLowerCase()] ?? "bg-gray-600 text-white";
}

/**
 * ProductCard - kartu produk untuk etalase toko.
 *
 * Menampilkan gambar (dengan badge kategori), nama, harga (Rupiah), deskripsi
 * singkat, dan tombol "Detail Produk" yang mengarah ke halaman /product/[id].
 *
 * Tetap berlabel Client Component karena komponen ini juga dirender di
 * dalam Client Components (mis. halaman favorit), namun data produk selalu
 * dikirim dari Server Component halaman sehingga halaman tetap SEO-friendly.
 */
export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Gambar produk (dapat diklik menuju halaman detail) */}
      <Link
        href={`/product/${product.id}`}
        className="relative block h-48 w-full overflow-hidden bg-gray-100"
        aria-label={`Lihat detail ${product.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        {/* Badge kategori produk (Fisik / Digital / Jasa) */}
        {product.category && (
          <span
            className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${getCategoryBadgeClass(product.category)}`}
          >
            {product.category}
          </span>
        )}
      </Link>

      {/* Konten produk */}
      <div className="flex flex-1 flex-col p-5">
        {/* Nama produk */}
        <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
          <Link
            href={`/product/${product.id}`}
            className="transition hover:text-indigo-600"
          >
            {product.name}
          </Link>
        </h3>

        {/* Deskripsi singkat (dipotong jika terlalu panjang) */}
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">
          {product.description}
        </p>

        {/* Harga (format Rupiah) + tombol menuju halaman detail */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-indigo-600">
            {formatRupiah(product.price)}
          </span>
          <Link
            href={`/product/${product.id}`}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Detail Produk
          </Link>
        </div>
      </div>
    </article>
  );
}

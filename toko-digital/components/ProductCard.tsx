"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import FavoriteButton from "./FavoriteButton";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  formatRupiah,
  FALLBACK_WA_NUMBER,
} from "@/lib/whatsapp";

/**
 * Membangun URL WhatsApp dengan pesan pembelian profesional (COD).
 * Kartu produk belum memuat data profil penjual, sehingga nama toko
 * memakai fallback generik "toko Lokal".
 */
function buildProductWhatsAppUrl(product: Product): string {
  const waNumber = product.seller_wa?.trim() || FALLBACK_WA_NUMBER;
  const productUrl = `${window.location.origin}/product/${product.id}`;
  const message = buildWhatsAppMessage({
    storeName: "toko Lokal",
    productTitle: product.title,
    price: product.price,
    productUrl,
  });

  return buildWhatsAppUrl(waNumber, message);
}

/**
 * ProductCard - menampilkan satu produk digital, beli via WhatsApp (COD).
 */
export default function ProductCard({ product }: { product: Product }) {
  /**
   * Mengarahkan pembeli ke WhatsApp penjual untuk transaksi COD.
   */
  const handleBuy = () => {
    const url = buildProductWhatsAppUrl(product);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Gambar produk (dapat diklik menuju detail) */}
      <div className="relative block h-48 w-full overflow-hidden bg-gray-100">
        <Link
          href={`/product/${product.id}`}
          className="absolute inset-0"
          aria-label={`Lihat detail ${product.title}`}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-300 hover:opacity-80 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </Link>

        {/* Tombol Hati (Favorit) di pojok kanan atas gambar */}
        <FavoriteButton productId={product.id} />
      </div>

      {/* Konten produk */}
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-1 text-lg font-semibold text-gray-900 transition hover:text-blue-600"
        >
          {product.title}
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">
            {formatRupiah(product.price)}
          </span>
          <button
            type="button"
            onClick={handleBuy}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Beli
          </button>
        </div>
      </div>
    </article>
  );
}

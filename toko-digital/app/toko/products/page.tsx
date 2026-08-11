"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/services/supabaseClient";
import { getProductsByVendor } from "@/services/productService";
import type { Product } from "@/types/product";
import DeleteProductButton from "../DeleteProductButton";

/**
 * Formatter harga ke format Rupiah (IDR)
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Halaman "Produk Saya" - menampilkan daftar produk milik toko,
 * lengkap dengan aksi edit & hapus. (Client Component, sesuai strategi auth client.)
 */
export default function TokoProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        const userProducts = await getProductsByVendor(session.user.id);
        if (active) setProducts(userProducts);
      } catch (err) {
        console.error("Gagal memuat produk toko:", err);
        if (active) {
          setError("Terjadi kesalahan saat memuat produk.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  /** Hapus produk dari state setelah tombol Hapus berhasil dieksekusi. */
  const handleDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  if (loading) {
    return <p className="text-gray-500">Memuat produk...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Produk Saya
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola produk digital Anda.
          </p>
        </div>
        <Link
          href="/toko/upload"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          + Tambah Produk
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative h-40 w-full bg-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 capitalize">
                    {product.category ?? "Semua"}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatRupiah(product.price)}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-1 text-lg font-semibold text-gray-900">
                  {product.title}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/toko/edit/${product.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton
                      productId={product.id}
                      onDeleted={() => handleDeleted(product.id)}
                    />
                  </div>
                  <Link
                    href={`/product/${product.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Lihat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-500">Belum ada produk.</p>
          <Link
            href="/toko/upload"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Tambah produk pertama Anda
          </Link>
        </div>
      )}
    </div>
  );
}

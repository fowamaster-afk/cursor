"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import { getProductsByVendor } from "@/services/productService";
import type { Product } from "@/types/product";

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
 * Dashboard toko - ringkasan statistik produk milik toko,
 * lengkap dengan aksi cepat menuju halaman kelola produk.
 * (Client Component, sesuai strategi auth client.)
 */
export default function TokoDashboardPage() {
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
        // === DEBUG SEMENTARA: log detail & tampilkan pesan error asli ===
        console.error("DETAIL ERROR memuat produk (Dashboard toko):", err);
        if (active) {
          const message = err instanceof Error ? err.message : String(err);
          setError(`Terjadi kesalahan saat memuat produk: ${message}`);
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

  if (loading) {
    return <p className="text-gray-500">Memuat dashboard...</p>;
  }

  // Ringkasan statistik toko
  const totalValue = products.reduce((sum, product) => sum + product.price, 0);
  const categoryCount = new Set(
    products.map((product) => product.category).filter(Boolean)
  ).size;
  const latestProduct = products[0] ?? null;

  const stats = [
    {
      label: "Total Produk",
      value: String(products.length),
      hint: "produk terdaftar",
    },
    {
      label: "Nilai Stok",
      value: formatRupiah(totalValue),
      hint: "total harga produk",
    },
    {
      label: "Kategori",
      value: String(categoryCount),
      hint: "kategori unik",
    },
  ];

  const quickActions = [
    {
      label: "Lihat Produk Saya",
      description: "Kelola & edit semua produk Anda",
      href: "/toko/products",
    },
    {
      label: "Tambah Produk",
      description: "Upload produk digital baru",
      href: "/toko/upload",
    },
    {
      label: "Pengaturan Toko",
      description: "Perbarui informasi toko Anda",
      href: "/toko/settings",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan toko Anda.
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

      {/* Kartu statistik */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* Aksi cepat */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Aksi cepat</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              <p className="font-semibold text-indigo-600">{action.label}</p>
              <p className="mt-1 text-sm text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Produk terbaru */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Produk terbaru
          </h2>
          <Link
            href="/toko/products"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {latestProduct ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-900">
              {latestProduct.name}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {formatRupiah(latestProduct.price)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/toko/edit/${latestProduct.id}`}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
              >
                Edit
              </Link>
              <Link
                href={`/product/${latestProduct.id}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Lihat
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500">Belum ada produk.</p>
            <Link
              href="/toko/upload"
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Tambah produk pertama Anda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

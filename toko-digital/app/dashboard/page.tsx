"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/services/supabaseClient";
import { getUserOrders } from "@/services/orderService";
import type { UserOrder, OrderProduct } from "@/services/orderService";

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
 * Ekstrak produk paling relevan dari hasil JOIN.
 * Kolom `products` bisa berbentuk objek tunggal atau array.
 */
function extractProduct(order: UserOrder): OrderProduct | null {
  if (!order.products) return null;

  if (Array.isArray(order.products)) {
    return order.products[0] ?? null;
  }

  return order.products;
}

/**
 * Halaman Dashboard Pembeli.
 */
export default function DashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memuat dashboard: cek sesi lalu ambil riwayat order user.
   */
  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        // 1. Cek sesi login
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // Tidak login -> kembali ke halaman utama
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserEmail(session.user.email ?? "Pengguna");

        // 2. Ambil order berstatus paid milik user
        const userOrders = await getUserOrders(session.user.id);
        if (!active) return;

        setOrders(userOrders);
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
        if (active) {
          setError("Terjadi kesalahan saat memuat dashboard. Silakan coba lagi.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  /**
   * Logout: hapus sesi lokal lalu kembali ke halaman utama.
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      router.replace("/");
    }
  };

  const handleDownload = () => {
    alert("Mengunduh file...");
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">Memuat dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Dashboard */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Dashboard Pembeli
            </h1>
            <p className="mt-1 text-sm text-gray-500">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>

        {/* Error */}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {/* Daftar / Grid Produk yang Dibeli */}
        {orders.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const product = extractProduct(order);
              if (!product) return null;

              return (
                <article
                  key={order.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Gambar produk */}
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Konten */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
                      {product.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-600">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Telah dibeli</span>
                      <span className="text-base font-bold text-indigo-600">
                        {formatRupiah(order.amount)}
                      </span>
                    </div>

                    {/* Tombol Download */}
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                    >
                      Download File Asli
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="mt-12 text-center">
            <p className="text-gray-500">Anda belum memiliki pembelian.</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Jelajahi produk digital
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

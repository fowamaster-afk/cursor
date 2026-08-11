import Link from "next/link";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import ProductGallery from "@/components/ProductGallery";
import { getProductById } from "@/services/productService";
import { getProfile } from "@/services/profileService";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  formatRupiah,
  FALLBACK_WA_NUMBER,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** Nama toko fallback jika profil penjual belum diisi. */
const FALLBACK_STORE_NAME = "toko Lokal";

/**
 * Halaman Single Product.
 * Server Component murni - data diambil langsung di sisi server.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  // Produk tidak ditemukan -> Not Found
  if (!product) {
    return <NotFound />;
  }

  // Ambil profil penjual (nama toko & nomor WhatsApp) berdasarkan pemilik produk.
  const profile = product.user_id ? await getProfile(product.user_id) : null;
  const storeName = profile?.store_name?.trim() || FALLBACK_STORE_NAME;

  // Nomor WhatsApp: seller_wa produk (spesifik listing) -> wa_number profil -> fallback.
  const waNumber =
    product.seller_wa?.trim() || profile?.wa_number?.trim() || FALLBACK_WA_NUMBER;

  // Bangun URL absolut halaman produk agar bisa disertakan ke pesan WhatsApp.
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3001";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${protocol}://${host}`;
  const productUrl = `${baseUrl}/product/${product.id}`;

  // Pesan profesional + tautan wa.me (encodeURIComponent diterapkan di builder).
  const waMessage = buildWhatsAppMessage({
    storeName,
    productTitle: product.title,
    price: product.price,
    productUrl,
  });
  const waUrl = buildWhatsAppUrl(waNumber, waMessage);

  // Susun daftar gambar dengan aman:
  // - Jika image_urls (array dari kolom baru) tersedia & tidak kosong, pakai itu.
  // - Jika tidak, fallback ke imageUrl (gambar tunggal lama).
  const allImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Breadcrumb Kategori */}
      <nav aria-label="Breadcrumb" className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-indigo-600">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/" className="capitalize hover:text-indigo-600">
                {product.category ?? "Semua"}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-900">{product.title}</li>
          </ol>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ===== Kolom Kiri: Gambar & Deskripsi ===== */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {product.title}
            </h1>

            {/* Image Slider: client component murni untuk navigasi multiple gambar */}
            <ProductGallery images={allImages} />

            {/* Deskripsi Produk */}
            <section
              aria-label="Deskripsi Produk"
              className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Deskripsi Produk
              </h2>
              <div className="mt-4 whitespace-pre-line text-base leading-7 text-gray-700">
                {product.description}
              </div>
            </section>
          </div>

          {/* ===== Kolom Kanan: Harga & Info Penjual ===== */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Card Harga & Beli */}
            <aside
              aria-label="Harga dan pembelian"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">Harga</p>
              <p className="mt-1 text-4xl font-extrabold text-gray-900">
                {formatRupiah(product.price)}
              </p>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-green-500 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                Beli via WhatsApp
              </a>

              <p className="mt-4 text-center text-xs text-gray-400">
                Pembayaran dilakukan setelah barang diterima (COD).
              </p>
            </aside>

            {/* Card Info Penjual */}
            <aside
              aria-label="Info Penjual"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                  {storeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{storeName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-green-600">
                    ✓ Terverifikasi
                  </p>
                </div>
              </div>

              {/* Logika Fallback Penjual */}
              {product.user_id ? (
                <Link
                  href={`/author/${product.user_id}`}
                  className="mt-5 block w-full rounded-xl bg-gray-100 px-4 py-3 text-center font-semibold text-gray-800 transition duration-300 hover:bg-gray-200"
                >
                  Lihat Profil Penjual
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Produk ini tidak memiliki ID penjual yang valid"
                  className="mt-5 block w-full cursor-not-allowed rounded-xl bg-gray-50 px-4 py-3 text-center font-semibold text-gray-400"
                >
                  Profil Tidak Tersedia
                </button>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * UI saat produk tidak ditemukan.
 */
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-32 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Produk tidak ditemukan</h1>
        <p className="mt-2 text-gray-500">
          Produk yang Anda cari mungkin telah dihapus atau tidak tersedia.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  );
}

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
    productTitle: product.name,
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
            <li className="font-medium text-gray-900">{product.name}</li>
          </ol>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ===== Kolom Kiri: Gambar & Deskripsi ===== */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {product.name}
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

              {/* Status stok */}
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  product.stock > 0
                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                    : "bg-red-50 text-red-600 ring-1 ring-red-200"
                }`}
              >
                {product.stock > 0
                  ? `✓ Stok tersedia: ${product.stock}`
                  : "✕ Stok habis"}
              </span>

              {/* Tombol utama: pesan via WhatsApp dengan pesan otomatis */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                {/* Ikon WhatsApp */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Pesan via WhatsApp
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

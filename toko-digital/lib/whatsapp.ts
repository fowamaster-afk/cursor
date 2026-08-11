/**
 * Utilitas pembuatan tautan & pesan WhatsApp untuk pembelian produk (COD).
 * Dipakai bersama oleh halaman detail produk & kartu produk agar pesan
 * yang diterima penjual selalu konsisten dan profesional.
 */

/** Nomor WhatsApp cadangan (aman) jika penjual belum mengatur nomornya. */
export const FALLBACK_WA_NUMBER = "6280000000000";

/** Formatter harga ke format Rupiah (IDR). */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Input untuk membangun pesan WhatsApp. */
export interface WhatsAppMessageInput {
  /** Nama toko / penjual (mis. dari tabel profiles). */
  storeName: string;
  /** Judul produk. */
  productTitle: string;
  /** Harga produk (diformat otomatis ke Rupiah). */
  price: number;
  /** URL absolut halaman produk. */
  productUrl: string;
}

/**
 * Membangun pesan WhatsApp profesional dengan gaya bold WhatsApp (*...*),
 * emoji, dan baris yang rapi.
 */
export function buildWhatsAppMessage({
  storeName,
  productTitle,
  price,
  productUrl,
}: WhatsAppMessageInput): string {
  return [
    `Halo ${storeName}, saya tertarik untuk memesan produk berikut:`,
    "",
    `📦 *${productTitle}*`,
    `💰 Harga: ${formatRupiah(price)}`,
    `🔗 Link Produk: ${productUrl}`,
    "",
    "Apakah stok barang ini masih tersedia? Terima kasih!",
  ].join("\n");
}

/**
 * Membangun URL `https://wa.me/...` dengan seluruh pesan di-encode via
 * encodeURIComponent() agar spasi, baris baru (\n), dan emoji terbaca
 * sempurna oleh aplikasi WhatsApp.
 */
export function buildWhatsAppUrl(waNumber: string, message: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Type definitions for digital products
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  /** Array URL gambar tambahan (opsional) untuk mendukung multiple images. */
  image_urls?: string[];
  /** Nomor WhatsApp penjual (opsional). Contoh: "6281234567890". */
  seller_wa?: string;
  /** Kategori produk (opsional). Contoh: "digital", "fisik", "jasa". */
  category?: string;
  /** ID user pemilik produk (opsional, relevan untuk toko). */
  user_id?: string;
}

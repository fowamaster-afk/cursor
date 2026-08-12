/**
 * Type definitions for digital products.
 *
 * Skema tabel `products` di Supabase saat ini:
 * id, name, description, price, stock, image_url, created_at
 */
export interface Product {
  id: string;
  /** Nama produk (kolom `name` di database). */
  name: string;
  description: string;
  price: number;
  /** Jumlah stok tersedia (kolom `stock` di database). */
  stock: number;
  /** URL gambar utama - dipetakan dari kolom `image_url`. */
  imageUrl: string;
  /** Waktu pembuatan produk (kolom `created_at`). */
  created_at?: string;

  // --- Bidang lawas (opsional, hanya untuk kompatibilitas kode lama) ---
  /** @deprecated Gunakan `name`. */
  title?: string;
  /** @deprecated Kolom image_urls belum ada di tabel saat ini. */
  image_urls?: string[];
  /** @deprecated Kolom seller_wa belum ada di tabel saat ini. */
  seller_wa?: string;
  /** @deprecated Kolom category belum ada di tabel saat ini. */
  category?: string;
  /** @deprecated Kolom user_id belum ada di tabel saat ini. */
  user_id?: string;
}

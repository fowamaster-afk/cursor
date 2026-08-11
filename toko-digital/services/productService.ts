import { supabase } from "./supabaseClient";
import type { Product } from "@/types/product";

/**
 * Raw row shape dari tabel `products` di Supabase.
 * Menggunakan snake_case karena sesuai dengan skema database (Postgres convention).
 */
export interface ProductRow {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  image_urls?: string[];
  created_at: string;
  category?: string;
  seller_wa?: string;
  user_id?: string;
}

/** Payload untuk membuat produk baru. */
export interface ProductCreateInput {
  title: string;
  description: string;
  price: number;
  category: string;
  seller_wa?: string;
  image_url: string;
  image_urls?: string[];
  user_id: string;
}

/** Payload untuk memperbarui produk. Semua field opsional. */
export interface ProductUpdateInput {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  seller_wa?: string;
  image_url?: string;
  image_urls?: string[];
}

/**
 * Memetakan baris mentah dari database ke interface Product (camelCase).
 */
export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    image_urls: row.image_urls,
    category: row.category,
    seller_wa: row.seller_wa,
    user_id: row.user_id,
  };
}

/**
 * Mengambil produk dari tabel `products`, diurutkan berdasarkan created_at
 * terbaru. Mendukung filter opsional:
 * - `searchQuery`: pencarian tidak case-sensitive pada kolom title & description.
 * - `category`: filter berdasarkan kategori ('Semua' dilewati).
 */
export async function getProducts(
  searchQuery?: string,
  category?: string
): Promise<Product[]> {
  let builder = supabase
    .from("products")
    .select("id, title, description, price, image_url, image_urls, created_at, category, seller_wa, user_id");

  // Filter kategori (abaikan jika undefined / 'Semua')
  if (category && category !== "Semua") {
    builder = builder.eq("category", category);
  }

  // Filter pencarian (tidak case-sensitive) pada title & description.
  // PostgREST `.or()` menggabungkan dua kondisi dengan OR; `%` = wildcard.
  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.trim();
    builder = builder.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await builder.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Gagal mengambil data produk:", error.message);
    throw new Error(`Gagal mengambil data produk: ${error.message}`);
  }

  // Supabase mengembalikan data mentah; map ke Product domain.
  return (data as ProductRow[]).map(mapProduct);
}

/**
 * Mengambil satu produk berdasarkan id.
 * Mengembalikan null jika tidak ditemukan.
 */
export async function getProductById(id: string): Promise<Product | null> {
  // Guard clause: cegah crash jika ID tidak valid / 'undefined'
  if (!id || id === "undefined") return null;

  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, image_urls, created_at, category, seller_wa, user_id")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil produk:", error.message);
    throw new Error(`Gagal mengambil produk: ${error.message}`);
  }

  return data ? mapProduct(data as ProductRow) : null;
}

/**
 * Mengambil semua produk milik seorang penjual (berdasarkan user_id).
 * Dipakai di area Dashboard Toko untuk halaman "Produk Saya".
 */
export async function getProductsByVendor(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, image_urls, created_at, category, seller_wa, user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil produk toko:", error.message);
    throw new Error(`Gagal mengambil produk toko: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProduct);
}

/**
 * Mengambil semua produk milik seorang penjual/author (berdasarkan user_id).
 * Mirror dari getProductsByVendor namun untuk etalase publik profil penjual.
 */
export async function getProductsByAuthor(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price, image_url, image_urls, created_at, category, seller_wa, user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil produk penjual:", error.message);
    throw new Error(`Gagal mengambil produk penjual: ${error.message}`);
  }

  return (data as ProductRow[]).map(mapProduct);
}

/**
 * Meng-upload file gambar produk ke Supabase Storage (bucket 'product-images').
 * Mengembalikan URL publik dari file yang berhasil di-upload.
 */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  // Upload semua file secara paralel dengan nama unik (timestamp + index + nama asli)
  const uploads = files.map(async (file, index) => {
    const uniqueFileName = `${Date.now()}-${index}-${file.name}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(uniqueFileName, file);

    if (error) {
      console.error("Gagal meng-upload gambar:", error.message);
      throw new Error(`Gagal meng-upload gambar: ${error.message}`);
    }

    // Ambil URL publik hasil upload
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(uniqueFileName);

    return data.publicUrl;
  });

  return Promise.all(uploads);
}

/**
 * Membuat produk baru milik toko yang sedang login.
 * Mengembalikan produk yang berhasil dibuat.
 */
export async function createProduct(
  payload: ProductCreateInput
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat produk:", error.message);
    throw new Error(`Gagal membuat produk: ${error.message}`);
  }

  return mapProduct(data as ProductRow);
}

/**
 * Menghapus sebuah produk berdasarkan ID.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Gagal menghapus produk:", error.message);
    throw new Error(`Gagal menghapus produk: ${error.message}`);
  }
}

/**
 * Memperbarui data sebuah produk berdasarkan ID.
 * Mengembalikan produk yang berhasil diperbarui.
 */
export async function updateProduct(
  id: string,
  payload: ProductUpdateInput
): Promise<Product> {
  // Hanya sertakan field yang disediakan agar tidak menimpa dengan undefined
  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.price !== undefined) updates.price = payload.price;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.seller_wa !== undefined) updates.seller_wa = payload.seller_wa;
  if (payload.image_url !== undefined) updates.image_url = payload.image_url;
  if (payload.image_urls !== undefined) updates.image_urls = payload.image_urls;

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Gagal memperbarui produk:", error.message);
    throw new Error(`Gagal memperbarui produk: ${error.message}`);
  }

  return mapProduct(data as ProductRow);
}

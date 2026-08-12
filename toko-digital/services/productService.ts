import { supabase } from "./supabaseClient";
import type { Product } from "@/types/product";

/**
 * Raw row shape dari tabel `products` di Supabase.
 * Menggunakan snake_case karena sesuai dengan skema database (Postgres convention).
 */
export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  created_at?: string;
  // Bidang lawas (opsional) - dipertahankan agar kode lama tetap kompilasi.
  title?: string;
  image_urls?: string[];
  category?: string;
  seller_wa?: string;
  user_id?: string;
}

/** Payload untuk membuat produk baru. */
export interface ProductCreateInput {
  /** Nama produk (kolom `name`). Alias `title` lawas tetap diterima & dipetakan. */
  name?: string;
  title?: string;
  description: string;
  price: number;
  /** Stok produk (kolom `stock`). Default 0 bila tidak disediakan. */
  stock?: number;
  image_url: string;
  // Bidang lawas (tidak ada di tabel saat ini) - diabaikan saat insert.
  category?: string;
  seller_wa?: string;
  image_urls?: string[];
  user_id?: string;
}

/** Payload untuk memperbarui produk. Semua field opsional. */
export interface ProductUpdateInput {
  name?: string;
  /** Alias lawas - dipetakan ke kolom `name` saat update. */
  title?: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  // Bidang lawas (tidak ada di tabel saat ini) - diabaikan saat update.
  category?: string;
  seller_wa?: string;
  image_urls?: string[];
}

/**
 * Memetakan baris mentah dari database ke interface Product (camelCase).
 */
export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name ?? row.title ?? "",
    description: row.description,
    price: row.price,
    stock: row.stock ?? 0,
    imageUrl: row.image_url,
    created_at: row.created_at,
    // Alias lawas agar halaman lama yang masih membaca `title` tetap menampilkan nama.
    title: row.title ?? row.name,
    image_urls: row.image_urls,
    category: row.category,
    seller_wa: row.seller_wa,
    user_id: row.user_id,
  };
}

/**
 * Mengambil produk dari tabel `products`, diurutkan berdasarkan created_at
 * terbaru. Mendukung pencarian opsional:
 * - `searchQuery`: pencarian tidak case-sensitive pada kolom name & description.
 *
 * Catatan: tabel `products` saat ini hanya memiliki kolom
 * id, name, description, price, stock, image_url, created_at.
 */
export async function getProducts(searchQuery?: string): Promise<Product[]> {
  let builder = supabase
    .from("products")
    .select("id, name, description, price, stock, image_url, created_at");

  // Filter pencarian (tidak case-sensitive) pada name & description.
  // PostgREST `.or()` menggabungkan dua kondisi dengan OR; `%` = wildcard.
  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.trim();
    builder = builder.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
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
    .select("id, name, description, price, stock, image_url, created_at")
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
  // Catatan: kolom `user_id` belum ada di tabel products saat ini, sehingga
  // query ini akan error sampai kolom tersebut ditambahkan ke database.
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, stock, image_url, created_at")
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
  // Catatan: kolom `user_id` belum ada di tabel products saat ini, sehingga
  // query ini akan error sampai kolom tersebut ditambahkan ke database.
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, stock, image_url, created_at")
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
  // Hanya kirim kolom yang benar-benar ada di tabel `products`.
  // Alias `title` (legacy) dipetakan ke kolom `name`.
  const insert: Record<string, unknown> = {
    name: payload.name ?? payload.title ?? "",
    description: payload.description,
    price: payload.price,
    stock: payload.stock ?? 0,
    image_url: payload.image_url,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(insert)
    .select("id, name, description, price, stock, image_url, created_at")
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
  // Hanya sertakan field yang disediakan agar tidak menimpa dengan undefined.
  // Kolom lawas (category, seller_wa, image_urls) diabaikan karena belum ada
  // di tabel `products`; alias `title` lama dipetakan ke kolom `name`.
  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  else if (payload.title !== undefined) updates.name = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.price !== undefined) updates.price = payload.price;
  if (payload.stock !== undefined) updates.stock = payload.stock;
  if (payload.image_url !== undefined) updates.image_url = payload.image_url;

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

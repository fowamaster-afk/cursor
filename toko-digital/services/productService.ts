import { supabase } from "./supabaseClient";
import type { Product } from "@/types/product";

/** Daftar kolom standar dari tabel `products`. */
const PRODUCT_COLUMNS =
  "id, name, description, price, stock, image_url, user_id, created_at";

/** Sama dengan PRODUCT_COLUMNS, ditambah kolom `category`. */
const PRODUCT_COLUMNS_WITH_CATEGORY =
  "id, name, description, price, stock, image_url, user_id, category, created_at";

/** Hasil cache: apakah kolom `category` sudah ada di tabel products. */
let hasCategoryColumnCache: boolean | null = null;

/** True jika error PostgREST karena sebuah kolom tidak ditemukan. */
function isMissingColumnError(error: { message?: string } | null): boolean {
  return error !== null && /does\s+not\s+exist/i.test(error.message ?? "");
}

/**
 * Memeriksa apakah kolom `category` ada di tabel products.
 * Hasilnya di-cache agar hanya dicek sekali per proses server.
 */
async function hasCategoryColumn(): Promise<boolean> {
  if (hasCategoryColumnCache !== null) return hasCategoryColumnCache;
  const { error } = await supabase.from("products").select("category").limit(1);
  hasCategoryColumnCache = !isMissingColumnError(error);
  return hasCategoryColumnCache;
}

/**
 * Kolom SELECT yang dipakai query produk.
 * Jika kolom `category` belum ada di database, query tanpa category agar
 * aplikasi tetap berjalan (produk tampil sebagai "Tanpa Kategori").
 */
async function productSelect(): Promise<string> {
  return (await hasCategoryColumn())
    ? PRODUCT_COLUMNS_WITH_CATEGORY
    : PRODUCT_COLUMNS;
}

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
  /**
   * ID user pemilik produk (kolom `user_id` di tabel products).
   * WAJIB - diambil dari sesi pengguna yang sedang login.
   */
  user_id: string;
  /** Kategori produk (opsional): Fisik / Digital / Jasa. */
  category?: string;
  // Bidang lawas (tidak ada di tabel saat ini) - diabaikan saat insert.
  seller_wa?: string;
  image_urls?: string[];
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
  /** Kategori produk (opsional): Fisik / Digital / Jasa. */
  category?: string;
  // Bidang lawas (tidak ada di tabel saat ini) - diabaikan saat update.
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
 * Kolom `category` ikut diambil bila tersedia di database (digunakan untuk
 * mengelompokkan etalase: Fisik / Digital / Jasa).
 */
export async function getProducts(searchQuery?: string): Promise<Product[]> {
  let builder = supabase
    .from("products")
    .select(await productSelect());

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
  // Cast lewat `unknown` karena kolom SELECT dibuat dinamis (productSelect()),
  // sehingga supabase-js tidak dapat menyimpulkan tipe kolom hasil query.
  return (data as unknown as ProductRow[]).map(mapProduct);
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
    .select(await productSelect())
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil produk:", error.message);
    throw new Error(`Gagal mengambil produk: ${error.message}`);
  }

  return data ? mapProduct(data as unknown as ProductRow) : null;
}

/**
 * Mengambil semua produk milik seorang penjual (berdasarkan user_id).
 * Dipakai di area Dashboard Toko untuk halaman "Produk Saya".
 */
export async function getProductsByVendor(userId: string): Promise<Product[]> {
  // Kolom `user_id` (pemilik produk) kini tersedia; filter di bawah menampilkan
  // hanya produk milik penjual yang sedang login.
  const { data, error } = await supabase
    .from("products")
    .select(await productSelect())
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Log objek error LENGKAP dari Supabase: message, code, details, hint, status.
    console.error("DETAIL ERROR getProductsByVendor (select + eq user_id):", error);
    throw new Error(`Gagal mengambil produk toko: ${error.message}`);
  }

  return (data as unknown as ProductRow[]).map(mapProduct);
}

/**
 * Mengambil semua produk milik seorang penjual/author (berdasarkan user_id).
 * Mirror dari getProductsByVendor namun untuk etalase publik profil penjual.
 */
export async function getProductsByAuthor(userId: string): Promise<Product[]> {
  // Kolom `user_id` (pemilik produk) kini tersedia; filter di bawah menampilkan
  // etalase publik untuk satu penjual/author.
  const { data, error } = await supabase
    .from("products")
    .select(await productSelect())
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Log objek error LENGKAP dari Supabase: message, code, details, hint, status.
    console.error("DETAIL ERROR getProductsByAuthor (select + eq user_id):", error);
    throw new Error(`Gagal mengambil produk penjual: ${error.message}`);
  }

  return (data as unknown as ProductRow[]).map(mapProduct);
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
      // Log objek error lengkap dari Supabase Storage (berisi `message`,
      // `statusCode`, `code`, `details`, `hint`) untuk diagnosis RLS.
      console.error("DETAIL ERROR upload gambar ke Supabase Storage:", error);
      console.error("Pesan upload gambar:", error.message);
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
    stock: payload.stock !== undefined ? Number(payload.stock) : 0,
    image_url: payload.image_url,
    // Pemilik produk: dikirim dari sesi login oleh halaman upload.
    user_id: payload.user_id,
  };

  // Kolom `category` opsional: hanya dikirim jika kolomnya ada di database.
  if (await hasCategoryColumn()) {
    insert.category = payload.category ?? "";
  }

  const { data, error } = await supabase
    .from("products")
    .insert(insert)
    .select(await productSelect())
    .single();

  if (error) {
    // Log objek error lengkap dari Supabase (berisi `message`, `statusCode`,
    // `code`, `details`, `hint`) untuk diagnosis RLS.
    console.error("DETAIL ERROR insert ke tabel products:", error);
    console.error("Pesan insert products:", error.message);
    throw new Error(`Gagal membuat produk: ${error.message}`);
  }

  return mapProduct(data as unknown as ProductRow);
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
  // Kolom lawas (seller_wa, image_urls) diabaikan karena belum ada di tabel
  // `products`; alias `title` lama dipetakan ke kolom `name`.
  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  else if (payload.title !== undefined) updates.name = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.price !== undefined) updates.price = payload.price;
  if (payload.stock !== undefined) updates.stock = payload.stock;
  if (payload.category !== undefined && (await hasCategoryColumn())) {
    updates.category = payload.category;
  }
  if (payload.image_url !== undefined) updates.image_url = payload.image_url;

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(await productSelect())
    .single();

  if (error) {
    console.error("Gagal memperbarui produk:", error.message);
    throw new Error(`Gagal memperbarui produk: ${error.message}`);
  }

  return mapProduct(data as unknown as ProductRow);
}

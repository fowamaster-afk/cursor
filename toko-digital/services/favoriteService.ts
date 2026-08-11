import { supabase } from "./supabaseClient";
import { mapProduct } from "./productService";
import type { ProductRow } from "./productService";
import type { Product } from "@/types/product";

/**
 * Mendapatkan ID user yang sedang login, atau null jika belum login.
 * (Sesi Supabase tersimpan di localStorage browser, sehingga layanan ini
 *  hanya dapat dipanggil secara andal dari sisi client.)
 */
async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

/** Bentuk baris hasil join tabel favorites -> products (raw snake_case). */
interface FavoriteJoinRow {
  product_id: string;
  products: ProductRow | null;
}

/**
 * Menambah (insert) atau menghapus (delete) favorit untuk user yang sedang login.
 * Mengembalikan status favorit TERBARU (true = sekarang difavoritkan).
 */
export async function toggleFavorite(productId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const isFavorite = await checkIsFavorite(productId);

  if (isFavorite) {
    // Sudah favorit -> hapus
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      console.error("Gagal menghapus favorit:", error.message);
      throw new Error(`Gagal menghapus favorit: ${error.message}`);
    }
    return false;
  }

  // Belum favorit -> tambahkan
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    console.error("Gagal menambahkan favorit:", error.message);
    throw new Error(`Gagal menambahkan favorit: ${error.message}`);
  }
  return true;
}

/**
 * Mengecek apakah sebuah produk sudah difavoritkan user yang sedang login.
 */
export async function checkIsFavorite(productId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error("Gagal memeriksa favorit:", error.message);
    throw new Error(`Gagal memeriksa favorit: ${error.message}`);
  }

  return data !== null;
}

/**
 * Mengambil semua produk favorit milik user yang sedang login.
 * Menggunakan join: `.select('product_id, products(*)')` agar data produk
 * ikut terbawa dalam satu kali query. Diurutkan dari favorit terbaru.
 */
export async function getUserFavorites(): Promise<Product[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("product_id, products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil daftar favorit:", error.message);
    throw new Error(`Gagal mengambil daftar favorit: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as FavoriteJoinRow[];

  // Lewati favorit yang produknya sudah dihapus (products = null).
  return rows
    .filter(
      (row): row is FavoriteJoinRow & { products: ProductRow } =>
        row.products !== null
    )
    .map((row) => mapProduct(row.products));
}

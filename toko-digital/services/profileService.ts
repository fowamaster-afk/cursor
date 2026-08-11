import { supabase } from "./supabaseClient";
import { uploadProductImages } from "./productService";

/**
 * Bentuk baris pada tabel `profiles`.
 * Lengkap dengan kolom yang dipakai untuk etalase toko & halaman settings.
 */
export interface Profile {
  id: string;
  store_name: string;
  bio: string | null;
  store_logo: string | null;
  /** Nomor WhatsApp toko (opsional). Contoh: "6281234567890". */
  wa_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Payload untuk membuat / memperbarui profil toko. */
export interface ProfileUpsertInput {
  id: string;
  store_name: string;
  bio?: string | null;
  store_logo?: string | null;
}

/**
 * Mengambil satu profil berdasarkan user id.
 * Mengembalikan null jika profil belum ada.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil profil:", error.message);
    throw new Error(`Gagal mengambil profil: ${error.message}`);
  }

  return data as Profile | null;
}

/**
 * Menyimpan profil (insert jika belum ada, update jika sudah ada).
 * Menggunakan upsert dengan kolom unik `id` (= user_id dari Supabase Auth).
 */
export async function upsertProfile(
  payload: ProfileUpsertInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Gagal menyimpan profil:", error.message);
    throw new Error(`Gagal menyimpan profil: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Meng-upload logo toko ke Supabase Storage dan mengembalikan URL publik.
 * Memanfaatkan fungsi upload yang sudah ada dari productService.
 * Mengembalikan null jika file tidak diberikan.
 */
export async function uploadStoreLogo(file: File | null): Promise<string | null> {
  if (!file) return null;

  const [logoUrl] = await uploadProductImages([file]);
  return logoUrl;
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import {
  getProfile,
  upsertProfile,
  uploadStoreLogo,
} from "@/services/profileService";

/**
 * Halaman Settings Toko untuk toko.
 * Client Component: mendapat user_id dari sesi, memuat profil, lalu menyimpan
 * perubahan Nama Toko, Deskripsi Toko (bio), dan Foto Profil/Logo (store_logo).
 */
export default function tokoSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Ambil user id & profil saat halaman dimuat
  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) setError("Sesi tidak ditemukan, harap login ulang.");
          setLoading(false);
          return;
        }

        const profile = await getProfile(user.id);

        if (active) {
          setStoreName(profile?.store_name ?? "");
          setBio(profile?.bio ?? "");
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
        if (active) setError("Terjadi kesalahan saat memuat profil.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi tidak ditemukan, harap login ulang.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload logo baru jika ada file dipilih
      const logoUrl = await uploadStoreLogo(logoFile);

      // 2. Simpan profil (upsert: insert jika belum ada, update jika sudah)
      await upsertProfile({
        id: user.id,
        store_name: storeName,
        bio: bio || null,
        ...(logoUrl ? { store_logo: logoUrl } : {}),
      });

      setSuccess(true);
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      setError("Terjadi kesalahan saat menyimpan profil. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Settings Toko
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Atur identitas toko yang tampil di profil penjual dan etalase publik.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Nama Toko */}
        <div>
          <label htmlFor="storeName" className={labelClass}>
            Nama Toko
          </label>
          <input
            id="storeName"
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            placeholder="mis. Toko Digital Andi"
            className={inputClass}
          />
        </div>

        {/* Deskripsi Toko */}
        <div>
          <label htmlFor="bio" className={labelClass}>
            Deskripsi Toko
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Ceritakan tentang toko Anda..."
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Foto Profil / Logo */}
        <div>
          <label htmlFor="logoFile" className={labelClass}>
            Foto Profil / Logo
          </label>
          <input
            id="logoFile"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-400">
            Kosongkan jika tidak ingin mengganti logo. Format: JPG, PNG, WebP.
          </p>
        </div>

        {loading && <p className="text-sm text-gray-500">Memuat profil...</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Profil toko berhasil disimpan!
          </p>
        )}

        {/* Aksi */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || loading}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import {
  createProduct,
  uploadProductImages,
} from "@/services/productService";

/** Dropdown kategori yang tersedia untuk produk. */
const CATEGORIES = ["Digital", "Fisik", "Jasa"];

/**
 * Form Upload Produk untuk toko.
 * Client Component - mengisi data produk, meng-upload banyak gambar, lalu menyimpan.
 */
export default function tokoUploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sellerWa, setSellerWa] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Menangani perubahan input file: ambil semua file yang dipilih.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
  };

  /**
   * Menghapus satu file dari daftar gambar yang dipilih.
   */
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Menangani submit form: upload semua gambar, lalu buat produk baru.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Minimal satu file gambar wajib diisi
    if (imageFiles.length === 0) {
      setError("Silakan pilih minimal satu file gambar produk terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Ambil user_id secara paksa dari sesi lokal
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        alert("Sesi tidak ditemukan, harap login ulang!");
        return;
      }

      // 2. Upload semua gambar secara paralel
      const imageUrls = await uploadProductImages(imageFiles);

      // 3. Simpan produk dengan URL gambar hasil upload & user_id dari sesi
      await createProduct({
        title,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        seller_wa: sellerWa || undefined,
        image_url: imageUrls[0],
        image_urls: imageUrls,
        user_id: userId,
      });

      alert("Produk berhasil ditambahkan!");
      router.push("/toko");
    } catch (err) {
      // === DEBUG SEMENTARA: tampilkan penyebab asli dari Supabase ===
      console.error("DETAIL ERROR menambahkan produk:", err);

      // Pesan asli (dari upload gambar / insert products) diubah jadi string
      // yang bisa dibaca manusia dan ditampilkan langsung di UI + alert.
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Pesan error (string):", errorMessage);
      setError(`Gagal menambahkan produk: ${errorMessage}`);
      alert(`Gagal menambahkan produk: ${errorMessage}`);
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
        Tambah Produk
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Isi detail produk baru untuk ditampilkan di etalase.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Judul Produk */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Judul Produk
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="mis. Template Website Modern"
            className={inputClass}
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label htmlFor="description" className={labelClass}>
            Deskripsi
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Jelaskan detail produk Anda..."
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Harga */}
        <div>
          <label htmlFor="price" className={labelClass}>
            Harga (Rupiah)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="mis. 150000"
            className={inputClass}
          />
        </div>

        {/* Stok Produk */}
        <div>
          <label htmlFor="stock" className={labelClass}>
            Stok Produk
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            placeholder="mis. 10"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Jumlah barang yang tersedia. Jika 0, produk akan ditandai
            "Stok Habis" di etalase.
          </p>
        </div>

        {/* Kategori */}
        <div>
          <label htmlFor="category" className={labelClass}>
            Kategori
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Gambar Produk (Multiple File Upload) */}
        <div>
          <label htmlFor="imageFiles" className={labelClass}>
            Gambar Produk
          </label>
          <input
            id="imageFiles"
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-400">
            Format: JPG, PNG, atau WebP. Bisa pilih lebih dari satu gambar.
          </p>

          {/* Pratinjau & daftar gambar yang dipilih */}
          {imageFiles.length > 0 && (
            <ul className="mt-3 space-y-2">
              {imageFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nomor WA */}
        <div>
          <label htmlFor="sellerWa" className={labelClass}>
            Nomor WhatsApp (opsional)
          </label>
          <input
            id="sellerWa"
            type="text"
            value={sellerWa}
            onChange={(e) => setSellerWa(e.target.value)}
            placeholder="mis. 6281234567890"
            className={inputClass}
          />
        </div>

        {/* Pesan error */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Aksi */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/toko")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Uploading..." : "Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
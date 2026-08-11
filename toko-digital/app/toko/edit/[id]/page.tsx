"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getProductById,
  updateProduct,
  uploadProductImages,
} from "@/services/productService";

/** Dropdown kategori yang tersedia untuk produk. */
const CATEGORIES = ["Digital", "Fisik", "Jasa"];

/**
 * Halaman Edit Produk - mengubah data produk milik toko.
 * Client Component.
 */
export default function TokoEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;

  // State form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sellerWa, setSellerWa] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // State tambahan
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Ambil data produk saat ini saat halaman dimuat
  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        const product = await getProductById(productId);

        if (!product) {
          if (active) setNotFound(true);
          return;
        }

        if (active) {
          setTitle(product.title);
          setDescription(product.description);
          setPrice(String(product.price));
          setCategory(product.category ?? CATEGORIES[0]);
          setSellerWa(product.seller_wa ?? "");
        }
      } catch (err) {
        console.error("Gagal memuat produk:", err);
        if (active) setError("Terjadi kesalahan saat memuat produk.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  /**
   * Menangani perubahan input file: ambil semua file yang dipilih.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
  };

  /**
   * Menangani submit form:
   * - Jika memilih file gambar baru, upload & gunakan URL baru.
   * - Jika tidak, pertahankan image_url lama (tidak diubah).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Hanya upload gambar jika toko memilih file baru
      let finalImageUrls: string[] | undefined;
      if (imageFiles.length > 0) {
        finalImageUrls = await uploadProductImages(imageFiles);
      }

      await updateProduct(productId, {
        title,
        description,
        price: Number(price),
        category,
        seller_wa: sellerWa || undefined,
        // Bila ada file baru gunakan URL baru; bila tidak, tidak disertakan agar memakai image_url lama
        ...(finalImageUrls
          ? {
              image_url: finalImageUrls[0],
              image_urls: finalImageUrls,
            }
          : {}),
      });

      // Kembali ke halaman daftar produk setelah berhasil disimpan
      router.push("/toko/products");
    } catch (err) {
      console.error("Gagal memperbarui produk:", err);
      setError("Terjadi kesalahan saat memperbarui produk. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  const labelClass = "block text-sm font-medium text-gray-700";

  // State loading
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Produk tidak ditemukan (id salah / sudah dihapus)
  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Edit Produk
        </h1>
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-500">Produk tidak ditemukan.</p>
          <Link
            href="/toko/products"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Kembali ke Produk Saya
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Edit Produk
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Perbarui detail produk Anda.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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

        {/* Gambar Produk (opsional - biarkan kosong untuk memakai gambar lama) */}
        <div>
          <label htmlFor="imageFiles" className={labelClass}>
            Gambar Produk (opsional)
          </label>
          <input
            id="imageFiles"
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-400">
            Kosongkan jika ingin menggunakan gambar lama. Bisa pilih lebih dari
            satu gambar.
          </p>

          {/* Daftar gambar baru yang akan di-upload */}
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
                    onClick={() =>
                      setImageFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
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

        {/* Aksi */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/toko/products")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

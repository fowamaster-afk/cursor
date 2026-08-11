"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/services/productService";

interface DeleteProductButtonProps {
  productId: string;
  /** Dipanggil setelah produk berhasil dihapus (mis. untuk update state di parent). */
  onDeleted?: () => void;
}

/**
 * Tombol Hapus produk - konfirmasi via window.confirm, lalu memanggil
 * deleteProduct. Setelah berhasil, memanggil onDeleted (jika ada) dan
 * me-refresh halaman agar data ikut terbaru.
 */
export default function DeleteProductButton({
  productId,
  onDeleted,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    // Konfirmasi sebelum menghapus
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    setDeleting(true);
    try {
      await deleteProduct(productId);
      onDeleted?.();
      router.refresh();
    } catch (err) {
      console.error("Gagal menghapus produk:", err);
      alert("Terjadi kesalahan saat menghapus produk.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {deleting ? "Menghapus..." : "Hapus"}
    </button>
  );
}

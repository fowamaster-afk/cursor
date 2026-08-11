import Navbar from "@/components/Navbar";
import FavoritContent from "./FavoritContent";

/**
 * Halaman Koleksi Favorit (Wishlist) - Server Component shell.
 *
 * File ini tetap Server Component, namun seluruh logika sesi & pengambilan
 * data dilakukan di FavoritContent (Client Component) karena sesi Supabase
 * disimpan di localStorage sehingga TIDAK dapat dibaca di sisi server.
 */
export default function FavoritPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Koleksi Favorit
        </h1>
        <p className="mt-2 text-gray-600">
          Produk yang Anda sukai, tersimpan di satu tempat.
        </p>

        <FavoritContent />
      </main>
    </div>
  );
}

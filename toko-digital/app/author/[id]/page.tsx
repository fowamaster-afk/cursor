import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { getProductsByAuthor } from "@/services/productService";
import { getProfile } from "@/services/profileService";

/** Props untuk halaman profil penjual. */
interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Membuat inisial dari nama toko.
 * Contoh: "Toko Digital Andi" -> "TD", "Andi" -> "A", kosong -> "?".
 */
function getInitials(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Halaman Profil Penjual (Author).
 * Server Component - menampilkan etalase khusus produk milik satu penjual
 * beserta data profil asli dari tabel `profiles` (store_name, store_logo, bio).
 */
export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const [products, profile] = await Promise.all([
    getProductsByAuthor(id),
    getProfile(id),
  ]);

  // Data profil asli (fallback aman bila belum diisi toko)
  const storeName = profile?.store_name ?? "toko Lokal";
  const bio = profile?.bio ?? "Seller terverifikasi di Toko Digital.";
  const storeLogo = profile?.store_logo;
  const storeInitials = getInitials(storeName);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Header / Banner Profil Penjual */}
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar / Logo: pakai store_logo jika ada, jika kosong pakai inisial */}
            {storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeLogo}
                alt={`Logo ${storeName}`}
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white/30 bg-white object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-bold text-white shadow-lg">
                {storeInitials}
              </div>
            )}

            {/* Info penjual */}
            <div className="text-white">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {storeName}
              </h1>
              <p className="mt-2 flex items-center gap-1 text-sm text-white/90">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2l2.4 2.4 3.4-.5.6 3.4 2.6 2.2-1.4 3 1.4 3-2.6 2.2-.6 3.4-3.4-.5L12 22l-2.4-2.4-3.4.5-.6-3.4L3 14.4l1.4-3L3 8.4 5.6 6.2l.6-3.4 3.4.5L12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Seller
                </span>
              </p>
              {/* Deskripsi / bio asli dari tabel profiles */}
              {bio && <p className="mt-4 max-w-xl text-sm text-white/85">{bio}</p>}
            </div>

            {/* Statistik ringkas */}
            <div className="ml-auto hidden shrink-0 text-white sm:block">
              <p className="text-4xl font-extrabold">{products.length}</p>
              <p className="text-sm text-white/80">Produk</p>
            </div>
          </div>
        </div>
      </section>

      {/* Etalase / Katalog Produk */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Katalog Produk</h2>
          <span className="text-sm text-gray-500">{products.length} item</span>
        </div>

        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-gray-500">Belum ada produk.</p>
        )}
      </main>
    </div>
  );
}
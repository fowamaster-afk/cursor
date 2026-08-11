import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { getProducts } from "@/services/productService";

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

/**
 * Server Component - data diambil langsung di sisi server.
 * Pencarian (q) & kategori (category) dibaca dari URL search params (SEO-friendly),
 * lalu diteruskan ke getProducts agar filter berjalan di sisi database.
 */
export default async function Home({ searchParams }: HomePageProps) {
  // Next.js 15+ menjadikan searchParams sebagai Promise, jadi perlu di-await
  const params = await searchParams;
  const query = params.q;
  const category = params.category;

  const products = await getProducts(query, category);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero / Judul */}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Produk Digital
        </h1>
        <p className="mt-2 text-gray-600">
          Temukan berbagai produk digital berkualitas untuk kebutuhan Anda.
        </p>

        {/* Search Bar - memperbarui URL (?q=...) lalu halaman ini di-refetch */}
        <SearchBar />

        {products.length > 0 ? (
          /* Grid produk dari database */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Fallback saat tidak ada data cocok */
          <div className="mt-12 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-gray-900">
              Produk tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {query
                ? `Tidak ada hasil untuk pencarian "${query}".`
                : "Coba ubah kata kunci pencarian Anda."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}


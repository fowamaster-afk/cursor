import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { getProducts } from "@/services/productService";

interface HomePageProps {
  searchParams: Promise<{ q?: string }>;
}

/** Kategori etalase (urutan tampil di halaman utama). */
const CATEGORIES = ["Fisik", "Digital", "Jasa"] as const;

/** Deskripsi singkat per kategori (dipakai di header tiap bagian). */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Fisik: "Barang fisik yang dikirim ke alamat Anda.",
  Digital: "Produk digital yang langsung terkirim setelah pembayaran.",
  Jasa: "Layanan profesional dari penjual.",
};

/**
 * Server Component - data diambil langsung di sisi server (lebih cepat &
 * SEO-friendly). Produk dikelompokkan per kategori: Fisik, Digital, Jasa.
 * Kata kunci pencarian (q) dibaca dari URL search params.
 */
export default async function Home({ searchParams }: HomePageProps) {
  // Next.js 15+ menjadikan searchParams sebagai Promise, jadi perlu di-await
  const params = await searchParams;
  const query = params.q;

  const products = await getProducts(query);

  // Kelompokkan produk per kategori (case-insensitive).
  const groupByCategory = (category: string) =>
    products.filter(
      (p) => p.category?.trim().toLowerCase() === category.toLowerCase()
    );
  // Produk yang belum diberi kategori tetap ditampilkan agar tidak hilang.
  const uncategorized = products.filter((p) => !p.category?.trim());

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

        {products.length === 0 ? (
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
        ) : (
          /* Bagian produk per kategori */
          <div className="mt-12 space-y-14">
            {CATEGORIES.map((category) => {
              const items = groupByCategory(category);
              const description = CATEGORY_DESCRIPTIONS[category];

              return (
                <section key={category} aria-labelledby={`heading-${category}`}>
                  {/* Header kategori */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2
                        id={`heading-${category}`}
                        className="text-xl font-bold text-gray-900 sm:text-2xl"
                      >
                        {category}
                      </h2>
                      {description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {description}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {items.length} produk
                    </span>
                  </div>

                  {/* Grid produk atau pesan kosong */}
                  {items.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                      <p className="text-base font-semibold text-gray-900">
                        Belum ada produk dalam kategori ini
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Produk kategori {category} akan tampil di sini.
                      </p>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Produk yang belum diberi kategori */}
            {uncategorized.length > 0 && (
              <section aria-labelledby="heading-lainnya">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="heading-lainnya"
                      className="text-xl font-bold text-gray-900 sm:text-2xl"
                    >
                      Lainnya
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Produk yang belum diberi kategori.
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {uncategorized.length} produk
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {uncategorized.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


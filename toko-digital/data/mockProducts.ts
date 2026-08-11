import type { Product } from "@/types/product";

/**
 * Mock data for digital products
 * Image URLs use placeholder images from Unsplash
 */
export const mockProducts: Product[] = [
  {
    id: "1",
    title: "Template Website Modern",
    description:
      "Template website landing page modern dengan desain premium, responsif, dan mudah dikustomisasi.",
    price: 149000,
    imageUrl:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop",
  },
  {
    id: "2",
    title: "E-Book: Panduan UX Design",
    description:
      "E-book lengkap berisi panduan praktis UX Design untuk pemula hingga tingkat lanjut.",
    price: 99000,
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Bundle Ikon Grafis",
    description:
      "Kumpulan lebih dari 500 ikon grafis berkualitas tinggi dalam format SVG dan PNG.",
    price: 75000,
    imageUrl:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop",
  },
  {
    id: "4",
    title: "Kursus Online: React untuk Pemula",
    description:
      "Kursus video interaktif untuk menguasai React.js dari dasar hingga mahir.",
    price: 349000,
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  },
];

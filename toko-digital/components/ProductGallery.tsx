"use client";

import { useState } from "react";

/**
 * Image Slider/Carousel sederhana untuk gambar produk.
 *
 * - "use client" wajib: komponen ini memakai state interaktif (currentIndex).
 * - Props hanya `images: string[]` (array URL gambar).
 * - Jika hanya ada 1 gambar, tombol panah & thumbnail disembunyikan.
 */
interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  // Indeks foto yang sedang aktif
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = images.length;
  const currentImage = images[currentIndex] ?? images[0];

  // Navigasi & thumbnail hanya ditampilkan jika ada lebih dari satu gambar
  const isMultiple = total > 1;

  /** Pindah ke foto berikutnya (loop ke awal jika di akhir). */
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  /** Pindah ke foto sebelumnya (loop ke akhir jika di awal). */
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  return (
    <div className="mt-6">
      {/* ===== Gambar Utama ===== */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={`Foto produk ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />

        {/* Tombol navigasi Kiri / Kanan — hanya jika lebih dari 1 gambar */}
        {isMultiple && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Foto berikutnya"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Indikator posisi (misal "2 / 5") — hanya jika lebih dari 1 gambar */}
        {isMultiple && (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {currentIndex + 1} / {total}
          </span>
        )}
      </div>

      {/* ===== Thumbnail ===== — hanya jika lebih dari 1 gambar */}
      {isMultiple && (
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Lihat foto ${index + 1}`}
              aria-current={index === currentIndex}
              className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:h-20 sm:w-24 ${
                index === currentIndex
                  ? "border-indigo-600 ring-2 ring-indigo-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Thumbnail foto ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForSession } from "@/services/authService";
import { supabase } from "@/services/supabaseClient";

/**
 * components/AuthCallbackHandler.tsx
 * ----------------------------------
 * Penangan otomatis callback login Supabase (alur PKCE).
 *
 * Setelah user selesai login (email / Google), Supabase mengarahkan kembali
 * ke `/` dengan parameter URL:
 *
 *     /?code=<PKCE_CODE>&next=https://toko-domain...
 *
 * Alur komponen:
 *   1. Membaca `code` dan `next` dari URL via `useSearchParams`.
 *   2. Menukar `code` menjadi sesi aktif via `exchangeCodeForSession`.
 *   3. Berhasil  → redirect ke tujuan `next` memakai
 *      `window.location.href = decodeURIComponent(next)`; bila `next` kosong,
 *      tampilkan pesan "Login Berhasil" tanpa melakukan redirect.
 *   4. Gagal     → tampilkan pesan error asli di UI.
 *
 * Guard `hasExchanged` (useRef):
 *   Kode PKCE bersifat SINGLE-USE. Guard ini memastikan blok pertukaran hanya
 *   dijalankan sekali per instance — mencegah kode hangus karena double-
 *   execution (mis. React StrictMode menjalankan effect dua kali di dev, atau
 *   komponen di-render ulang).
 */

/** Menghapus parameter callback (`code`, `next`) dari URL tanpa reload. */
function clearCallbackQueryParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("next");
  window.history.replaceState({}, "", url.toString());
}

type CallbackStatus = "idle" | "processing" | "success" | "error";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  // "processing" bila ada kode di URL, "idle" bila tidak ada.
  const [status, setStatus] = useState<CallbackStatus>(() =>
    code ? "processing" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Saklar sekali jalan (anti double-execution).
   * useRef tidak memicu re-render dan nilainya bertahan antar render pada
   * instance yang sama — tepat untuk mencegah pertukaran kode dua kali.
   */
  const hasExchanged = useRef(false);

  useEffect(() => {
    // Tidak ada kode di URL → diam; form login normal yang tampil.
    if (!code) return;

    // Blok pertukaran HANYA dijalankan jika kode belum pernah diproses.
    if (hasExchanged.current) return;

    // Tandai segera (sinkron, sebelum `await`) agar eksekusi kedua apapun
    // (StrictMode di dev / render ulang) langsung berhenti di sini — kode
    // PKCE yang single-use tidak akan pernah ditukar dua kali.
    hasExchanged.current = true;

    // `code` sudah dipastikan ada (string) setelah guard di atas; simpan ke
    // const baru agar narrowing tetap berlaku di dalam fungsi bertingkat.
    const authCode = code;

    async function runExchange() {
      try {
        // 1) Tukar kode otorisasi PKCE menjadi sesi aktif.
        await exchangeCodeForSession(authCode);

        // 2) Bersihkan `code` dari URL agar tidak ditukar ulang saat refresh.
        clearCallbackQueryParams();

        // 3) Bila `next` ada → redirect langsung ke tujuan.
        if (rawNext) {
          // `decodeURIComponent` menangani nilai `next` yang di-encode dua
          // kali; dibungkus try/catch agar URI dengan `%` invalid aman.
          let target = rawNext;
          try {
            target = decodeURIComponent(rawNext);
          } catch {
            // Nilai mengandung `%` tidak valid → pakai nilai aslinya.
          }
          window.location.href = target;
          return;
        }

        // 4) Tanpa `next` → tampilkan pesan "Login Berhasil" (tanpa redirect).
        setStatus("success");
      } catch (err) {
        // Race condition: browser client (`detectSessionInUrl`) mungkin sudah
        // menukar kode lebih dulu sehingga panggilan eksplisit di atas gagal
        // ("code already used"). Bila sesi sudah aktif → anggap berhasil.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          clearCallbackQueryParams();
          setStatus("success");
          return;
        }

        // Kode benar-benar salah / kedaluwarsa → tampilkan pesan error asli.
        clearCallbackQueryParams();
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal memproses login. Silakan coba login kembali."
        );
        setStatus("error");
      }
    }

    void runExchange();
  }, [code, rawNext]);

  // Tidak ada kode di URL → biarkan form login normal yang tampil.
  if (status === "idle") return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      {status === "processing" && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          {/* Spinner loading */}
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <svg className="h-7 w-7 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
              </svg>
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            Memproses login dan mengalihkan...
          </h2>
          <p className="mt-2 text-sm font-light text-white/70">
            Sebentar, Anda akan dialihkan ke aplikasi tujuan.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          {/* Ikon sukses */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-300/30 bg-green-500/20">
            <svg
              className="h-7 w-7 text-green-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            Login Berhasil
          </h2>
          <p className="mt-2 text-sm font-light text-white/70">
            Anda berhasil masuk. Silakan lanjutkan ke dashboard Anda.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-8 w-full max-w-xs rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900 active:scale-[0.99]"
          >
            Lanjut ke Dashboard
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          {/* Ikon error */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-300/30 bg-red-500/20">
            <svg
              className="h-7 w-7 text-red-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            Login Gagal
          </h2>
          <p className="mt-2 max-w-xs break-words text-sm font-light text-white/70">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-8 w-full max-w-xs rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900 active:scale-[0.99]"
          >
            Coba Login Lagi
          </button>
        </div>
      )}
    </div>
  );
}

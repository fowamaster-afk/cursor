"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForSession } from "@/services/authService";
import { supabase } from "@/services/supabaseClient";
import { getSafeNextUrl } from "@/utils/redirect";

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
 * Komponen ini bertugas:
 *   1. Membaca parameter `code` dan `next` dari URL via `useSearchParams`.
 *   2. Menukar `code` menjadi sesi aktif via `exchangeCodeForSession`.
 *   3. Membersihkan URL (menghapus `code`) — kode PKCE hanya sekali pakai,
 *      sehingga refresh halaman tidak boleh menukar ulang kode yang sama.
 *   4. Mengalihkan user ke tujuan `next` (setelah validasi keamanan anti
 *      open-redirect), atau ke `/dashboard` bila tidak ada tujuan yang valid.
 *
 * Saat TIDAK ada parameter `code`, komponen merender `null` sehingga form
 * login normal (`LoginForm`) tetap tampil.
 */

type CallbackStatus = "idle" | "processing" | "error";

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

  // Guard agar proses pertukaran hanya dijalankan sekali (mencegah double
  // invoke dari StrictMode di development maupun remount lainnya).
  const processedRef = useRef(false);

  useEffect(() => {
    if (!code || processedRef.current) return;
    processedRef.current = true;

    // `code` sudah dipastikan ada (string) setelah guard di atas; simpan ke
    // const baru agar narrowing tetap berlaku di dalam fungsi bertingkat.
    const authCode = code;

    async function handleCallback() {
      try {
        // 1) Tukar kode otorisasi PKCE menjadi sesi aktif.
        await exchangeCodeForSession(authCode);

        // 2) Sesi terbentuk -> selesaikan redirect.
        finishRedirect();
      } catch {
        // Kasus race condition: browser client Supabase (`detectSessionInUrl`)
        // mungkin sudah menukar kode terlebih dahulu, sehingga pemanggilan
        // eksplisit di atas gagal ("code already used"). Bila sesi sudah aktif,
        // tetap lanjutkan redirect seperti biasa.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          finishRedirect();
          return;
        }

        // Tidak ada sesi valid -> tampilkan error agar user bisa mencoba lagi.
        setErrorMessage(
          "Gagal memproses login. Kode otorisasi tidak valid atau telah kedaluwarsa. Silakan coba login kembali."
        );
        setStatus("error");
      }
    }

    function finishRedirect() {
      // 3) Bersihkan URL: hapus `code` & `next` agar tidak terjadi pertukaran
      //    ulang saat halaman di-refresh.
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("next");
      window.history.replaceState({}, "", url.toString());

      // 4) Validasi keamanan tujuan (anti open-redirect) sebelum redirect.
      const next = getSafeNextUrl(rawNext, window.location.origin);

      if (next) {
        // Redirect langsung ke aplikasi tujuan. `decodeURIComponent` menangani
        // nilai `next` yang di-encode dua kali.
        let target = next;
        try {
          target = decodeURIComponent(next);
        } catch {
          // Nilai mengandung `%` tidak valid -> pakai nilai aslinya.
        }
        window.location.href = target;
        return;
      }

      // Tidak ada tujuan yang valid -> kembali ke dashboard SSO.
      router.replace("/dashboard");
    }

    void handleCallback();
  }, [code, rawNext, router]);

  // Tidak ada kode di URL -> biarkan form login normal yang tampil.
  if (status === "idle") return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      {status === "processing" ? (
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
      ) : (
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
            Login gagal
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

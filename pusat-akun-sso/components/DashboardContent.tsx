"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * components/DashboardContent.tsx
 * -------------------------------
 * Konten dashboard (Client Component). Menampilkan pesan selamat datang dan
 * tombol Logout dengan memanggil `logout` dari `useAuth`.
 */
export default function DashboardContent({ email }: { email: string }) {
  const router = useRouter();
  const { user, isLoading, error, signOut } = useAuth();

  // Jika sesi berubah menjadi kosong (mis. logout di tempat lain), kembali login.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch {
      // Pesan error sudah ditangani di state `error` milik useAuth.
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sesi aktif
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">Selamat datang kembali!</h1>
        <p className="mt-2 text-sm text-slate-400">
          Anda telah masuk sebagai{" "}
          <span className="font-medium text-slate-200">{email || user?.email || "Pengguna"}</span>.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
              </svg>
              Keluar…
            </>
          ) : (
            <>Logout</>
          )}
        </button>
      </div>
    </main>
  );
}

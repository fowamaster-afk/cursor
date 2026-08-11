"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabaseClient";
import { getSafeNextUrl } from "@/utils/redirect";

interface FormState {
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
}

const initialState: FormState = {
  email: "",
  password: "",
  showPassword: false,
  remember: false,
};

/**
 * LoginForm — Natural Luxury Glassmorphism Edition
 * -------------------------------------------------
 * Client Component untuk kotak form masuk dengan estetika alam premium.
 *
 * Komponen ini HANYA berfungsi sebagai kotak form Glassmorphism
 * (`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl`).
 * LATAR BELAKANG gambar alam (dan overlay gelap) dikelola sepenuhnya oleh
 * parent (`app/page.tsx`), sehingga komponen ini fokus pada form saja.
 *
 * Animasi Framer Motion: kotak form muncul dari bawah (y: 50) & memudar,
 * lalu setiap elemen (Judul, Email, Password, Tombol Login, Garis Pemisah,
 * Tombol Google) muncul satu per satu dengan transisi staggered `0.1s`.
 *
 * SELURUH logika fungsional (useAuth Email & Google, penangkapan `?source=`,
 * SSO Bridge penyisipan token ke URL `next`, redirect cerdas lintas origin)
 * DIJAGA TETAP UTUH — hanya kerangka UI/class Tailwind yang dirombak total.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const theme = useThemeConfig(source);
  const { user, isLoading, error, signIn, signOut, loginWithGoogle } = useAuth();

  const [state, setState] = useState<FormState>(initialState);
  /** Apakah form sedang dalam mode "Daftar" (register) atau "Masuk" (login). */
  const [isRegister, setIsRegister] = useState<boolean>(false);
  /** Error khusus untuk alur registrasi (karena `supabase.auth.signUp` langsung). */
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Menandakan sedang melakukan redirect otomatis ke aplikasi tujuan. */
  const [redirecting, setRedirecting] = useState<boolean>(false);

  /** Guard anti double-invoke untuk auto-redirect (mencegah infinite loop). */
  const redirectedRef = useRef(false);

  /**
   * Tujuan kepulangan dari parameter URL `?next=` (di-encode oleh aplikasi
   * asal, mis. toko-digital). Nilai otomatis di-decode oleh `useSearchParams`,
   * sehingga di sini sudah berupa URL absolut yang valid, atau `null` bila
   * tidak disediakan.
   */
  const nextUrl = searchParams.get("next");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  /**
   * Redirect Cerdas (SSO):
   *  - Jika ada `?next=`, arahkan ke URL tujuan dengan menyisipkan
   *    `access_token` & `refresh_token` agar aplikasi tujuan bisa membangun
   *    sesinya sendiri — mencegah infinite redirect loop antar port.
   *  - State `redirecting` di-set agar UI berubah menjadi "Mengalihkan...".
   */
  const redirectAfterLogin = useCallback(async () => {
    // Guard anti double-invoke: mencegah redirect ganda (mis. dipanggil dari
    // `handleSubmit` DAN dari efek sesi aktif di bawah sekaligus).
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    // Baca tujuan dari parameter URL `?next=` dan validasi keamanannya.
    const next = getSafeNextUrl(nextUrl, window.location.origin);

    if (!next) {
      // Tidak ada tujuan -> biarkan UI menampilkan "Selamat datang kembali!".
      return;
    }

    // Set UI menjadi "Mengalihkan ke aplikasi tujuan...".
    setRedirecting(true);

    // Path internal → sesi sama-origin, redirect langsung tanpa token.
    if (next.startsWith("/")) {
      router.push(next);
      return;
    }

    // URL absolut (lintas origin / port) → teruskan token sesi.
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    const redirectUrl = new URL(next);
    if (session?.access_token) {
      redirectUrl.searchParams.set("access_token", session.access_token);
    }
    if (session?.refresh_token) {
      redirectUrl.searchParams.set("refresh_token", session.refresh_token);
    }

    // Eksekusi kepulangan ke aplikasi tujuan dengan token tersisip.
    window.location.href = redirectUrl.toString();
  }, [nextUrl, router]);

  // Saat sesi aktif terdeteksi, periksa tujuan:
  //  - ada `?next=`  → auto redirect ke aplikasi tujuan.
  //  - tanpa `?next=` → tampilkan UI "Selamat datang kembali!"
  // Guard anti double-invoke ditangani di dalam `redirectAfterLogin`.
  // Dipanggil lewat setTimeout agar setState tidak terjadi sinkron di dalam
  // effect (memenuhi aturan react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!isLoading && user) {
      const timer = setTimeout(() => {
        void redirectAfterLogin();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, redirectAfterLogin]);

  /** Tujuan OAuth Google: origin + `?next=` (bila aman) agar SSO tetap jalan. */
  const buildGoogleRedirectTo = (): string => {
    const next = getSafeNextUrl(searchParams.get("next"), window.location.origin);
    if (next) {
      const url = new URL(window.location.origin);
      url.searchParams.set("next", next);
      return url.toString();
    }
    return window.location.origin;
  };

  /** Memulai login dengan Google, meneruskan tujuan dari `?next=`. */
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(buildGoogleRedirectTo());
    } catch {
      // Gagal: pesan error sudah disimpan di state `error` milik useAuth.
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      if (isRegister) {
        // ── Mode Daftar: buat akun baru (tanpa redirect, perlu verifikasi) ──
        const { error: signUpError } = await supabase.auth.signUp({
          email: state.email,
          password: state.password,
        });
        if (signUpError) {
          setSubmitError(signUpError.message);
          return;
        }
        // Notifikasi sukses registrasi.
        alert(
          "Registrasi berhasil! Silakan cek email Anda untuk verifikasi (atau langsung login jika tidak butuh verifikasi)",
        );
        return;
      }

      // ── Mode Masuk: logika lama DIJAGA TETAP UTUH ──
      await signIn(state.email, state.password);
      // Login berhasil → redirect cerdas (tokens diteruskan bila lintas origin).
      await redirectAfterLogin();
    } catch {
      // Gagal login: pesan error sudah disimpan di state `error` milik useAuth.
    }
  };

  /** Logout dari sesi SSO saat ini. */
  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Gagal logout: error sudah dikelola useAuth.
    }
  };

  // ── Auto-redirect & Sesi Aktif ──
  // Jika sesi aktif:
  //   - ada `?next=`  → tampilkan status "Mengalihkan..." lalu redirect.
  //   - tanpa `?next=` → tampilkan UI "Selamat datang kembali!" (email + logout).
  if (!isLoading && user) {
    return (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {redirecting ? (
          <RedirectingCard theme={theme} />
        ) : (
          <WelcomeCard
            email={user.email}
            onLogout={handleLogout}
            theme={theme}
          />
        )}
      </motion.div>
    );
  }

  // ── Variants Framer Motion (staggered children) ──
  const cardVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 18 },
    },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // ── Base class input Glassmorphism ──
  const inputBase =
    "w-full border-0 border-b border-white/30 bg-transparent px-1 py-3 text-sm tracking-wide text-white caret-white outline-none transition-all duration-300 placeholder:font-light placeholder:text-white/50 focus:border-b-white/90 focus:shadow-[0_6px_18px_-10px_rgba(255,255,255,0.5)]";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="relative z-10 w-full max-w-md"
    >
      {/* Kartu Glassmorphism premium */}
      <motion.div
        variants={containerVariants}
        className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 sm:p-10 ${theme.cardGlow}`}
      >
          {/* Kilau cahaya halus di tepi atas */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />

          {/* Badge logo brand */}
          <motion.div variants={itemVariants} className="relative mb-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-white/70 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${theme.brand}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${theme.brand}`} />
              </span>
              Pusat Akun SSO
            </span>
          </motion.div>

          {/* Judul */}
          <motion.div variants={itemVariants} className="relative mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
            </h1>
            <p className="mt-1.5 text-sm font-light text-white/70">
              {isRegister
                ? "Daftar untuk mengakses portal aman Anda"
                : "Masuk untuk melanjutkan ke portal aman Anda"}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="relative space-y-6" noValidate>
            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-[0.2em] text-white/70"
              >
                Alamat email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="nama@perusahaan.co.id"
                value={state.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputBase}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-[0.2em] text-white/70"
                >
                  Kata sandi
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={state.showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={state.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => update("showPassword", !state.showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                  aria-label={state.showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {state.showPassword ? (
                      <>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* Remember me */}
            <motion.label variants={itemVariants} className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={state.remember}
                onChange={(e) => update("remember", e.target.checked)}
                className="h-4 w-4 shrink-0 appearance-none rounded border border-white/40 bg-white/10 transition-all duration-200 checked:border-white checked:bg-white checked:shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              />
              <span className="text-xs font-light text-white/70 transition-colors group-hover:text-white/90">
                Ingat saya di perangkat ini
              </span>
            </motion.label>

            {/* Pesan error login */}
            {(error || submitError) && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error || submitError}</span>
              </motion.div>
            )}

            {/* Tombol Login / Daftar */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold tracking-wide text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                  </svg>
                  MEMPROSES…
                </span>
              ) : (
                <>{isRegister ? "Daftar" : "Masuk"}</>
              )}
            </motion.button>

            {/* Garis pemisah ATAU */}
            <motion.div variants={itemVariants} className="my-2 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">atau</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </motion.div>

            {/* Tombol Google */}
            <motion.button
              variants={itemVariants}
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-3">
                <GoogleLogo />
                {isRegister ? "Daftar dengan Google" : "Masuk dengan Google"}
              </span>
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="relative mt-8 text-center text-xs font-light text-white/60"
          >
            {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
            <button
              type="button"
              onClick={() => {
                setIsRegister((prev) => !prev);
                setSubmitError(null);
              }}
              disabled={isLoading}
              className="font-medium text-white underline decoration-white/40 underline-offset-4 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRegister ? "Masuk di sini" : "Daftar sekarang"}
            </button>
          </motion.div>
        </motion.div>

        {/* Info sumber konteks (untuk verifikasi branding dinamis) */}
        <motion.p
          variants={itemVariants}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-5 text-center text-[10px] font-medium uppercase tracking-widest text-white/50"
        >
          {source ? (
            <>
              <span className="mr-1 text-white">◆</span> kontak brand : {`"${source}"`}
            </>
          ) : (
            <>
              <span className="mr-1 text-white">◆</span> kontak brand : default
            </>
          )}
        </motion.p>
    </motion.div>
  );
}

/**
 * Ikon logo "G" warna-warni Google (SVG).
 */
function GoogleLogo(): ReactNode {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.87 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

/**
 * Kartu status "Mengalihkan ke aplikasi tujuan..." — ditampilkan saat sesi
 * aktif dengan `?next=` sedang dalam proses redirect otomatis.
 */
function RedirectingCard({ theme }: { theme: { cardGlow?: string; brand?: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md sm:p-10 ${theme.cardGlow ?? ""}`}
    >
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="relative">
          <span
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 ${theme.brand ?? ""}`}
          >
            <svg className="h-7 w-7 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
            </svg>
          </span>
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          Mengalihkan ke aplikasi tujuan...
        </h2>
        <p className="mt-2 text-sm font-light text-white/70">
          Sebentar, Anda akan dialihkan ke aplikasi tujuan.
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Kartu "Selamat datang kembali!" — ditampilkan saat sesi aktif TANPA `?next=`,
 * menampilkan info email (avatar) dan tombol Logout.
 */
function WelcomeCard({
  email,
  onLogout,
  theme,
}: {
  email?: string;
  onLogout: () => void;
  theme: { cardGlow?: string; brand?: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md sm:p-10 ${theme.cardGlow ?? ""}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      <div className="mt-2 flex flex-col items-center justify-center text-center">
        {/* Avatar */}
        <div className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-bold text-white ${theme.brand ?? ""}`}>
          {email?.charAt(0)?.toUpperCase() ?? "U"}
        </div>

        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          Selamat datang kembali!
        </h2>
        <p className="mt-3 max-w-xs break-words text-sm font-light text-white/70">
          Anda sudah masuk sebagai
        </p>
        <p className="w-full max-w-xs break-words text-sm font-medium text-white/90">
          {email ?? "Pengguna"}
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="mt-8 w-full max-w-xs rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900 active:scale-[0.99]"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}

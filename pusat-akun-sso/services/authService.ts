import type { User } from "@supabase/supabase-js";
import { supabase } from "@/services/supabaseClient";

/**
 * services/authService.ts
 * -----------------------
 * Lapisan layanan autentikasi. Hanya bertanggung jawab untuk berkomunikasi
 * dengan Supabase (Auth API), lalu mengembalikan data atau melempar error.
 *
 * Fungsi di sini bersifat **modular murni**:
 *   - Tidak menyentuh UI / React sama sekali.
 *   - Tidak mengelola state; state dipegang oleh hook `useAuth`.
 *   - Memetakan kesalahan Supabase menjadi `Error` yang mudah dibaca.
 */

/**
 * Login (masuk) dengan email dan kata sandi.
 *
 * @param email    Alamat email pengguna.
 * @param password Kata sandi pengguna.
 * @returns Objek `User` yang berhasil login.
 * @throws `Error` apabila kredensial salah / proses gagal.
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(
      translateAuthError(error.message, {
        invalidLoginCredentials: "Email atau kata sandi salah.",
        emailNotConfirmed: "Email belum dikonfirmasi. Periksa kotak masuk Anda.",
        default: `Gagal masuk: ${error.message}`,
      })
    );
  }

  return data.user;
}

/**
 * Login menggunakan Google (OAuth).
 *
 * Memulai alur OAuth Google melalui Supabase. Parameter `redirectTo` (yang
 * biasanya berisi tujuan dari `?next=` pada URL SSO) menentukan ke mana user
 * dikembalikan setelah proses otentikasi dengan Google selesai — menjaga
 * redirect dinamis SSO tetap berfungsi.
 *
 * @param redirectTo URL absolut tujuan setelah OAuth (opsional).
 * @throws `Error` apabila provider belum dikonfigurasi / gagal memulai alur.
 */
export async function loginWithGoogle(redirectTo?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`Gagal masuk dengan Google: ${error.message}`);
  }
}

/**
 * Login menggunakan Magic Link (email OTP).
 *
 * Supabase mengirimkan email berisi link ke `redirectTo`; saat link diklik,
 * browser diarahkan ke `/auth/callback` (Route Handler server) untuk menukar
 * `code` menjadi sesi aktif.
 *
 * @param email      Alamat email tujuan magic link.
 * @param redirectTo URL callback SSO — harus mengarah ke
 *                   `.../auth/callback?next=<URL_TUJUAN>` (mis. dari
 *                   `buildGoogleRedirectTo` di LoginForm).
 * @throws `Error` apabila gagal mengirim magic link.
 */
export async function loginWithMagicLink(email: string, redirectTo?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw new Error(`Gagal mengirim magic link: ${error.message}`);
  }
}

/**
 * Registrasi akun baru dengan email dan kata sandi.
 *
 * @param email    Alamat email pengguna.
 * @param password Kata sandi pengguna (min. 6 karakter sesuai kebijakan Supabase).
 * @returns Objek `User` yang baru terdaftar.
 * @throws `Error` apabila pendaftaran gagal / email sudah dipakai.
 */
export async function registerWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(
      translateAuthError(error.message, {
        userAlreadyRegistered: "Email sudah terdaftar. Silakan masuk.",
        weakPassword: "Kata sandi terlalu lemah (minimal 6 karakter).",
        default: `Gagal mendaftar: ${error.message}`,
      })
    );
  }

  // Saat konfirmasi email diaktifkan, `data.user` dapat berisi objek identitas
  // sementara tanpa sesi aktif. Tetap dikembalikan agar UI bisa memberi tahu
  // bahwa pendaftaran berhasil namun perlu verifikasi email.
  if (!data.user) {
    throw new Error("Registrasi berhasil dibuat, namun email belum dikonfirmasi.");
  }

  return data.user;
}

/**
 * Keluar dari sesi aktif pengguna.
 *
 * @returns `void` setelah proses keluar berhasil.
 * @throws `Error` apabila proses logout gagal.
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Gagal keluar: ${error.message}`);
  }
}

/**
 * Mengambil sesi aktif saat ini (untuk inisialisasi state pada mount hook).
 *
 * @returns `User` dari sesi aktif, atau `null` bila tidak ada.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/**
 * Pemetaan pesan error Supabase ke pesan yang lebih ramah.
 * Fallback ke `default` bila kode tidak dikenal.
 */
function translateAuthError(
  message: string,
  messages: { invalidLoginCredentials?: string; emailNotConfirmed?: string; userAlreadyRegistered?: string; weakPassword?: string; default: string }
): string {
  const lower = message.toLowerCase();

  if (messages.invalidLoginCredentials && lower.includes("invalid login credentials")) {
    return messages.invalidLoginCredentials;
  }
  if (messages.emailNotConfirmed && lower.includes("email not confirmed")) {
    return messages.emailNotConfirmed;
  }
  if (messages.userAlreadyRegistered && lower.includes("already registered")) {
    return messages.userAlreadyRegistered;
  }
  if (messages.weakPassword && lower.includes("password should be at least")) {
    return messages.weakPassword;
  }

  return messages.default;
}

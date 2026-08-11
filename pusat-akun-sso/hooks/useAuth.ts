"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { loginWithEmail, registerWithEmail, logout, getCurrentUser, loginWithGoogle as loginWithGoogleService } from "@/services/authService";
import { supabase } from "@/services/supabaseClient";

/**
 * hooks/useAuth.ts
 * ----------------
 * Custom Hook yang menjembatani komponen UI dengan `authService`.
 *
 * Tanggung jawab hook:
 *   - Mengelola state `user`, `isLoading`, dan `error`.
 *   - Menyediakan fungsi pembungkus (wrapper) `signIn`, `signUp`, `signOut`
 *     untuk dieksekusi dari form login/register.
 *   - Merespons perubahan sesi secara reaktif (login/logout di tab lain).
 *
 * Komponen UI hanya memanggil wrapper function tanpa tahu detail Supabase.
 */

export interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inisialisasi sesi awal + subscribe perubahan auth.
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch {
        // Kesalahan ambil sesi awal diabaikan; user dianggap belum login.
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();

    // Reaksi terhadap perubahan status autentikasi (login/logout dll).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Pembungkus untuk form login.
   * Mengeset loading/error lalu memanggil `authService.loginWithEmail`.
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithEmail(email, password);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.");
      // Melempar ulang agar komponen form dapat menangkap dan berhenti (opsional).
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Pembungkus untuk form register.
   * Mengeset loading/error lalu memanggil `authService.registerWithEmail`.
   */
  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const registeredUser = await registerWithEmail(email, password);
      // Jika email perlu konfirmasi, `user` mungkin hanya identitas sementara.
      // State user diupdate via `onAuthStateChange` setelah login berhasil.
      setUser(registeredUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Pembungkus untuk logout.
   * Memanggil `authService.logout`; state user di-update oleh subscription.
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat keluar.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Pembungkus untuk login dengan Google (OAuth).
   * Memanggil `authService.loginWithGoogle` dan meneruskan `redirectTo`
   * (tujuan SSO dari `?next=` bila ada).
   */
  const loginWithGoogle = useCallback(async (redirectTo?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogleService(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk dengan Google.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading, error, signIn, signUp, signOut, loginWithGoogle };
}

export default useAuth;

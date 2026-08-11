"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

/**
 * Komponen inti SSO Receiver - membaca token dari URL dan menyimpan sesi.
 */
function SsoReceiverInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [handled, setHandled] = useState(false);

  useEffect(() => {
    // Hanya proses sekali
    if (handled) return;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    // Tidak ada token -> tidak perlu melakukan apa-apa
    if (!accessToken || !refreshToken) {
      setHandled(true);
      return;
    }

    const persistSession = async () => {
      try {
        // Simpan sesi dari token yang dibawa di URL ke storage port 3001
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Gagal menyimpan sesi SSO:", error.message);
          return;
        }

        // Bersihkan URL dari token untuk keamanan (kembali ke path asli)
        router.replace(pathname);
      } catch (err) {
        console.error("Gagal memproses sesi SSO:", err);
      } finally {
        setHandled(true);
      }
    };

    persistSession();
  }, [searchParams, pathname, router, handled]);

  return null;
}

/**
 * SSO Receiver - menangkap token hasil redirect dari port 3000,
 * menyimpan sesi, lalu membersihkan URL.
 *
 * Dibungkus <Suspense> karena menggunakan useSearchParams()
 * agar tidak error saat static rendering / build.
 */
export default function SsoReceiver() {
  return (
    <Suspense fallback={null}>
      <SsoReceiverInner />
    </Suspense>
  );
}

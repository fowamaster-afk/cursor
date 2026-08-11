import { redirect } from "next/navigation";
import { getServerUser } from "@/services/supabaseServerClient";
import DashboardContent from "@/components/DashboardContent";

/**
 * app/dashboard/page.tsx
 * ----------------------
 * Halaman dashboard yang dilindungi. Hanya dapat diakses oleh user yang
 * sudah login (dijamin oleh `proxy.ts` + pemeriksaan ulang di sini sebagai
 * pertahanan berlapis).
 */
export default async function DashboardPage() {
  const user = await getServerUser();

  // Pertahanan berlapis: bila tanpa sesi, lempar kembali ke halaman login.
  if (!user) {
    redirect("/");
  }

  return <DashboardContent email={user.email ?? ""} />;
}

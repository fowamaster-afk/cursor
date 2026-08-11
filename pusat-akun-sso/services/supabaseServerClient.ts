/**
 * services/supabaseServerClient.ts
 * --------------------------------
 * Re-export dari `utils/supabase/server.ts` (implementasi kanonik Supabase SSR).
 *
 * Modul ini dipertahankan agar import lama tetap berfungsi tanpa perubahan:
 *   - `getServerUser`        → dipakai `app/dashboard/page.tsx`
 *   - `createServerSupabase` → alias kompatibilitas untuk `createClient`
 */
export { createClient, getServerUser } from "@/utils/supabase/server";
export { createClient as createServerSupabase } from "@/utils/supabase/server";


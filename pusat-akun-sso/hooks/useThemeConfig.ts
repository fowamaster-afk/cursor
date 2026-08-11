import { useMemo } from "react";
import { resolveTheme, themeConfig, defaultTheme, type Theme, type ThemeConfig } from "@/utils/themeConfig";

/**
 * useThemeConfig
 * --------------
 * Mengembalikan objek konfigurasi tema yang berlaku berdasarkan nilai
 * parameter `source`. Mempertahankan referensi yang stabil selama `source`
 * tidak berubah agar tidak memicu render ulang komponen tanpa perlu.
 *
 * @param source Nilai `?source=` yang dibaca dari URL.
 */
export function useThemeConfig(source: string | null): ThemeConfig {
  return useMemo<ThemeConfig>(() => themeConfig[resolveTheme(source)] ?? themeConfig[defaultTheme], [source]);
}

export type { Theme, ThemeConfig };

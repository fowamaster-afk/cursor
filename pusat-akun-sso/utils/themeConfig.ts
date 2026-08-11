/**
 * Context-Aware Branding (Cyberpunk Remap)
 * ---------------------------------------
 * Menyimpan konfigurasi warna/class Tailwind secara terpusat agar seluruh
 * komponen dapat me-render tema yang berbeda berdasarkan konteks (mis. sumber
 * lalu lintas `?source=` pada URL) tanpa perlu mengubah JSX sama sekali.
 *
 * Seluruh palet kini dirombak ke estetika **Cyberpunk** (dasar hampir-hitam /
 * slate-950 dengan aksen neon). `?source=store`/`toko` memakai aksen Neon Pink,
 * konteks default memakai Neon Cyan — sehingga remaining fungsi branding tetap
 * hidup namun semua tampilan tampil mewah dalam nuansa cyberpunk.
 *
 * Catatan Tailwind v4: class disimpan sebagai **string lengkap** (bukan
 * potongan/string bergabung) agar scanner JIT tetap mendeteksinya.
 */

export type Theme = "slate" | "blue";

export interface ThemeConfig {
  /** Warna latar halaman login */
  background: string;
  /** Warna permukaan kartu form (dudukan) */
  surface: string;
  /** Teks utama (judul, nilai input) */
  text: string;
  /** Teks sekunder / muted */
  muted: string;
  /** Teks aksen (placeholder, helper) */
  accent: string;
  /** Gradasi untuk badge / brand glow */
  brand: string;
  /** Class tombol submit */
  button: string;
  /** Class tombol saat di-hover */
  buttonHover: string;
  /** Latar bidang input */
  inputBg: string;
  /** Border bidang input */
  inputBorder: string;
  /** Focus ring bidang input */
  inputFocusRing: string;
  /** Warna label bidang input */
  label: string;
  /** Class placeholder bidang input (varian lengkap, mis. `placeholder:text-...`) */
  inputPlaceholder: string;
  /** Class ikon toggle password saat di-hover */
  iconHover: string;
  /** Class link "Lupa password?" saat di-hover */
  linkHover: string;
  /** Aksen Neon utama (cyan/pink) untuk kotak sudut dekoratif & garis */
  neon: string;
  /** Warna teks utama tombol submit (kontras terhadap glow) */
  buttonText: string;
  /** Box-shadow glow kartu pada warna Neon */
  cardGlow: string;
  /** Warna garis input saat fokus (Neon) */
  inputFocusText: string;
}

/** Tema default: Neon Cyan. */
const slate: ThemeConfig = {
  background: "bg-slate-950",
  surface: "bg-slate-950/70",
  text: "text-cyan-300",
  muted: "text-cyan-200/50",
  accent: "text-cyan-300/70",
  brand: "from-cyan-400 via-cyan-300 to-cyan-500",
  button: "bg-cyan-400",
  buttonHover: "hover:bg-pink-500",
  buttonText: "text-slate-950",
  inputBg: "bg-transparent",
  inputBorder: "border-cyan-400/40",
  inputFocusRing: "focus:ring-cyan-400/30",
  inputFocusText: "focus:border-[#00f3ff]",
  label: "text-cyan-200",
  inputPlaceholder: "placeholder:text-cyan-200/40",
  iconHover: "hover:text-cyan-300",
  linkHover: "hover:text-cyan-300",
  neon: "text-[#00f3ff]",
  cardGlow: "shadow-[0_0_30px_rgba(0,243,255,0.25)]",
};

/** Tema toko: Neon Pink. */
const blue: ThemeConfig = {
  background: "bg-slate-950",
  surface: "bg-slate-950/70",
  text: "text-pink-300",
  muted: "text-pink-200/50",
  accent: "text-pink-300/70",
  brand: "from-pink-500 via-pink-400 to-fuchsia-500",
  button: "bg-pink-500",
  buttonHover: "hover:bg-cyan-400",
  buttonText: "text-slate-950",
  inputBg: "bg-transparent",
  inputBorder: "border-pink-400/40",
  inputFocusRing: "focus:ring-pink-400/30",
  inputFocusText: "focus:border-[#ff003c]",
  label: "text-pink-200",
  inputPlaceholder: "placeholder:text-pink-200/40",
  iconHover: "hover:text-pink-300",
  linkHover: "hover:text-pink-300",
  neon: "text-[#ff003c]",
  cardGlow: "shadow-[0_0_30px_rgba(255,0,60,0.25)]",
};

/** Kumpulan seluruh tema yang terdaftar. */
export const themeConfig: Record<Theme, ThemeConfig> = { slate, blue };

/** Tema yang dipakai apabila tidak ada sumber yang cocok. */
export const defaultTheme: Theme = "slate";

/**
 * Pemetaan nilai `?source=` terhadap tema.
 * Ubah/extend di sini saat ingin menambahkan konteks brand baru
 * (mis. "marketplace", "hospital", dst.).
 */
const themeBySource: Record<string, Theme> = {
  store: "blue",
  toko: "blue",
};

/**
 * Menyelesaikan tema mana yang berlaku berdasarkan nilai parameter `source`.
 *
 * @param source Nilai `?source=` dari URL (boleh `null`/kosong).
 * @returns Tema yang sesuai, atau `defaultTheme` bila tidak dikenal.
 */
export function resolveTheme(source: string | null | undefined): Theme {
  if (!source) return defaultTheme;
  return themeBySource[source.toLowerCase().trim()] ?? defaultTheme;
}

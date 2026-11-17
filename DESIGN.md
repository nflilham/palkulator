# DESIGN.md: PALkulator (Moodboard Neubrutalist Playful & Tactile)

## Design Read
Reading this as: Interactive math & 2D/3D geometry learning landing page (`kalkulator matematika & geometri`), in the **KidLingo Neubrutalist Playful & Tactile** visual language (leafy green canvas, canary yellow & bubblegum pink accents, crisp white/cream framed cards, `Fraunces` display serif + `Inter` UI + `IBM Plex Mono` tabular numerals, `2px solid #000000` borders, and hard offset shadows), dial `ENERGY 3 / RHYTHM 3 / MOTION 2`.

## 1. Arsitektur Token Warna 3-Tier (WCAG AA Terverifikasi)

### Tier 1: Primitive Tokens
- `--n-background`: `#2A8A43` (Leafy garden green)
- `--n-surface`: `#FFFFFF` (Crisp card surface)
- `--n-surface-bright`: `#FFF9ED`
- `--n-surface-container-low`: `#FAF3E3`
- `--n-surface-container`: `#F4EDDD`
- `--n-surface-container-high`: `#EEE8D7`
- `--n-inverse-surface`: `#333026`
- `--n-inverse-on-surface`: `#F7F0E0`
- `--n-on-surface`: `#1E1C12` (Soft black ink; kontras 17.07:1 di atas `#FFFFFF`, 14.64:1 di atas `#F4EDDD`)
- `--n-on-surface-variant`: `#4B4734` (Kontras 9.33:1 di atas `#FFFFFF`, 8.00:1 di atas `#F4EDDD`)
- `--n-border`: `#000000`
- `--b-primary`: `#FDE047` (Electric canary yellow; kontras 12.95:1 dengan teks `#1E1C12`)
- `--b-secondary`: `#F472B6` (Bubblegum pink; kontras 6.45:1 dengan teks `#1E1C12`)
- `--b-tertiary`: `#00696D` (Deep teal; kontras 6.48:1 dengan teks `#FFFFFF`)
- `--b-error`: `#BA1A1A`, `--b-error-container`: `#FFDAD6`, `--b-on-error-container`: `#93000A` (Kontras 7.24:1)

### Tier 2 & 3: Semantic & Component Tokens (Mode Terang & Mode Gelap)
- **Mode Terang (Default):**
  - Kanvas halaman `--bg-page`: `#2A8A43`
  - Permukaan kartu `--bg-surface`: `#FFFFFF`, `--bg-subtle`: `#FAF3E3`, `--bg-key`: `#F4EDDD`
  - Teks utama `--ink-primary`: `#1E1C12`, sekunder `--ink-muted`: `#4B4734`
  - Aksen utama `--accent`: `#FDE047` (teks `#1E1C12`), aksen kedua `--accent-pink`: `#F472B6` (teks `#1E1C12`), aksen ketiga `--core-cobalt`: `#00696D` (teks `#FFFFFF`)
- **Mode Gelap (`[data-theme="dark"]`):**
  - Kanvas halaman `--bg-page`: `#132A19` (Deep forest night)
  - Permukaan kartu `--bg-surface`: `#23211A`, `--bg-subtle`: `#1A1914`, `--bg-key`: `#2D2A20`
  - Teks utama `--ink-primary`: `#F7F0E0` (Kontras 14.18:1), sekunder `--ink-muted`: `#CEC6AD` (Kontras 9.44:1)
  - Aksen utama `--accent`: `#FDE047` (teks `#1E1C12`), aksen kedua `--accent-pink`: `#F472B6` (teks `#1E1C12`), aksen ketiga `--core-cobalt`: `#59F8FF` (teks `#002021`, kontras 13.26:1)

## 2. Tipografi (R-06)
- **Heading (`--font-display`):** `'Fraunces', 'Playfair Display', Georgia, serif` (`700`, `line-height: 1.1`, `letter-spacing: -0.02em`) sesuai moodboard untuk menghadirkan karakter buku cerita yang ekspresif dan ramah.
- **Body & UI (`--font-body`):** `'Inter', system-ui, sans-serif` (`400`, `500`, `600`, `700`) sesuai spesifikasi moodboard untuk instruksi, label tombol, dan penjelasan rumus.
- **Angka & Rumus (`--font-mono`):** `'IBM Plex Mono', monospace` dengan `font-variant-numeric: tabular-nums` khusus untuk layar kalkulator, tabel `f(x)`, metrik geometri, dan `<kbd>`.

## 3. Elevasi Neubrutalist, Radius Konsentris & Rotasi Stiker (R-11, R-12, R-31)
- **Hard Shadows (Tanpa Blur):** `--shadow-arbitrary2: 2px 2px 0 #000000` (input/badge/tab), `--shadow-hard: 4px 4px 0 #000000` (kartu & tombol standar), `--shadow-arbitrary3: 8px 8px 0 #000000` (workbench utama kalkulator, `f(x)`, dan kanvas geometri 3D).
- **Skala Radius Proporsional:** `--radius-sm: 4px` (badge/stiker), `--radius-md: 8px` (input/tab/tombol keypad), `--radius-lg: 16px` (kartu & tombol aksi utama), `--radius-xl: 24px` (kontainer workbench besar).
- **Mekanika Tekan Fisik:** Hover menggeser tombol `translate(2px, 2px)` dengan bayangan mengecil ke `2px 2px 0 #000000`; klik aktif (`:active`) menggeser `translate(4px, 4px)` hingga bayangan rata (`0 0 #0000`).
- **Stiker Tilt:** Badge nomor spesifikasi dan tag status memakai rotasi mikro (`--rotate-tilt7: -2deg`, `--rotate-tilt6: 3deg`) agar terasa seperti stiker fisik di atas papan belajar.

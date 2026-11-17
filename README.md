<div align="center">

# PALkulator

**Kalkulator matematika web, plotter kurva `f(x)`, dan visualisasi geometri 2D/3D interaktif — dibangun murni dengan HTML, CSS, dan JavaScript tanpa library eksternal.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-palkulator.netlify.app-FDE047?style=for-the-badge&logo=netlify&logoColor=1E1C12)](https://palkulator.netlify.app)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-2A8A43?style=for-the-badge)](#arsitektur--teknologi)
[![Vanilla JS](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-F472B6?style=for-the-badge&logo=javascript&logoColor=1E1C12)](#struktur-proyek)

</div>

---

## Fitur Utama

### 1. Kalkulator Standar & Ilmiah (Tanpa `eval()`)
- **Parser Rekursif Aman** (`calculator.js`) yang mematuhi urutan operasi matematika (kurung, pangkat, perkalian/pembagian, penjumlahan/pengurangan).
- **Perkalian Implisit Otomatis**: ekspresi seperti `2pi`, `3(4+5)`, `2sin(30)`, dan `2x^2` langsung dikenali.
- **Fungsi Ilmiah & Konstanta**: `sin`, `cos`, `tan`, `sqrt` (`√`), `log` (basis 10), `ln` (basis natural), `abs`, serta konstanta `pi` dan `e`.
- **Mode Sudut `DEG` / `RAD`** dan **Diagnostik Galat Domain** yang informatif (mis. pembagian nol, asimtot `tan(90°)`, logaritma non-positif).
- **Pita Riwayat Lokal** & **Kontrol Keyboard Penuh** (`0-9`, `+ - * / ^`, `( ) %`, `Enter`/`=`, `Backspace`, `Esc`).

### 2. Workbench Tabel Nilai & Kurva `f(x)`
- Evaluasi fungsi satu variabel `f(x)` pada rentang tertentu secara langsung.
- Menampilkan tabel pasangan nilai `(x, f(x))` beserta visualisasi kurva di kanvas.

### 3. Geometri Bangun Datar (2D) & Bangun Ruang (3D)
Mesin rumus dan renderer kanvas 3D/2D (`geometry.js` & `viewer3d.js`) mendukung **13 bentuk** lengkap dengan langkah substitusi rumus:

| Kategori | Bentuk yang Didukung |
| --- | --- |
| **Bangun Datar (2D)** | Persegi, Persegi Panjang, Segitiga Sama Kaki, Lingkaran, Trapesium Sama Kaki, Jajar Genjang |
| **Bangun Ruang (3D)** | Kubus, Balok, Tabung, Kerucut, Bola, Limas Segi Empat, Prisma Segitiga |

- **Viewer 3D Interaktif**: putar 360° dengan pointer atau tombol panah keyboard, mode wireframe, auto-rotate, zoom, dan tampilan jaring-jaring (*net*) 2D.

### 4. Antarmuka *Neubrutalist Playful & Tactile*
- Kanvas hijau daun, kartu berbingkai tegas (`2px solid #000`), bayangan offset keras, serta tipografi **Fraunces**, **Inter**, dan **IBM Plex Mono** (`tabular-nums`).
- Mendukung **Mode Terang & Mode Gelap**, tata letak responsif, dan navigasi aksesibel via keyboard.

---

## Struktur Proyek

```text
palkulator/
├── index.html      # Struktur halaman, workbench kalkulator, f(x), geometri, dan pintasan
├── styles.css      # Design system 3-tier token warna, mode gelap/terang, & komponen neubrutalist
├── app.js          # Orkestrasi UI, state riwayat, event listener, & kontrol pintasan
├── calculator.js   # Tokenizer & recursive-descent parser matematika (tanpa eval)
├── geometry.js     # Definisi 13 bangun 2D/3D, rumus, langkah substitusi, & builder mesh 3D
├── viewer3d.js     # Renderer kanvas 3D proyeksi & jaring-jaring 2D interaktif
└── DESIGN.md       # Spesifikasi token desain, kontras WCAG AA, tipografi, & elevasi
```

---

## Menjalankan Secara Lokal

Proyek ini adalah aplikasi web statis tanpa *build step*:

```bash
git clone https://github.com/nflilham/palkulator.git
cd palkulator
```

Buka `index.html` langsung di browser, atau jalankan server lokal sederhana:

```bash
npx serve .
```

---

## Kredit

Dibuat oleh **[Naufal Ilham Fauzan](https://github.com/nflilham)**.

# Phase 4 — Paper Profiles dan Batas Aman Custom

Pengaturan kertas hanya berlaku pada sesi preview/cetak aktif dan tidak disimpan
ke database. Setengah Folio `210 × 165 mm` landscape selalu menjadi default dan
baseline visual.

Profil yang tersedia:

- Setengah Folio landscape: `210 × 165 mm`.
- A4 portrait/landscape: `210 × 297 mm` / `297 × 210 mm`.
- A5 portrait/landscape: `148 × 210 mm` / `210 × 148 mm`.
- B3 ISO portrait/landscape: `353 × 500 mm` / `500 × 353 mm`.
- Custom portrait/landscape.

Batas aman Custom dipusatkan pada `CUSTOM_PAPER_LIMITS`:

- Dimensi minimum: `148 mm`.
- Dimensi maksimum: `1000 mm`.
- Margin minimum: `0 mm`.
- Margin maksimum: `40 mm`.
- Area konten tersisa setelah margin: minimal `128 mm` pada masing-masing sisi.

Input kosong, nol, negatif, bukan angka, terlalu kecil, terlalu besar, atau
menyisakan area konten yang terlalu sempit akan ditolak. Saat input Custom tidak
valid, preview dan aturan print memakai fallback Setengah Folio yang aman dan
tombol cetak diblokir sampai input diperbaiki.

Jumlah baris tabel tetap 12 pada seluruh profil. Perubahan ukuran menggunakan
CSS variables untuk menyesuaikan dimensi halaman, padding, font, logo, spacing,
tinggi tabel, dan footer. Transform hanya dipakai sebagai scaling tampilan
preview agar muat viewport; saat print transform tersebut dihapus.

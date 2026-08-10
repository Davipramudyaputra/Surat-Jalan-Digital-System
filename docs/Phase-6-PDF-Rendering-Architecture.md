# Phase 6 — PDF Rendering Architecture

## 1. Renderer yang Dipilih

**Playwright (playwright-core) + Chromium/Chrome.**

`playwright-core` dipilih karena:
- Tidak mengunduh browser (ringan, tanpa binary download).
- Memanfaatkan Chrome/Chromium yang sudah terpasang di sistem.
- Mendukung `page.pdf()` dengan ukuran kertas custom, `printBackground`, dan
  media print — sesuai kebutuhan canonical HTML/CSS.
- API stabil dan dapat dikontrol timeout/cleanup.

Executable browser dicari melalui:
1. Env `CHROME_PATH`.
2. Fallback path umum (macOS `/Applications/...`, Linux `/usr/bin/google-chrome`,
   `/usr/bin/chromium`).

## 2. Alasan Pemilihan

- Canonical template menggunakan CSS modules + CSS variables + `@page` yang
  membutuhkan Chromium untuk render presisi.
- Strategi internal route (B) memanfaatkan Next.js sendiri untuk memproses CSS
  modules, `next/image`, dan font → hasil PDF **identik dengan preview**.
- Playwright-core tidak memaksa template kedua dan tidak membuat image-only PDF.

## 3. Canonical Template Source

- `src/components/delivery-note-template/DeliveryNoteDocument.tsx`
- `src/components/delivery-note-template/delivery-note-template.module.css`
- `src/lib/delivery-note-template/*` (mapper, pagination, paper-profiles, formatter)

PDF, preview, dan print memakai komponen yang sama. Tidak ada template PDF kedua.

## 4. Alur Data

```
DeliveryNote data
→ getDeliveryNoteForPreview (server, active-only)
→ mapDeliveryNoteToDocument
→ <DeliveryNoteDocument> (canonical React/HTML/CSS)
→ internal render route (/render/surat-jalan/[token])
→ Chromium page.pdf()
→ PDF buffer
→ response application/pdf
```

## 5. Route / Action

- **API**: `GET /api/delivery-notes/:id/pdf?paper=&orientation=&width=&height=&margin=`
- **Internal render**: `GET /render/surat-jalan/:token`
- Internal render dibebaskan dari session middleware dan hanya mengandalkan
  HMAC render token (single-purpose, ephemeral).

## 6. Authentication

- API PDF memverifikasi session admin (`requireAdmin`).
- Render token internal adalah HMAC-SHA256 atas payload + timestamp, ditandatangani
  secret server (`PDF_RENDER_SECRET`). Tidak ada session cookie yang dikirim ke
  browser rendering.

## 7. Active-Only Validation

- API PDF menolak Delivery Note soft-deleted, parent PO soft-deleted, dan data
  yang tidak ditemukan.
- Menggunakan `getDeliveryNoteForPreview` (active-only) + cek parent PO aktif.

## 8. Paper Profiles

- Setengah Folio (210×165, landscape) default.
- A4, A5, B3, Custom — semua dari `paper-profiles.ts`.
- Custom divalidasi server-side (min/max dimension, margin, orientation).

## 9. Pagination

- Memakai `paginateDeliveryNoteItems` yang sama dengan preview/print.
- `page.pdf()` memakai `preferCSSPageSize` + `printBackground`, sehingga `@page`
  dan page-break existing dihormati.
- Dokumen multi-page mengikuti header/footer behaviour canonical.

## 10. Font dan Asset

- Render menunggu selector `[data-delivery-note-document]` dan logo.
- Semua asset dari origin internal (tidak ada request internet).
- `next/image` dengan `unoptimized` merender logo dari path statis.

## 11. Browser Lifecycle

- Browser dibuat per request (bukan singleton) untuk keamanan/isolasi.
- Browser, context, dan page selalu ditutup di `finally`.
- `page.goto` memakai `waitUntil: 'load'` agar tidak menunggu request latar dev.

## 12. Timeout

- Browser launch: 20 detik.
- Page load / document ready: 30 detik.
- Best-effort `networkidle` (8 detik, di-catch).
- Pesan error: "Proses PDF melebihi batas waktu."

## 13. Cleanup

- `try/finally` menutup browser selalu (sukses, error, atau timeout).
- Tidak ada file sementara yang dibuat (PDF dihasilkan sebagai buffer).
- Tidak ada temp directory / temp file.

## 14. Concurrency

- Bagian 1 hanya individual export (synchronous, strict limits).
- Satu browser per request; tidak ada browser pool di Bagian 1.
- Batas default: render timeout 30 detik per request.

## 15. Local Requirements

- Node.js 22.12+.
- Chrome atau Chromium terpasang, atau set `CHROME_PATH`.
- Set `PDF_RENDER_SECRET` dan `APP_ORIGIN`.

## 16. Docker Requirements

- Base image harus menyertakan Chromium/Chrome dan font.
- Jika Docker digunakan, tambahkan package Chromium + `--no-sandbox`.
- Set `CHROME_PATH` di container.

## 17. Production Requirements

- `APP_ORIGIN` harus menunjuk origin publik aplikasi.
- `PDF_RENDER_SECRET` wajib diisi (nilai acak, bukan default).
- Proxy/reverse proxy harus melewati `Content-Type: application/pdf`.
- Timeout reverse proxy minimal 60 detik untuk export individual.

## 18. Known Limitations

- `page.pdf` ukuran fisik bergantung pada dukungan Chromium terhadap custom
  size (Setengah Folio 210×165 non-standar). Disarankan uji di target.
- Perkiraan jumlah halaman dari `countPdfPages` adalah estimasi sederhana.

## 19. Troubleshooting

- **HTTP 308/307 pada render**: pastikan middleware membebaskan `/render`.
- **Timeout**: periksa apakah server dapat diakses dari Chromium (APP_ORIGIN),
  apakah browser executable tersedia (CHROME_PATH), apakah PDF_RENDER_SECRET
  konsisten.
- **"Renderer PDF tidak tersedia"**: pastikan Chrome/Chromium terpasang dan
  `CHROME_PATH` benar.

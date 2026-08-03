# PRD Phase 4 — Template, Preview, dan Cetak Surat Jalan

**Project:** Sistem Surat Jalan Digital  
**Perusahaan:** CV. Pramudya Putra  
**Versi:** 1.0  
**Tanggal:** 2 Agustus 2026  
**Status:** Siap digunakan sebagai acuan implementasi Codex  
**Branch sumber:** `phase/03`  
**Branch target:** `phase/04-delivery-note-printing`

---

## 1. Ringkasan Eksekutif

Phase 4 membangun dokumen Surat Jalan dinamis berdasarkan desain asli CV. Pramudya Putra. Dokumen harus dibuat ulang menggunakan React, HTML, dan CSS, bukan menggunakan gambar scan sebagai background. Data dokumen diambil dari Purchase Order, Delivery Note, dan Delivery Note Item yang sudah tersedia setelah Phase 3.

User dapat membuka preview Surat Jalan, kembali ke editor untuk melengkapi atau mengoreksi data, lalu mencetak dokumen individual. Status cetak hanya berubah setelah user mengonfirmasi bahwa proses cetak berhasil.

Ukuran fisik dokumen adalah **setengah folio/F4 landscape: 210 × 165 mm**.

---

## 2. Latar Belakang

Phase 3 telah menyediakan:

- Login dan session.
- Dashboard.
- Halaman Data PO.
- Upload dan import Excel.
- Daftar dan detail PO.
- Detail serta editor Surat Jalan.
- Pengelolaan item.
- Status `PRINTED` dan `NOT_PRINTED`.
- Audit cetak berupa `firstPrintedAt`, `lastPrintedAt`, dan `printCount`.
- Penghapusan PO.
- Duplicate detection dan re-import.

Phase 4 menggunakan fondasi tersebut untuk menghasilkan dokumen Surat Jalan yang siap diperiksa dan dicetak.

---

## 3. Tujuan

1. Membangun template Surat Jalan yang menyerupai desain referensi.
2. Menghubungkan template dengan data database secara dinamis.
3. Menjaga ukuran cetak 210 × 165 mm.
4. Memungkinkan user melengkapi atau mengedit data sebelum cetak melalui editor Phase 3.
5. Menyediakan preview yang konsisten dengan hasil cetak.
6. Menyediakan cetak individual menggunakan browser.
7. Memperbarui status dan audit cetak hanya setelah konfirmasi user.
8. Mempertahankan seluruh fungsi Phase 3 tanpa regresi.

---

## 4. Non-Tujuan

Phase 4 tidak mencakup:

- Download PDF.
- Cetak massal beberapa Surat Jalan.
- Tanda tangan digital.
- Pengiriman email.
- Penyimpanan hasil cetak sebagai file.
- Perubahan parser Excel.
- Perubahan besar pada struktur Data PO.
- Desain ulang total aplikasi.
- Merge ke `main`.

---

## 5. Pengguna dan Hak Akses

### 5.1 Admin

Admin dapat:

- Membuka preview.
- Mengedit data melalui editor.
- Mencetak Surat Jalan.
- Mengonfirmasi hasil cetak.
- Mencetak ulang.
- Melihat audit cetak.

Semua mutation cetak wajib memverifikasi session dan role pada server.

---

## 6. Aset Referensi

Aset berada pada:

```text
docs/design-reference/
├── surat-jalan-original-scan-setengah-folio-300dpi.jpg
├── surat-jalan-template-kosong-setengah-folio-300dpi.png
└── surat-jalan-template-kosong-setengah-folio.pdf

docs/logo/
└── logo-cv-pramudya-putra-high-resolution.png
```

Logo runtime:

```text
public/brand/logo-cv-pramudya-putra.png
```

Aturan:

- JPG menjadi pembanding dokumen nyata.
- PNG menjadi referensi visual.
- PDF menjadi acuan ukuran fisik.
- Logo digunakan sebagai elemen gambar terpisah.
- Gambar template tidak boleh menjadi background final.
- Template wajib dibangun menggunakan React, HTML, dan CSS.

---

## 7. Ukuran dan Orientasi Dokumen

| Properti | Nilai |
|---|---|
| Jenis kertas | Setengah folio/F4 |
| Lebar | 210 mm |
| Tinggi | 165 mm |
| Orientasi | Landscape |
| Background | Putih |
| Skala cetak | 100% |
| Margin CSS | 0 |
| Unit layout utama | mm |

CSS dasar:

```css
.delivery-note-page {
  width: 210mm;
  height: 165mm;
}

@page {
  size: 210mm 165mm;
  margin: 0;
}
```

---

## 8. Alur Pengguna

```text
Login
→ Dashboard
→ Data PO
→ Buka PO
→ Pilih Cabang/Surat Jalan
→ Detail Surat Jalan
→ Edit data bila diperlukan
→ Preview Surat Jalan
→ Cetak
→ Konfirmasi hasil cetak
→ Status dan audit diperbarui
```

Preview tidak mengubah status.

Membuka dialog cetak tidak mengubah status.

Status hanya berubah setelah user memilih **“Ya, Tandai Sudah Dicetak”**.

---

## 9. Route

| Route | Fungsi |
|---|---|
| `/surat-jalan/[id]` | Detail Surat Jalan |
| `/surat-jalan/[id]/edit` | Edit Surat Jalan |
| `/surat-jalan/[id]/preview` | Preview dan cetak |
| `/po/[id]` | Detail PO dan daftar Surat Jalan |

Pada detail Surat Jalan tambahkan tombol **Lihat Preview**.

Pada preview tampilkan:

- Breadcrumb.
- Kembali ke detail.
- Edit Data.
- Cetak Surat Jalan.
- Badge status.
- Audit cetak.
- Area preview dokumen.

Elemen aplikasi tidak boleh ikut tercetak.

---

## 10. Struktur Visual Template

### 10.1 Kop Kiri Atas

- Logo.
- CV. Pramudya Putra.
- Tagline.
- Alamat.
- Nomor telepon.

### 10.2 Informasi Kanan Atas

- Bandung, tanggal.
- Kepada Yth.
- Nama perusahaan penerima.
- Cabang.
- Ruang informasi tambahan bila tersedia.

### 10.3 Informasi Dokumen

- Surat Jalan No.
- Kendaraan.
- Nomor kendaraan.
- PO tambahan.
- Nomor PO utama.

### 10.4 Tabel Barang

Kolom:

1. BANYAKNYA
2. NAMA BARANG
3. KETERANGAN

### 10.5 Bagian Bawah

- Tanda Terima.
- Nama penerima atau ruang tulisan manual.
- Catatan penerimaan barang.
- Hormat Kami.
- CV. Pramudya Putra.
- Ruang tanda tangan.

---

## 11. Pemetaan Data

| Elemen Template | Sumber Data |
|---|---|
| Nomor Surat Jalan | `DeliveryNote.documentNumber` |
| Tanggal | `DeliveryNote.documentDate` |
| Perusahaan penerima | `DeliveryNote.recipientCompanyName` atau snapshot perusahaan yang benar |
| Kode perusahaan | `PurchaseOrder.companyCode` atau struktur schema aktual |
| Cabang | `DeliveryNote.branchName` |
| Nomor PO | `PurchaseOrder.poNumber` |
| Kendaraan | `DeliveryNote.vehicle` |
| Nomor kendaraan | `DeliveryNote.vehicleNumber` |
| PO tambahan | `DeliveryNote.additionalPoNumber` |
| Nama penerima | `DeliveryNote.recipientName` |
| Quantity | `DeliveryNoteItem.quantity` |
| Satuan | `DeliveryNoteItem.unit` |
| Nama barang | `DeliveryNoteItem.displayProductName` |
| Keterangan | `DeliveryNoteItem.description` |
| Urutan | `DeliveryNoteItem.sortOrder` |

Ketentuan:

- Gunakan `displayProductName`.
- Jangan mengubah `originalProductName`.
- Urutkan item berdasarkan `sortOrder`, lalu ID sebagai fallback.
- Jangan mengambil item milik Surat Jalan lain.

---

## 12. Data Otomatis dan Data Manual

### 12.1 Data Otomatis dari PO/Excel

- Nomor PO.
- Perusahaan.
- Kode perusahaan.
- Cabang.
- Quantity.
- Satuan.
- Nama barang.
- Keterangan bila tersedia.

### 12.2 Data yang Dilengkapi User

- Nomor Surat Jalan.
- Tanggal.
- Kendaraan.
- Nomor kendaraan.
- PO tambahan.
- Nama penerima.
- Keterangan item.
- Data opsional lainnya.

Pengeditan dilakukan pada route existing:

```text
/surat-jalan/[id]/edit
```

Tidak dibuat editor kedua di halaman preview.

---

## 13. Penanganan Data Kosong

Template tidak boleh menampilkan:

- `null`
- `undefined`
- `Invalid Date`
- `NaN`
- `[object Object]`

Aturan:

- Tanggal kosong: `Bandung, ____________________`
- Field teks kosong: ruang kosong atau garis sesuai desain.
- Keterangan kosong: cell kosong.
- Satuan kosong: hanya tampilkan quantity.
- Jangan menggunakan `-` jika desain lebih sesuai menggunakan ruang kosong.

---

## 14. Format Tanggal

Tanggal adalah business date.

Contoh:

```text
2026-08-02 → Bandung, 2 Agustus 2026
```

Ketentuan:

- Tidak boleh bergeser karena timezone.
- Tidak otomatis memakai tanggal hari ini.
- Tanggal berasal dari data Surat Jalan.
- Tanggal kosong menghasilkan garis kosong.

---

## 15. Format Quantity

Format:

```text
<quantity> <unit>
```

Contoh:

- `1000 pcs`
- `5 rim`
- `2 bk`

Jika satuan kosong, tampilkan quantity saja.

Nilai quantity tidak boleh diubah oleh formatter.

---

## 16. Tabel dan Pagination Item

Gunakan konstanta terpusat:

```text
DELIVERY_NOTE_ROWS_PER_PAGE
```

Aturan:

- Item sedikit: tambahkan baris kosong sampai tinggi tabel konsisten.
- Item sama dengan kapasitas: satu halaman.
- Item melebihi kapasitas: beberapa halaman.
- Jangan mengecilkan font secara ekstrem.
- Jangan memotong baris item.
- Ulangi header tabel pada halaman lanjutan.
- Ulangi identitas dokumen yang diperlukan.
- Tampilkan `Halaman x dari y`.
- Tidak boleh ada item hilang atau duplikat.

Pagination harus berupa utility murni yang dapat diuji.

---

## 17. Preview

Preview harus:

- Menampilkan data database aktual.
- Mempertahankan rasio 210 × 165 mm.
- Memiliki shadow hanya pada layar.
- Berada di tengah.
- Dapat di-scale atau di-scroll pada layar kecil.
- Tidak berubah menjadi layout mobile.
- Tidak mengubah status cetak.
- Tidak mengubah `printCount`.

---

## 18. Print CSS

Saat print:

- Hanya dokumen terlihat.
- Sidebar, header, breadcrumb, tombol, badge, dan audit disembunyikan.
- Shadow dihilangkan.
- Background aplikasi dihilangkan.
- Warna logo dan garis dipertahankan.
- Tidak ada halaman kosong tambahan.
- Footer tidak keluar halaman.
- Tabel tidak terpotong.

Gunakan:

```css
-webkit-print-color-adjust: exact;
print-color-adjust: exact;
```

Petunjuk user:

- Skala 100%.
- Margin None.
- Orientasi Landscape.
- Matikan Headers and Footers.
- Pilih ukuran 210 × 165 mm bila tersedia.

---

## 19. Workflow Cetak

### 19.1 Konfirmasi Awal

Judul:

**Periksa Data Surat Jalan**

Isi:

Pastikan seluruh informasi dan daftar barang sudah benar sebelum membuka dialog cetak.

Tombol:

- Batal
- Lanjutkan Cetak

### 19.2 Browser Print

Setelah user memilih Lanjutkan Cetak:

```javascript
window.print()
```

Pemanggilan `window.print()` tidak mengubah status.

### 19.3 Konfirmasi Hasil

Judul:

**Konfirmasi Hasil Cetak**

Isi:

Apakah Surat Jalan berhasil dicetak?

Tombol:

- Belum / Batal
- Ya, Tandai Sudah Dicetak

Hanya konfirmasi berhasil yang mengubah database.

---

## 20. Status dan Audit Cetak

### 20.1 Cetak Pertama

```text
printStatus    = PRINTED
firstPrintedAt = waktu server
lastPrintedAt  = waktu server
printCount     = 1
```

### 20.2 Cetak Ulang

```text
printStatus    = PRINTED
firstPrintedAt = tetap
lastPrintedAt  = waktu server terbaru
printCount     = printCount + 1
```

### 20.3 Edit Setelah Cetak

```text
printStatus    = NOT_PRINTED
firstPrintedAt = dipertahankan
lastPrintedAt  = dipertahankan
printCount     = dipertahankan
```

Server tidak boleh mempercayai `printCount` dari client.

Mutation wajib:

- Memverifikasi session.
- Memverifikasi role.
- Memverifikasi Delivery Note tersedia.
- Menggunakan waktu server.
- Menggunakan transaction.
- Memeriksa optimistic concurrency.

---

## 21. Informasi Status pada Preview

Jika belum dicetak:

- Badge: Belum Dicetak.

Jika sudah dicetak:

- Badge: Sudah Dicetak.
- Pertama dicetak.
- Terakhir dicetak.
- Jumlah cetak.

Informasi audit hanya tampil pada area aplikasi, bukan dokumen fisik.

---

## 22. Error Handling

Pesan user menggunakan Bahasa Indonesia.

Contoh:

- Data Surat Jalan tidak ditemukan.
- Data telah berubah. Muat ulang preview sebelum mencetak.
- Sesi Anda telah berakhir.
- Anda tidak memiliki izin untuk mencetak.
- Status cetak gagal diperbarui.
- Terjadi kesalahan saat memuat preview.

Jangan menampilkan stack trace Prisma pada UI.

---

## 23. Keamanan

- Preview dan mutation dilindungi session.
- Role diperiksa pada server.
- User tidak boleh mencetak Delivery Note yang tidak dapat diakses.
- ID client tidak boleh dipercaya tanpa query server.
- `printCount`, timestamp, dan status dihitung server-side.
- Tidak ada password, token, atau credential pada log.
- Jangan menggunakan HTML dari database tanpa escaping.

---

## 24. Performance

- Preview hanya mengambil satu Delivery Note beserta itemnya.
- Gunakan `select` yang spesifik.
- Hindari N+1.
- Jangan parsing Excel pada preview.
- Jangan mengambil seluruh PO bila tidak diperlukan.
- Revalidate hanya route terkait:
  - `/dashboard`
  - `/po`
  - `/po/[poId]`
  - `/surat-jalan/[id]`
  - `/surat-jalan/[id]/preview`

---

## 25. Accessibility

- Tombol dapat digunakan dengan keyboard.
- Dialog memiliki focus management.
- Focus tetap berada di dialog.
- Escape dapat menutup dialog sebelum submit.
- Status tidak hanya dibedakan berdasarkan warna.
- Progress dan badge memiliki label teks.
- Logo memiliki alt text yang sesuai.
- Tabel menggunakan header semantic.

---

## 26. Responsive Behaviour

Viewport uji:

- 1440 × 900
- 1280 × 800
- 768 × 1024
- 390 × 844

Ketentuan:

- Area aplikasi responsive.
- Dokumen mempertahankan proporsi fisik.
- Mobile menggunakan scale atau horizontal scroll.
- Dokumen tidak disusun ulang menjadi tampilan mobile.
- Dialog tidak keluar viewport.

---

## 27. Struktur Kode yang Disarankan

```text
src/components/delivery-note-template/
├── DeliveryNoteDocument.tsx
├── DeliveryNoteHeader.tsx
├── DeliveryNoteRecipient.tsx
├── DeliveryNoteInformation.tsx
├── DeliveryNoteItemsTable.tsx
├── DeliveryNoteFooter.tsx
├── DeliveryNotePreviewShell.tsx
├── PrintDeliveryNoteButton.tsx
├── ConfirmPrintDialog.tsx
├── ConfirmPrintResultDialog.tsx
└── delivery-note-template.module.css

src/lib/delivery-note-template/
├── mapper.ts
├── formatter.ts
├── pagination.ts
├── constants.ts
└── types.ts
```

Nama folder boleh menyesuaikan arsitektur existing.

---

## 28. Pengujian Otomatis

### 28.1 Data Mapping

- Nomor PO benar.
- Perusahaan benar.
- Cabang benar.
- Nomor Surat Jalan benar.
- Item berurutan.
- `displayProductName` digunakan.
- `originalProductName` tidak berubah.
- Field kosong aman.

### 28.2 Tanggal

- Business date tidak bergeser.
- Tanggal kosong aman.

### 28.3 Pagination

- Item sedikit menghasilkan baris kosong.
- Kapasitas penuh menghasilkan satu halaman.
- Item banyak menghasilkan beberapa halaman.
- Tidak ada item hilang.
- Tidak ada item duplikat.

### 28.4 Preview

- Membuka preview tidak mengubah status.
- Membuka preview tidak mengubah `printCount`.

### 28.5 Print

- Batal awal tidak mengubah status.
- `window.print()` tidak mengubah status.
- Pilih Belum tidak mengubah status.
- Konfirmasi berhasil mengubah menjadi `PRINTED`.
- First print mengisi audit.
- Reprint memperbarui audit.
- Mutation tanpa session ditolak.
- Concurrency conflict ditolak.

### 28.6 Regression

- Edit setelah print kembali `NOT_PRINTED`.
- Audit cetak dipertahankan.
- Test Phase 3 tetap lulus.

---

## 29. Sample Verification

Expected sample:

| Data | Nilai |
|---|---|
| PO | `678/PPU SOF CCM/VII/2026` |
| Perusahaan | `PT. SUMMIT OTO FINANCE` |
| Total Surat Jalan | 92 |
| Total Item | 462 |

Cianjur:

1. Kartu Pembayaran — 1000
2. Kop Surat SOF (HVS) — 5
3. Stiker Label Kendaraan Tarikan — 500

Preview Cianjur harus:

- Menampilkan PO dan perusahaan yang benar.
- Menampilkan tiga item tersebut.
- Tidak menampilkan data cabang lain.
- Muat satu halaman.
- Memiliki baris kosong pelengkap.

---

## 30. UAT Manual

1. Login.
2. Buka Data PO.
3. Buka PO sample.
4. Cari Cianjur.
5. Buka detail.
6. Buka preview.
7. Periksa desain dan ukuran.
8. Periksa tiga item.
9. Klik Edit Data.
10. Isi tanggal atau kendaraan.
11. Simpan.
12. Buka preview kembali.
13. Pastikan perubahan tampil.
14. Klik Cetak.
15. Batal pada konfirmasi awal.
16. Pastikan status tidak berubah.
17. Buka cetak lagi.
18. Setelah dialog print, pilih Belum.
19. Pastikan status tidak berubah.
20. Konfirmasi berhasil pada data development aman.
21. Pastikan status dan audit benar.
22. Cetak ulang.
23. Pastikan `printCount` bertambah.
24. Edit data.
25. Pastikan status kembali Belum Dicetak.

---

## 31. Acceptance Criteria

Phase 4 dianggap selesai jika:

1. Branch dibuat dari `phase/03`.
2. Aset tersedia.
3. Template dibuat dengan React/HTML/CSS.
4. Gambar template tidak menjadi background.
5. Ukuran 210 × 165 mm.
6. Orientasi landscape.
7. Data berasal dari database.
8. Field kosong aman.
9. Preview dapat dibuka.
10. Edit sebelum cetak tersedia.
11. Tabel menyerupai referensi.
12. Baris kosong konsisten.
13. Pagination item bekerja.
14. Print CSS hanya mencetak dokumen.
15. Preview tidak mengubah status.
16. Membuka print tidak mengubah status.
17. Status berubah hanya setelah konfirmasi.
18. Audit first print benar.
19. Audit reprint benar.
20. Edit setelah print kembali `NOT_PRINTED`.
21. Cianjur menampilkan tiga item yang benar.
22. Tidak ada regresi Phase 3.
23. Prisma validate PASS.
24. Lint PASS.
25. Typecheck PASS atau NOT AVAILABLE.
26. Build PASS.
27. Test PASS.
28. Verify sample PASS.
29. Tidak ada PDF.
30. Tidak ada batch print.
31. Tidak ada commit sebelum review.
32. Tidak ada push sebelum review.

---

## 32. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Browser tidak mendukung custom paper size | Hasil cetak tidak presisi | Dokumentasikan pengaturan printer dan uji Chromium |
| Gambar referensi tidak presisi | Template menyimpang | Gunakan PDF sebagai acuan ukuran |
| Status tercatat walau cetak batal | Data audit salah | Gunakan konfirmasi hasil cetak |
| Data diedit setelah cetak | Dokumen fisik tidak sesuai | Reset status ke `NOT_PRINTED` |
| Item terlalu banyak | Footer/tanda tangan terpotong | Pagination terkontrol |
| Timezone menggeser tanggal | Tanggal dokumen salah | Gunakan business-date formatter |
| Layout mobile rusak | Preview tidak dapat digunakan | Scale atau scroll tanpa mengubah dokumen |

---

## 33. Deliverables

1. Route preview Surat Jalan.
2. Template React/HTML/CSS.
3. CSS ukuran 210 × 165 mm.
4. Print CSS.
5. Mapping dan formatter.
6. Pagination item.
7. Dialog konfirmasi cetak.
8. Mutation status dan audit cetak.
9. Test otomatis.
10. Browser dan print-preview verification.
11. Laporan akhir Phase 4.

---

## 34. Definition of Done

Phase 4 dinyatakan selesai ketika:

- Seluruh acceptance criteria terpenuhi.
- Tidak ada temuan Critical atau High.
- Sample Cianjur tervalidasi.
- Print preview setengah folio tervalidasi.
- Phase 3 tidak mengalami regresi.
- Hasil siap untuk UAT manual user.
- Belum ada commit atau push sampai user menyetujui hasil.

---

## 35. Catatan Implementasi untuk Codex

- Baca dokumen ini sebelum mengubah kode.
- Audit schema dan komponen existing.
- Jangan membangun ulang Phase 3.
- Jangan memakai gambar dokumen sebagai background final.
- Jangan mengubah status saat preview atau saat `window.print()` dipanggil.
- Gunakan data aktual dan server-side authorization.
- Berikan laporan lengkap sebelum commit dan push.

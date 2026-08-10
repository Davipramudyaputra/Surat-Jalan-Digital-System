# PRD Phase 6 — PDF Export, Batch Preview, Batch Print, Combined PDF, dan ZIP

**Project:** Sistem Surat Jalan Digital
**Perusahaan:** CV. Pramudya Putra
**Versi:** 1.0
**Status:** Draft siap review dan implementasi
**Branch sumber:** `main`
**Branch target:** `phase/06-pdf-batch-export`
**Branch final:** `phase/06`

**Urutan implementasi yang disarankan:**

1. Bagian 1 — Individual PDF Export dan PDF Rendering Engine
2. Bagian 2 — Batch Selection, Batch Preview, dan Batch Print
3. Bagian 3 — Combined PDF dan ZIP Export

---

## 1. Ringkasan Eksekutif

Phase 6 menambahkan kemampuan output dokumen Surat Jalan secara individual dan massal.

Fitur utama Phase 6:

- download PDF individual;
- memilih banyak Surat Jalan;
- batch preview;
- batch print;
- combined PDF;
- ZIP berisi PDF individual;
- audit export;
- audit batch print;
- progress dan error handling;
- batas jumlah dokumen, halaman, ukuran file, dan waktu proses.

Phase 6 menggunakan template Surat Jalan, paper profile, pagination, print flow, dan status cetak yang telah tersedia pada Phase 4.

Phase 6 juga menggunakan Global History, Audit Trail, authorization, active-only query, Soft Delete, dan Recycle Bin yang telah tersedia pada Phase 5.

Phase 6 tidak boleh membuat template dokumen kedua yang tampilannya berbeda dari preview dan print existing.

---

## 2. Latar Belakang

Sistem telah memiliki:

- authentication dan session;
- dashboard;
- upload/import Excel;
- duplicate detection;
- re-import;
- Purchase Order;
- Surat Jalan;
- item Surat Jalan;
- edit PO;
- edit Surat Jalan;
- template Surat Jalan;
- preview;
- Setengah Folio;
- A4;
- A5;
- B3;
- custom paper;
- orientation;
- pagination;
- Ctrl + P;
- Command + P;
- print confirmation;
- print result confirmation;
- `printStatus`;
- `firstPrintedAt`;
- `lastPrintedAt`;
- `printCount`;
- Global History;
- contextual history;
- Soft Delete;
- Recycle Bin;
- restore;
- permanent delete;
- active-only query.

Kebutuhan berikutnya adalah menyediakan file digital dan output massal tanpa mengubah kebenaran status cetak.

---

## 3. Tujuan

1. Menyediakan download PDF individual.
2. Menjaga hasil PDF konsisten dengan preview dan print existing.
3. Menyediakan batch selection.
4. Menyediakan batch preview.
5. Menyediakan batch print.
6. Menyediakan combined PDF.
7. Menyediakan ZIP berisi PDF individual.
8. Menjaga urutan dokumen stabil.
9. Menjaga ukuran kertas dan orientation konsisten.
10. Menjaga pagination dokumen panjang.
11. Membedakan export PDF dengan print.
12. Menjaga `printStatus` tidak berubah saat download.
13. Memperbarui status cetak hanya setelah konfirmasi hasil print.
14. Mencatat PDF export dan batch operation ke Global History.
15. Mengecualikan data di Recycle Bin.
16. Menerapkan authorization.
17. Menangani batas dokumen, halaman, ukuran file, timeout, dan memory.
18. Menjaga file temporary tidak tertinggal.
19. Menjaga Phase 1 sampai Phase 5 tidak mengalami regresi.

---

## 4. Non-Scope

Phase 6 tidak mencakup:

- email attachment otomatis;
- pengiriman PDF melalui WhatsApp;
- tanda tangan digital;
- QR signature verification;
- penyimpanan PDF permanen di PostgreSQL;
- document management system;
- approval berjenjang;
- e-signature;
- batch lintas banyak PO pada versi pertama;
- drag-and-drop urutan dokumen;
- asynchronous queue besar pada versi pertama;
- scheduled export;
- auto email;
- auto purge file export;
- production deployment;
- production migration;
- cloud storage permanen;
- PDF password protection;
- PDF encryption;
- OCR;
- watermark dinamis selain kebutuhan resmi yang sudah ada;
- fitur Phase 7.

---

## 5. Hubungan dengan Phase Sebelumnya

### 5.1 Phase 4

Phase 6 harus menggunakan:

- canonical Surat Jalan template;
- Setengah Folio sebagai format utama;
- ukuran fisik 210 × 165 mm;
- A4;
- A5;
- B3;
- custom paper;
- orientation;
- margin;
- pagination;
- preview canvas;
- print CSS;
- print confirmation;
- print result confirmation;
- status cetak;
- audit cetak.

Jangan menggambar ulang template PDF secara terpisah jika dapat menggunakan template canonical existing.

### 5.2 Phase 5

Phase 6 harus mematuhi:

- Global History;
- AuditEvent;
- actor dari session;
- timestamp server;
- authorization;
- active-only query;
- Soft Delete;
- Recycle Bin;
- immutable audit.

Data yang berada di Recycle Bin:

- tidak boleh dipilih untuk batch;
- tidak boleh didownload;
- tidak boleh dicetak;
- tidak boleh masuk combined PDF;
- tidak boleh masuk ZIP;
- tidak boleh diproses melalui direct URL aktif.

---

## 6. Pembagian Implementasi

Phase 6 menggunakan satu branch:

```text
phase/06-pdf-batch-export
```

### Bagian 1 — Individual PDF Export dan Rendering Engine

Mencakup:

- audit canonical template;
- pemilihan PDF renderer;
- endpoint/service PDF;
- download PDF individual;
- paper profile;
- orientation;
- pagination;
- file naming;
- authorization;
- export history;
- tests.

### Bagian 2 — Batch Selection, Preview, dan Print

Mencakup:

- multi-select;
- select all page;
- select all filtered result;
- deselect;
- batch toolbar;
- validation;
- stable ordering;
- batch preview;
- batch print;
- print confirmation;
- print result confirmation;
- transactional status update;
- PRINT dan REPRINT per dokumen;
- batch audit;
- tests.

### Bagian 3 — Combined PDF dan ZIP Export

Mencakup:

- combined PDF;
- individual PDF generation;
- ZIP packaging;
- filename collision handling;
- process limits;
- temporary file cleanup;
- failure handling;
- performance test;
- final UAT.

---

## 7. Keputusan Produk Utama

### 7.1 Batch Scope

Versi pertama hanya mendukung batch Surat Jalan dalam satu Purchase Order.

```text
1 batch = 1 Purchase Order
```

Batch lintas PO ditunda.

### 7.2 Paper Profile

Satu batch menggunakan:

```text
1 paper profile
1 orientation
```

Seluruh dokumen dalam combined PDF harus menggunakan konfigurasi yang sama.

### 7.3 Default Paper Profile

Default:

```text
Setengah Folio
Landscape
210 × 165 mm
```

### 7.4 Download PDF dan Status Cetak

Download PDF tidak dianggap sebagai print.

```text
Download PDF
→ printStatus tidak berubah
→ printCount tidak bertambah
→ firstPrintedAt tidak berubah
→ lastPrintedAt tidak berubah
```

### 7.5 Print

Print hanya dianggap berhasil setelah user mengonfirmasi hasil cetak.

```text
window.print()
→ belum mengubah status

Konfirmasi hasil:
Ya, Tandai Sudah Dicetak
→ update status
→ update timestamp
→ increment printCount
→ AuditEvent PRINT atau REPRINT
```

### 7.6 File Storage

File dibuat on-demand.

```text
Generate
→ stream/download
→ cleanup temporary resources
```

PDF dan ZIP tidak disimpan di PostgreSQL.

---

# BAGIAN A — PDF RENDERING ENGINE

## 8. Canonical Template

Satu canonical template harus digunakan sebagai sumber tampilan:

- preview;
- print;
- PDF individual;
- combined PDF;
- PDF dalam ZIP.

Tujuan:

- mencegah perbedaan layout;
- mencegah duplikasi template;
- mempermudah maintenance;
- menjaga hasil Phase 4.

Jika renderer membutuhkan adapter khusus, adapter hanya mengubah mekanisme render, bukan desain dokumen.

---

## 9. Pilihan Rendering Engine

Rekomendasi utama:

```text
Canonical HTML/CSS template
+ Headless Chromium
```

Contoh teknologi yang dapat diaudit:

- Playwright;
- Puppeteer;
- Chromium.

Keputusan final harus berdasarkan environment project dan server.

### Kriteria renderer

- mendukung HTML/CSS existing;
- mendukung ukuran kertas custom;
- mendukung print background;
- mendukung page break;
- mendukung font;
- mendukung server-side generation;
- dapat digunakan di Docker;
- dapat mengontrol timeout;
- dapat cleanup browser/page;
- dapat menghasilkan buffer atau stream.

### Larangan

- jangan membuat template React PDF kedua tanpa alasan kuat;
- jangan mengubah canonical template hanya agar mudah diexport;
- jangan mengganti ukuran fisik Setengah Folio;
- jangan mengandalkan screenshot PNG menjadi PDF;
- jangan menggunakan image-only PDF.

---

## 10. Server Requirements

Sebelum implementasi, audit:

- operating system;
- Docker/non-Docker;
- Node.js version;
- RAM;
- CPU;
- Chromium availability;
- temporary directory;
- file permission;
- reverse proxy;
- request timeout;
- deployment environment;
- concurrency.

Jika environment belum diketahui, implementasi harus:

- terdokumentasi;
- memiliki fallback error yang jelas;
- tidak berasumsi production mendukung Chromium.

---

## 11. Individual PDF Export

Entry point:

- Detail Surat Jalan;
- Preview Surat Jalan.

Action:

```text
Download PDF
```

Download PDF menjadi secondary action.

`Cetak Surat Jalan` tetap menjadi primary action.

### Input

- Surat Jalan ID;
- paper profile;
- orientation;
- margin/configuration yang diperbolehkan;
- session.

### Server-side validation

- user terautentikasi;
- user berizin;
- Surat Jalan aktif;
- parent PO aktif;
- bukan data Recycle Bin;
- data lengkap;
- paper profile valid;
- orientation valid;
- custom dimension valid;
- template render berhasil.

### Output

- `application/pdf`;
- filename aman;
- no-cache atau cache policy yang sesuai;
- response tidak mengubah print status.

---

## 12. Individual PDF Naming

Format rekomendasi:

```text
Surat-Jalan_<Nomor-PO>_<Cabang>.pdf
```

Contoh:

```text
Surat-Jalan_678-PPU-SOF-CCM-VII-2026_Bandar-Jaya.pdf
```

Sanitasi karakter:

```text
/ \ : * ? " < > |
```

Aturan:

- trim whitespace;
- ganti karakter terlarang dengan `-`;
- hindari separator berulang;
- batasi panjang filename;
- fallback jika cabang kosong;
- hindari hidden file;
- hindari nama reserved Windows;
- gunakan `.pdf` satu kali.

---

## 13. PDF Paper Profiles

PDF individual harus mendukung paper profile existing:

- Setengah Folio;
- A4;
- A5;
- B3;
- Custom.

Setengah Folio:

```text
210 × 165 mm
Landscape
```

Custom paper harus memvalidasi:

- width minimum;
- width maximum;
- height minimum;
- height maximum;
- orientation;
- unit.

Jangan mempercayai ukuran mentah dari client tanpa validasi.

---

## 14. PDF Pagination

Pagination harus konsisten dengan preview dan print.

Syarat:

- header dokumen sesuai desain;
- tabel tidak keluar halaman;
- item panjang wrap dengan benar;
- page break tidak memotong row secara salah;
- halaman lanjutan konsisten;
- footer/signature area sesuai desain;
- nomor halaman jika digunakan konsisten;
- 25+ item dapat menghasilkan multi-page tanpa clipping.

Jangan mengecilkan font secara ekstrem agar seluruh item masuk satu halaman.

---

# BAGIAN B — BATCH SELECTION DAN PREVIEW

## 15. Entry Point Batch

Versi awal:

```text
Detail Purchase Order
```

Daftar Surat Jalan pada satu PO memiliki selection.

Opsional jika struktur existing sesuai:

```text
Daftar Surat Jalan
```

Tetapi batch lintas PO tetap dilarang pada versi pertama.

---

## 16. Batch Selection

Fitur minimum:

- pilih satu Surat Jalan;
- pilih beberapa Surat Jalan;
- pilih semua pada halaman;
- pilih semua hasil filter dalam PO;
- batalkan semua;
- tampilkan jumlah terpilih;
- mempertahankan selection saat pagination bila aman;
- menolak data tidak aktif.

Selection harus menggunakan ID server yang valid.

Client tidak boleh mengirim object data sebagai sumber kebenaran.

Server memuat ulang data berdasarkan ID.

---

## 17. Batch Toolbar

Saat ada selection:

```text
12 Surat Jalan dipilih

[Batalkan Pilihan]
[Batch Preview]
[Download PDF Gabungan]
[Download ZIP]
```

Batch print dilakukan melalui Batch Preview.

Jangan memenuhi tabel dengan action berlebihan.

---

## 18. Stable Ordering

Urutan default:

1. `sortOrder` existing bila tersedia;
2. nomor urut cabang;
3. nama cabang;
4. document number;
5. ID sebagai tie-breaker.

Gunakan explicit `orderBy`.

Jangan mengandalkan urutan database.

Batch preview harus menunjukkan urutan final.

---

## 19. Batch Validation

Sebelum preview/output, validasi seluruh ID:

- masih aktif;
- masih berada pada PO yang sama;
- tidak berada di Recycle Bin;
- actor berizin;
- data lengkap;
- tidak duplikat;
- paper profile valid;
- tidak melebihi batas.

Jika satu dokumen invalid:

- combined PDF diblokir;
- batch print diblokir;
- ZIP diblokir pada versi awal;
- user mendapatkan daftar dokumen invalid.

Tidak boleh diam-diam menghilangkan dokumen.

---

## 20. Batch Preview

Batch Preview menampilkan:

- nomor PO;
- perusahaan;
- jumlah dokumen;
- total item;
- estimasi halaman;
- paper profile;
- orientation;
- urutan dokumen;
- status cetak setiap dokumen;
- warning;
- invalid document;
- action output.

Ringkasan status:

```text
Belum pernah dicetak: 70
Akan dicetak ulang: 22
Total: 92
```

---

## 21. Batch Limits

Default recommendation:

```text
Maksimum Surat Jalan: 100
Maksimum halaman: 500
Maksimum hasil file: 200 MB
```

Nilai final dapat dibuat configurable.

Batas harus divalidasi server-side.

Pesan:

```text
Batch terlalu besar untuk diproses sekaligus.
Kurangi jumlah Surat Jalan yang dipilih.
```

---

# BAGIAN C — BATCH PRINT

## 22. Batch Print Workflow

```text
Pilih Surat Jalan
→ Batch Preview
→ Validasi
→ Periksa Data
→ Cetak
→ Konfirmasi Hasil Cetak
→ Update status
→ Audit
```

`window.print()` tidak langsung mengubah status.

---

## 23. Batch Print Confirmation

Dialog awal:

**Judul:**

```text
Periksa Batch Surat Jalan
```

Tampilkan:

- nomor PO;
- jumlah dokumen;
- jumlah halaman;
- belum pernah dicetak;
- akan dicetak ulang;
- paper profile;
- orientation.

Action:

- Batal;
- Lanjutkan Cetak.

---

## 24. Batch Print Result Confirmation

Setelah print dialog selesai:

**Judul:**

```text
Konfirmasi Hasil Cetak Batch
```

Isi:

```text
Apakah seluruh Surat Jalan dalam batch berhasil dicetak?
```

Action:

- Belum / Batal;
- Ya, Tandai Semua Sudah Dicetak.

Versi awal menggunakan atomic confirmation.

Tidak mendukung konfirmasi sebagian dokumen.

Jika sebagian dokumen gagal secara fisik, user tidak boleh menandai seluruh batch berhasil.

---

## 25. Batch Print Status Update

Setelah konfirmasi berhasil:

- dokumen belum pernah dicetak menghasilkan `PRINT`;
- dokumen yang pernah dicetak menghasilkan `REPRINT`;
- `firstPrintedAt` diisi hanya pada first print;
- `lastPrintedAt` diperbarui;
- `printCount` bertambah per dokumen;
- batch ID yang sama digunakan;
- actor dari session;
- timestamp server.

Gunakan transaction bila ukuran transaksi masih aman.

Jika transaction gagal:

- tidak ada dokumen dianggap berhasil;
- tampilkan error aman;
- tidak membuat success audit event.

---

## 26. Batch Print History

Audit menggunakan sistem Phase 5.

Event yang diperlukan:

```text
BATCH_PRINT
BATCH_REPRINT
```

Selain event batch, keputusan implementasi dapat mempertahankan event per dokumen:

```text
PRINT
REPRINT
```

Rekomendasi:

- buat satu batch event sebagai summary;
- buat per-document event agar contextual history tetap lengkap;
- gunakan `batchId` yang sama.

Metadata batch:

- PO ID;
- document count;
- document IDs;
- first print count;
- reprint count;
- paper profile;
- orientation;
- page count;
- actor;
- timestamp;
- result.

Jangan menyimpan PDF binary ke AuditEvent.

---

# BAGIAN D — COMBINED PDF

## 27. Combined PDF

Combined PDF menggabungkan seluruh dokumen terpilih menjadi satu file.

Setiap Surat Jalan:

- dimulai pada halaman baru;
- menjaga pagination internal;
- menjaga paper profile;
- menjaga orientation;
- menjaga urutan batch.

Jangan menggabungkan dokumen dengan ukuran kertas berbeda dalam satu combined PDF pada versi awal.

---

## 28. Combined PDF Naming

Format:

```text
Surat-Jalan_<Nomor-PO>_<Jumlah-Dokumen>-Dokumen.pdf
```

Contoh:

```text
Surat-Jalan_678-PPU-SOF-CCM-VII-2026_92-Dokumen.pdf
```

---

## 29. Combined PDF Audit

Event:

```text
BATCH_PDF_EXPORT
```

Event dibuat setelah file berhasil dihasilkan.

Metadata:

- PO ID;
- document IDs;
- document count;
- page count;
- paper profile;
- orientation;
- filename;
- actor;
- timestamp;
- batch ID;
- duration;
- output size.

Download tidak mengubah print status.

---

# BAGIAN E — ZIP EXPORT

## 30. ZIP Export

ZIP berisi satu PDF individual per Surat Jalan.

Nama ZIP:

```text
Surat-Jalan_<Nomor-PO>_<Tanggal>.zip
```

Contoh isi:

```text
001_Bandar-Jaya_SJ-0001.pdf
002_Kotabumi_SJ-0002.pdf
003_Metro_SJ-0003.pdf
```

Nomor urut menggunakan zero-padding sesuai jumlah file.

---

## 31. ZIP Filename Collision

Jika nama file sama:

- gunakan nomor urut;
- gunakan document identity;
- jangan overwrite file di dalam ZIP;
- jangan menghilangkan file.

Semua filename harus disanitasi.

---

## 32. ZIP Audit

Event:

```text
ZIP_EXPORT
```

Metadata:

- PO ID;
- document count;
- document IDs;
- total page count;
- ZIP filename;
- output size;
- actor;
- timestamp;
- batch ID;
- duration.

ZIP export tidak mengubah print status.

---

# BAGIAN F — HISTORY DAN AUDIT

## 33. Event Phase 6

Tambahkan ke infrastruktur History existing:

```text
PDF_EXPORT
BATCH_PDF_EXPORT
ZIP_EXPORT
BATCH_PRINT
BATCH_REPRINT
```

Gunakan AuditEvent existing.

Jangan membuat tabel log kedua.

---

## 34. Audit Event Behaviour

### PDF_EXPORT

Dibuat setelah PDF individual berhasil dihasilkan.

### BATCH_PDF_EXPORT

Dibuat setelah combined PDF berhasil dihasilkan.

### ZIP_EXPORT

Dibuat setelah ZIP berhasil dihasilkan.

### BATCH_PRINT

Dibuat setelah user mengonfirmasi batch berhasil dan transaction sukses.

### BATCH_REPRINT

Digunakan dalam summary batch jika ada dokumen reprint.

Event gagal dapat dicatat sebagai application log terpisah jika sesuai arsitektur, tetapi tidak boleh disebut success event.

---

## 35. Contextual History

Detail Surat Jalan menampilkan:

- PDF export individual;
- PRINT;
- REPRINT;
- batch membership jika relevan.

Detail PO menampilkan:

- combined PDF;
- ZIP export;
- batch print;
- batch reprint.

Global History dapat memfilter event Phase 6.

---

# BAGIAN G — TEMPORARY FILE DAN CLEANUP

## 36. Temporary Resources

Jika renderer menggunakan:

- temporary HTML;
- temporary PDF;
- temporary ZIP;
- browser page;
- browser context;
- browser instance;

semuanya harus ditutup atau dihapus setelah proses.

Gunakan `try/finally`.

Jangan menyimpan file temporary permanen.

---

## 37. Streaming

Prioritaskan:

- buffer untuk file kecil;
- stream untuk file besar;
- backpressure;
- proper response headers;
- abort handling jika client disconnect.

Jangan membaca file besar berkali-kali tanpa kebutuhan.

---

## 38. Timeout

Setiap proses memiliki timeout.

Timeout harus menghasilkan pesan aman:

```text
Proses dokumen melebihi batas waktu.
Kurangi jumlah Surat Jalan dan coba kembali.
```

Jangan membiarkan browser/Chromium process menggantung.

---

# BAGIAN H — SECURITY

## 39. Authorization

Setiap export dan print harus memverifikasi:

- session;
- role;
- PO;
- Surat Jalan;
- active status;
- deleted status;
- ownership/authorization;
- batch membership;
- paper profile.

Jangan mempercayai ID list dari client.

---

## 40. Deleted Data

Data deleted harus ditolak pada:

- PDF individual;
- batch preview;
- batch print;
- combined PDF;
- ZIP.

Jika data berubah menjadi deleted setelah preview dibuka, server harus memvalidasi ulang sebelum output.

---

## 41. Input Validation

Validasi:

- UUID/ID;
- document count;
- duplicate ID;
- PO consistency;
- paper profile;
- orientation;
- custom width/height;
- filename input;
- batch limit;
- page limit;
- confirmation.

---

## 42. PDF Content Security

Jangan memasukkan:

- password;
- session;
- token;
- internal database ID yang tidak dibutuhkan;
- stack trace;
- internal path;
- secret;
- audit metadata internal.

---

# BAGIAN I — PERFORMANCE

## 43. Resource Limits

Default:

```text
100 Surat Jalan
500 halaman
200 MB
```

Tambahkan limit:

- request concurrency;
- Chromium page count;
- browser instance;
- render timeout;
- ZIP size;
- memory.

---

## 44. Concurrency

Hindari membuat satu browser instance per halaman tanpa batas.

Rekomendasi:

- reuse browser secara aman bila arsitektur mendukung;
- satu atau beberapa page per job;
- batasi concurrent export;
- cleanup selalu dijalankan.

---

## 45. Job Queue Decision

Versi awal:

```text
Synchronous processing
+ strict limits
```

Job queue belum dibuat.

Jika sample 92 dokumen tidak dapat diproses dengan stabil, lakukan revisi arsitektur sebelum release.

Jangan menambahkan queue secara diam-diam.

---

# BAGIAN J — USER INTERFACE

## 46. Individual Actions

Preview Surat Jalan:

```text
Kembali ke Detail
Edit Data
Download PDF
Cetak Surat Jalan
```

Detail Surat Jalan boleh memiliki shortcut Download PDF.

---

## 47. Batch Toolbar

Tampilkan hanya ketika selection > 0.

Informasi:

```text
12 Surat Jalan dipilih
```

Action:

- Batalkan Pilihan;
- Batch Preview;
- Download PDF Gabungan;
- Download ZIP.

---

## 48. Batch Preview UI

Tampilkan:

- PO;
- perusahaan;
- document count;
- item count;
- page estimate;
- paper profile;
- orientation;
- order;
- print status;
- validation result;
- warning;
- output actions.

---

## 49. Loading dan Progress

Jangan menampilkan progress palsu.

Jika progress per dokumen tidak tersedia:

```text
Sedang menyiapkan 92 dokumen...
```

Jika progress nyata tersedia:

```text
Menyiapkan dokumen 24 dari 92
```

---

## 50. Error State

Tampilkan:

- dokumen invalid;
- alasan invalid;
- output limit;
- timeout;
- renderer unavailable;
- permission error;
- deleted data;
- stale data.

Jangan diam-diam skip dokumen.

---

## 51. Responsive

Uji:

- 1440 × 900;
- 1280 × 800;
- 1024 × 768;
- 768 × 1024;
- 390 × 844.

Pastikan:

- selection dapat digunakan;
- batch toolbar tidak terpotong;
- preview summary responsif;
- dialog tetap dalam viewport;
- table menggunakan safe horizontal scroll;
- output button tetap dapat dijangkau.

---

## 52. Accessibility

Pastikan:

- checkbox memiliki label;
- select all memiliki mixed state;
- keyboard selection;
- focus ring;
- dialog focus trap;
- Escape menutup dialog sebelum mutation;
- icon button memiliki aria-label;
- loading status memiliki live region jika sesuai;
- error terhubung ke control;
- status tidak hanya dibedakan berdasarkan warna;
- touch target minimal 44 × 44 px.

---

# BAGIAN K — ERROR HANDLING

## 53. Pesan Error

Gunakan Bahasa Indonesia.

Contoh:

```text
Surat Jalan tidak ditemukan.
Surat Jalan berada di Recycle Bin.
Anda tidak memiliki izin.
Batch berisi data dari Purchase Order yang berbeda.
Batch terlalu besar untuk diproses.
Dokumen tidak dapat dirender.
Proses dokumen melebihi batas waktu.
PDF gagal dibuat.
ZIP gagal dibuat.
Data telah berubah. Muat ulang halaman.
```

Jangan tampilkan stack trace.

---

## 54. Partial Failure

Versi awal menggunakan atomic batch.

Jika satu dokumen invalid:

- combined PDF diblokir;
- ZIP diblokir;
- batch print diblokir.

User melihat daftar dokumen bermasalah.

Tidak ada partial ZIP atau partial combined PDF pada versi awal.

---

# BAGIAN L — DATABASE

## 55. Database Change

Phase 6 diharapkan menggunakan AuditEvent existing.

Perubahan schema hanya jika benar-benar diperlukan.

Kemungkinan perubahan:

- enum AuditAction;
- enum AuditSource;
- metadata support existing;
- optional export configuration table jika dibutuhkan dan disetujui.

Jangan membuat tabel PDF binary.

Jangan menyimpan output file di database.

---

## 56. Migration Safety

Jika enum audit berubah:

- buat migration aman;
- audit SQL;
- jangan reset database;
- jangan drop data;
- jangan mengubah migration lama.

Dilarang:

```text
prisma migrate reset
prisma db push --force-reset
docker compose down -v
DROP DATABASE
DROP TABLE
TRUNCATE
```

---

# BAGIAN M — AUTOMATED TESTING

## 57. Individual PDF Tests

1. PDF aktif berhasil.
2. Deleted data ditolak.
3. Unauthorized ditolak.
4. Setengah Folio benar.
5. A4 benar.
6. A5 benar.
7. B3 benar.
8. Custom valid berhasil.
9. Custom invalid ditolak.
10. Orientation benar.
11. Filename disanitasi.
12. PDF download tidak mengubah print status.
13. Event PDF_EXPORT dibuat.
14. Renderer cleanup berjalan.
15. Dokumen 25+ item menghasilkan pagination.

---

## 58. Batch Selection Tests

1. Pilih satu.
2. Pilih beberapa.
3. Select all page.
4. Select all filtered result.
5. Deselect.
6. Duplicate ID dinormalisasi atau ditolak.
7. ID dari PO lain ditolak.
8. Deleted ID ditolak.
9. Batch limit diterapkan.
10. Stable ordering benar.

---

## 59. Batch Print Tests

1. First print batch.
2. Reprint batch.
3. Mixed first print/reprint.
4. `window.print()` tidak mengubah status.
5. Cancel result tidak mengubah status.
6. Confirm result mengubah status.
7. `firstPrintedAt` hanya first print.
8. `lastPrintedAt` diperbarui.
9. `printCount` bertambah.
10. Transaction gagal tidak partial update.
11. Audit batch dibuat.
12. Per-document history dibuat.
13. Deleted document saat confirm menyebabkan validasi ulang.

---

## 60. Combined PDF Tests

1. Semua dokumen masuk.
2. Urutan benar.
3. Setiap dokumen mulai halaman baru.
4. Pagination internal benar.
5. Paper profile konsisten.
6. Orientation konsisten.
7. Filename benar.
8. Download tidak mengubah print status.
9. Event BATCH_PDF_EXPORT dibuat.
10. Limit document/page/file diterapkan.

---

## 61. ZIP Tests

1. Semua PDF masuk ZIP.
2. Urutan filename benar.
3. Tidak ada collision.
4. Sanitasi filename benar.
5. ZIP filename benar.
6. Download tidak mengubah print status.
7. Event ZIP_EXPORT dibuat.
8. Temporary file dibersihkan.
9. Limit diterapkan.
10. Atomic failure diterapkan.

---

## 62. Regression Tests

Pastikan tetap bekerja:

- login;
- logout;
- session;
- dashboard;
- import;
- duplicate;
- re-import;
- Data PO;
- edit;
- preview;
- print individual;
- paper profiles;
- Global History;
- contextual history;
- Recycle Bin;
- restore;
- permanent delete;
- active-only query;
- verify sample.

---

# BAGIAN N — SAMPLE VERIFICATION

## 63. Sample

Gunakan sample existing:

```text
PO: 678/PPU SOF CCM/VII/2026
Perusahaan: PT. SUMMIT OTO FINANCE
Total Surat Jalan: 92
Total Item: 462
```

Skenario:

1. Import sample.
2. Pilih satu Surat Jalan.
3. Download PDF individual.
4. Verifikasi print status tidak berubah.
5. Verifikasi PDF_EXPORT.
6. Pilih lima Surat Jalan.
7. Batch preview.
8. Combined PDF.
9. ZIP.
10. Batch print.
11. Konfirmasi hasil.
12. Verifikasi PRINT/REPRINT.
13. Pilih seluruh 92 Surat Jalan.
14. Verifikasi limit/performance.
15. Verifikasi combined PDF/ZIP.
16. Soft delete satu Surat Jalan.
17. Pastikan tidak dapat diproses.
18. Restore.
19. Pastikan dapat diproses kembali.
20. Permanent delete data uji lama.
21. Audit tetap tersedia.

Jangan mengubah expected sample.

---

# BAGIAN O — UAT MANUAL

## 64. Individual PDF UAT

1. Setengah Folio.
2. A4.
3. A5.
4. B3.
5. Custom.
6. Portrait.
7. Landscape.
8. Satu halaman.
9. Multi-page.
10. Nama cabang panjang.
11. Nama PO dengan karakter khusus.
12. Data di Recycle Bin.
13. Unauthorized access.

---

## 65. Batch UAT

1. Pilih satu.
2. Pilih semua halaman.
3. Pilih semua filter.
4. Deselect.
5. Urutan.
6. Batch preview.
7. Invalid data.
8. Mixed print status.
9. Batch print cancel.
10. Batch print confirm.
11. Combined PDF.
12. ZIP.
13. Limit.
14. Timeout.
15. Mobile.

---

## 66. Printer Fisik UAT

Uji menggunakan:

- printer perusahaan;
- Setengah Folio;
- A4;
- A5 bila digunakan;
- scale 100%;
- Actual Size;
- headers and footers off;
- orientation;
- margin.

Periksa:

- ukuran fisik;
- logo;
- font;
- garis tabel;
- page break;
- item panjang;
- halaman lanjutan;
- urutan batch;
- combined PDF;
- hasil print massal.

---

# BAGIAN P — ACCEPTANCE CRITERIA

## 67. Individual PDF

1. PDF individual tersedia.
2. Hasil sama dengan preview.
3. Paper profile benar.
4. Pagination benar.
5. Filename aman.
6. Download tidak mengubah print status.
7. Deleted data ditolak.
8. Unauthorized ditolak.
9. Audit PDF_EXPORT tersedia.
10. Temporary resource dibersihkan.

---

## 68. Batch Selection dan Preview

1. Multi-select bekerja.
2. Select all bekerja.
3. Deselect bekerja.
4. Selection hanya satu PO.
5. Stable ordering.
6. Validation server-side.
7. Deleted data dikecualikan.
8. Batch preview tersedia.
9. Status print summary benar.
10. Limit diterapkan.

---

## 69. Batch Print

1. Confirmation awal tersedia.
2. Confirmation hasil tersedia.
3. Cancel tidak mengubah status.
4. Confirm memperbarui status.
5. PRINT dan REPRINT benar.
6. `firstPrintedAt` benar.
7. `lastPrintedAt` benar.
8. `printCount` benar.
9. Transaction aman.
10. Batch audit tersedia.

---

## 70. Combined PDF

1. Semua dokumen terpilih masuk.
2. Urutan benar.
3. Setiap dokumen mulai halaman baru.
4. Pagination benar.
5. Satu paper profile.
6. Filename benar.
7. Download tidak mengubah print status.
8. Audit tersedia.
9. Limit diterapkan.
10. Atomic failure.

---

## 71. ZIP

1. Seluruh PDF individual tersedia.
2. Filename aman.
3. Urutan benar.
4. Tidak ada collision.
5. ZIP filename benar.
6. Download tidak mengubah status.
7. Audit tersedia.
8. Temporary file dibersihkan.
9. Limit diterapkan.
10. Atomic failure.

---

## 72. General Acceptance Criteria

1. Branch dibuat dari main Phase 5.
2. Main tetap default branch.
3. Working tree diaudit.
4. No secret.
5. Renderer terdokumentasi.
6. Server requirement terdokumentasi.
7. Prisma validate PASS.
8. Prisma generate PASS.
9. Prisma migrate status PASS atau dijelaskan.
10. Lint PASS.
11. Typecheck PASS atau NOT AVAILABLE.
12. Build PASS.
13. Tests PASS.
14. Verify sample PASS.
15. History Phase 5 tetap bekerja.
16. Recycle Bin tetap bekerja.
17. Duplicate/re-import tetap bekerja.
18. Tidak ada regression Phase 1–5.
19. Printer fisik diuji.
20. Tidak commit/push sebelum review tiap bagian.

---

# BAGIAN Q — DELIVERABLES

## 73. Bagian 1

- PDF renderer architecture;
- renderer service;
- individual PDF endpoint/action;
- filename sanitizer;
- paper profile integration;
- PDF_EXPORT audit;
- tests;
- laporan Bagian 1.

## 74. Bagian 2

- batch selection;
- batch toolbar;
- batch validation;
- batch preview;
- batch print;
- transactional status update;
- batch audit;
- tests;
- laporan Bagian 2.

## 75. Bagian 3

- combined PDF;
- ZIP;
- filename collision handling;
- process limits;
- cleanup;
- performance verification;
- UAT;
- laporan final.

---

# BAGIAN R — DOKUMENTASI PENDUKUNG

## 76. Dokumen yang Disarankan

```text
docs/
├── PRD-Phase-6-PDF-Batch-Export.md
├── Phase-6-PDF-Rendering-Architecture.md
├── Phase-6-Output-Naming-Rules.md
├── Phase-6-Batch-Limits-Performance.md
└── Phase-6-UAT-Checklist.md
```

PRD ini merupakan dokumen induk.

Dokumen pendukung dibuat saat implementasi jika diperlukan.

---

# BAGIAN S — DEFINITION OF DONE

## 77. Definition of Done

Phase 6 selesai jika:

- PDF individual selesai;
- batch selection selesai;
- batch preview selesai;
- batch print selesai;
- combined PDF selesai;
- ZIP selesai;
- canonical template tetap satu;
- paper profile konsisten;
- pagination benar;
- filename aman;
- download tidak mengubah status cetak;
- batch print hanya mengubah status setelah konfirmasi;
- PRINT dan REPRINT benar;
- Phase 6 audit tersedia;
- data Recycle Bin ditolak;
- authorization aman;
- limits diterapkan;
- temporary resources dibersihkan;
- automated tests lulus;
- sample verification lulus;
- printer fisik telah diuji;
- tidak ada regresi Phase 1–5;
- hasil siap manual UAT;
- belum merge ke main sebelum persetujuan user.

---

## 78. Instruksi Implementasi untuk OpenCode

1. Baca PRD ini seluruhnya.
2. Audit Phase 4 canonical template.
3. Audit Phase 5 History dan Recycle Bin.
4. Audit server environment.
5. Jangan membuat template PDF kedua tanpa alasan kuat.
6. Jangan mengubah print status saat download.
7. Jangan memproses deleted data.
8. Jangan mempercayai ID list dari client.
9. Jangan menyimpan PDF/ZIP di PostgreSQL.
10. Jangan membuat job queue sebelum dibutuhkan.
11. Kerjakan Bagian 1 terlebih dahulu.
12. Jangan mulai Bagian 2 sebelum Bagian 1 direview.
13. Jangan mulai Bagian 3 sebelum Bagian 2 direview.
14. Jangan reset database.
15. Jangan mengubah expected sample.
16. Jangan commit atau push sebelum instruksi eksplisit.

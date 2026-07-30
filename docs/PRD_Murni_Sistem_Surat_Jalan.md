# Product Requirements Document (PRD)
## Sistem Surat Jalan Otomatis CV. Pramudya Putra

> **Visi singkat:** Upload Excel sekali, cari data cabang atau kode terkait, preview atau edit, lalu print atau download PDF. Seluruh pemilahan data dan pengisian template dikerjakan otomatis oleh sistem.

## Informasi Dokumen

| Atribut | Nilai |
|---|---|
| Versi | 1.0 |
| Tanggal | 30 Juli 2026 |
| Status | Baseline MVP untuk development |
| Pemilik produk | CV. Pramudya Putra |
| Platform | Aplikasi web internal, desktop-first |
| Jenis dokumen | PRD murni - tanpa prompt development |

## Daftar Isi
- 1. Ringkasan Eksekutif
- 2. Latar Belakang dan Masalah
- 3. Tujuan Produk
- 4. Sasaran Pengguna
- 5. Prinsip Produk
- 6. Scope MVP
- 7. Di Luar Scope MVP
- 8. Aturan Bisnis
- 9. Alur Pengguna
- 10. Kebutuhan Fungsional
- 11. UX dan UI
- 12. Spesifikasi Template Surat Jalan
- 13. Arsitektur Teknis
- 14. Model Data
- 15. Algoritma Import Excel
- 16. Pencarian dan Kode Unik
- 17. Edit Data
- 18. Print, PDF, dan Status
- 19. Re-import dan Duplikasi
- 20. Non-Functional Requirements
- 21. Keamanan dan Integritas Data
- 22. Strategi Pengujian
- 23. Acceptance Criteria
- 24. Acceptance Fixture PO Juli 2026
- 25. Risiko dan Mitigasi
- 26. Roadmap Development
- 27. Keputusan yang Dapat Disempurnakan Saat Development
- 28. Glosarium

## 1. Ringkasan Eksekutif

- Saat ini pembuatan surat jalan dilakukan dengan membuka template CorelDRAW dan memasukkan data perusahaan, cabang, nomor PO, nama barang, serta kuantitas secara manual. Dalam satu PO dapat terdapat puluhan sampai ratusan cabang dan banyak produk, sehingga proses menjadi lambat, melelahkan, dan rawan salah input.
- Produk yang akan dibangun adalah aplikasi web internal yang mengubah file PO Excel menjadi data surat jalan terstruktur. Setelah import, setiap kombinasi perusahaan, nomor PO, dan cabang menjadi satu data surat jalan. User cukup mencari data, membuka preview, melakukan koreksi bila diperlukan, lalu mencetak atau mengunduh PDF.
- Antarmuka harus sangat sederhana untuk operator, tetapi algoritma di belakangnya harus rinci: mendeteksi struktur Excel, menormalisasi data, mengambil hanya barang dengan kuantitas valid, mencegah duplikasi, menjaga hasil edit manual, serta menghasilkan preview, print, dan PDF dari template kode yang sama.

## 2. Latar Belakang dan Masalah

- **Proses manual:** Data harus diketik satu per satu ke template CorelDRAW.
- **Skala data:** Satu PO dapat berisi banyak cabang dan banyak kolom produk.
- **Risiko kesalahan:** Nama cabang, nomor PO, produk, dan kuantitas dapat salah salin.
- **Waktu operasional:** Pembuatan ratusan surat jalan membutuhkan tenaga dan waktu yang besar.
- **Sulit ditelusuri:** Status sudah atau belum dicetak tidak tercatat secara terpusat.
- **Tidak efisien untuk revisi:** Perubahan pada PO harus dikoreksi ulang secara manual pada dokumen.

## 3. Tujuan Produk

- Menghilangkan kebutuhan memasukkan data berulang di CorelDRAW.
- Mempercepat pembuatan surat jalan untuk banyak cabang dalam satu atau beberapa PO.
- Mengambil hanya produk yang memiliki kuantitas valid lebih dari nol.
- Menyediakan pencarian cepat berdasarkan cabang, nomor PO, perusahaan, atau kode unik.
- Memungkinkan seluruh data dinamis dikoreksi tanpa merusak layout dokumen.
- Menghasilkan preview, print, dan PDF dari satu template berbasis kode.
- Menyediakan status operasional yang hanya terdiri dari Belum Dicetak dan Sudah Dicetak.
- Menjaga data tetap aman saat upload ulang atau revisi PO.

## 4. Sasaran Pengguna

- **Operator surat jalan:** Mengunggah PO, mencari cabang, memeriksa data, mengedit, mencetak, dan mengunduh PDF. Kemampuan teknis: awam sampai menengah.
- **Admin data:** Menangani koreksi, data revisi, duplikasi, dan pengecekan hasil import. Kemampuan teknis: menengah.
- **Pengelola teknis:** Menjalankan aplikasi, database, backup, migration, dan deployment. Kemampuan teknis: menengah sampai mahir.

## 5. Prinsip Produk

- UI sederhana, algoritma detail.
- User tidak perlu memahami struktur database atau parser Excel.
- Desain surat jalan dikunci, sedangkan seluruh data dinamis dapat diedit.
- Satu sumber template untuk preview, print, dan PDF.
- Tidak ada tanda tangan digital pada MVP.
- Sistem tidak boleh menambah data ganda secara diam-diam.
- Error harus dijelaskan dalam Bahasa Indonesia dan menyebut lokasi data bila memungkinkan.

## 6. Scope MVP

- **Framework:** Next.js App Router dengan TypeScript.
- **Database:** PostgreSQL melalui Docker Compose dengan named volume.
- **ORM:** Prisma ORM untuk schema, migration, dan akses database.
- **UI:** Tailwind CSS, shadcn/ui, dan Lucide Icons.
- **Validasi:** Zod pada boundary client dan server.
- **Import Excel:** Mendukung file .xls dan .xlsx.
- **Parser:** SheetJS atau library stabil yang mendukung .xls/.xlsx.
- **Template dokumen:** React/HTML/CSS A4 landscape; bukan gambar scan satu halaman penuh.
- **Output:** Print browser dan download PDF.
- **PDF:** Playwright/Chromium atau solusi server-side stabil yang merender template yang sama.
- **Status:** Belum Dicetak dan Sudah Dicetak.
- **Bahasa:** Bahasa Indonesia.
- **Perangkat utama:** Desktop/laptop dengan browser dan printer.

## 7. Di Luar Scope MVP

- Aplikasi mobile native.
- Integrasi WhatsApp, email, ERP, atau sistem order eksternal.
- Tanda tangan elektronik atau gambar tanda tangan otomatis.
- Editor desain drag-and-drop seperti CorelDRAW.
- Microservice, Redis, Elasticsearch, atau message queue.
- Dashboard analitik kompleks.
- Role dan login kompleks. Autentikasi dapat ditambahkan setelah flow utama stabil.
- Aplikasi publik multi-tenant.

## 8. Aturan Bisnis

- **Identitas surat jalan:** Satu perusahaan + satu nomor PO + satu cabang = satu surat jalan.
- **Barang yang masuk:** Hanya item dengan kuantitas valid > 0.
- **Barang yang diabaikan:** Kuantitas kosong, 0, atau tanda - tidak ditampilkan.
- **Kuantitas tidak valid:** Nilai negatif atau teks non-angka ditolak atau ditandai sebagai error.
- **Nama barang:** Tidak otomatis menjadi huruf kapital semua.
- **Edit nama barang:** User dapat mengubah nama barang dan menjalankan aksi uppercase per item atau semua item.
- **Edit data:** Seluruh data dinamis dapat diedit.
- **Field kosong:** Field opsional boleh kosong dan dapat diisi kapan saja sebelum output.
- **Tanda tangan:** Area tanda tangan tetap tersedia tetapi tanpa tanda tangan digital.
- **Tanggal:** Tanggal awal otomatis saat surat jalan pertama kali dibuat; tetap editable.
- **Status awal:** Setelah import: Belum Dicetak.
- **Print:** Menjalankan print dari aplikasi mengubah status menjadi Sudah Dicetak.
- **Download PDF:** Tidak mengubah status cetak.
- **Edit setelah print:** Perubahan data yang memengaruhi dokumen mengembalikan status menjadi Belum Dicetak.
- **Print ulang:** Dokumen berstatus Sudah Dicetak tetap dapat dipreview dan dicetak ulang.

## 9. Alur Pengguna

- User membuka halaman Upload Excel.
- User memilih satu atau beberapa file .xls/.xlsx.
- Sistem membaca file dan menampilkan preview ringkasan PO, jumlah cabang, jumlah item, warning, serta error.
- User menekan Simpan Data untuk mengonfirmasi import.
- Sistem membuat satu surat jalan per cabang dengan status Belum Dicetak.
- User membuka halaman Surat Jalan.
- User mencari berdasarkan nama cabang, nomor PO, perusahaan, atau kode unik.
- User membuka Preview.
- User dapat langsung Print/Download PDF atau memilih Edit Data.
- Jika Print dijalankan, status menjadi Sudah Dicetak.
- Data yang sudah dicetak tetap dapat dibuka, dipreview, dan dicetak ulang.

## 10. Kebutuhan Fungsional

### 10.1 Upload dan Preview Import

- Menerima satu atau beberapa file `.xls` dan `.xlsx`.
- Memvalidasi extension, ukuran file, kemampuan parsing, dan struktur sheet.
- Menghitung hash SHA-256 untuk mendeteksi file identik.
- Mencari sheet berdasarkan struktur header, tidak hanya berdasarkan nama sheet.
- Menampilkan nama file, perusahaan/kode, nomor PO, jumlah cabang, jumlah item valid, warning, dan error sebelum disimpan.
- Menampilkan error dengan lokasi sheet, baris, dan kolom bila memungkinkan.
- Menyimpan hasil import hanya setelah user menekan **Simpan Data**.

### 10.2 Import dan Pengelompokan

- Mendeteksi baris header yang memiliki `No` dan `Cabang`.
- Menganggap kolom setelah `Cabang` sebagai produk apabila header produk tidak kosong.
- Membaca baris hingga `Grand Total` atau akhir data.
- Mengubah matrix Excel menjadi format baris: perusahaan + PO + cabang + produk + kuantitas.
- Mengabaikan kuantitas kosong, 0, dan tanda `-`.
- Membuat satu surat jalan untuk setiap kombinasi PO dan cabang.
- Menggunakan database transaction agar import tidak tersimpan setengah.

### 10.3 Daftar dan Pencarian

- Menyediakan satu input pencarian universal.
- Mencari nama cabang, nama perusahaan, kode perusahaan, nomor PO, dan kode unik surat jalan.
- Pencarian case-insensitive dan mendukung sebagian kata.
- Filter status: Semua, Belum Dicetak, Sudah Dicetak.
- Pagination server-side.
- Query pencarian dan filter tersimpan di URL.

### 10.4 Preview Surat Jalan

- Menampilkan surat jalan A4 landscape yang sama dengan hasil print dan PDF.
- Hanya item kuantitas > 0 yang dirender.
- Menampilkan field opsional sebagai garis/ruang kosong ketika tidak diisi.
- Menampilkan tombol Kembali, Edit Data, Download PDF, dan Print.
- Mendukung halaman lanjutan jika item melebihi kapasitas template.

### 10.5 Edit Data

- Edit nama perusahaan/penerima.
- Edit nama cabang.
- Edit nomor PO utama.
- Edit kota dan tanggal dokumen.
- Edit nomor surat jalan.
- Edit deskripsi kendaraan dan nomor PO pada baris kendaraan.
- Edit nama penerima/tanda terima.
- Edit kuantitas, nama barang, keterangan, dan urutan barang.
- Tambah barang baru.
- Hapus barang.
- Uppercase per barang dan uppercase semua barang.
- Simpan perubahan dan langsung refleksikan pada preview.

### 10.6 Print dan PDF

- Print menggunakan dialog browser dan CSS print.
- Navigasi, toolbar, dan tombol aplikasi tidak ikut tercetak.
- Download PDF menggunakan template React/HTML/CSS yang sama.
- Nama file PDF jelas dan aman untuk filesystem.
- Download PDF tidak mengubah status.
- Print dari aplikasi mengubah status menjadi Sudah Dicetak.

## 11. UX dan UI

### 11.1 Struktur Navigasi

| Route | Fungsi |
|---|---|
| `/surat-jalan` | Halaman utama pencarian dan status |
| `/upload` | Upload dan preview import |
| `/surat-jalan/[id]` | Preview dokumen |
| `/surat-jalan/[id]/edit` | Edit seluruh data dinamis |
| `/surat-jalan/[id]/print` | Halaman print bersih |

### 11.2 Prinsip Visual

- Profesional, sederhana, dan elegan.
- Latar putih/abu-abu netral dengan aksen merah marun.
- Typography bersih dan jarak antarelemen cukup.
- Desktop-first.
- Status menggunakan badge sederhana.
- Tidak menggunakan animasi berlebihan.
- Action utama selalu jelas: Preview, Edit Data, Download PDF, Print.

### 11.3 Halaman Surat Jalan

| Elemen | Isi |
|---|---|
| Search | Cari cabang, nomor PO, perusahaan, atau kode unik |
| Filter status | Semua, Belum Dicetak, Sudah Dicetak |
| Tabel | Kode, cabang, perusahaan, PO, jumlah barang, status, aksi |
| Aksi utama | Preview |
| Empty state | Pesan sederhana dan tombol Upload Excel |

## 12. Spesifikasi Template Surat Jalan

- Ukuran A4 landscape: 297 x 210 mm.
- Logo menggunakan aset PNG/scan utuh yang tajam, bukan potongan screenshot.
- Identitas CV. Pramudya Putra dan alamat bersifat tetap.
- Area penerima, cabang, nomor PO, tanggal, dan tabel bersifat dinamis.
- Kolom tabel: Banyaknya, Nama Barang, Keterangan.
- Nama barang menggunakan `productName` yang editable dan tidak dipaksa uppercase.
- Baris kendaraan dan nomor PO tambahan kosong secara default tetapi dapat diisi.
- Area Tanda Terima kosong secara default tetapi nama penerima dapat diisi.
- Area Hormat Kami dan `(CV. PRAMUDYA PUTRA)` tetap ada tanpa gambar tanda tangan.
- Catatan bawah template dipertahankan.
- Footer tanda terima dan hormat kami hanya muncul di halaman terakhir pada dokumen multi-page.
- CSS dokumen dipisahkan dari style UI aplikasi.

> **Keputusan desain:** Jangan menggunakan screenshot surat jalan sebagai background halaman penuh. Hanya logo yang berupa aset gambar; garis, label, tabel, dan text layout dibuat dengan React/HTML/CSS agar tajam dan mudah menarik data.

## 13. Arsitektur Teknis

| Lapisan | Teknologi/Tanggung jawab |
|---|---|
| Web app | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Lucide Icons |
| Server | Route Handlers dan/atau Server Actions |
| Business logic | Service server-side yang dapat diuji |
| Validasi | Zod |
| ORM | Prisma |
| Database | PostgreSQL dalam Docker Compose |
| Excel parser | SheetJS atau library kompatibel `.xls/.xlsx` |
| Print | HTML/CSS print + browser dialog |
| PDF | Playwright/Chromium dari template yang sama |
| Testing | Unit, integration, dan Playwright E2E |

```text
Browser
  -> Next.js pages/components
  -> Route Handlers / Server Actions
  -> Domain services + Zod
  -> Prisma
  -> PostgreSQL (Docker)

Excel buffer -> Parser -> Normalized preview -> Transaction import
DeliveryNote data -> Shared React document -> Preview / Print / PDF
```

## 14. Model Data

### 14.1 ImportBatch

| Field | Keterangan |
|---|---|
| `id` | Identifier |
| `originalFileName` | Nama file asli |
| `fileHash` | SHA-256 untuk deteksi file identik |
| `fileSize` | Ukuran file |
| `status` | Previewed / Imported / Failed |
| `summary` | Ringkasan hasil parsing |
| `createdAt` | Waktu upload |

### 14.2 PurchaseOrder

| Field | Keterangan |
|---|---|
| `id` | Identifier |
| `importBatchId` | Relasi batch |
| `companyCode` | Contoh: SOF |
| `companyName` | Contoh: PT. Summit Oto Finance |
| `poNumber` | Nomor PO lengkap |
| `period` | Periode bila dapat diparsing |
| `sourceTitle` | Judul asli dari Excel |
| `createdAt`, `updatedAt` | Audit waktu |

### 14.3 DeliveryNote

| Kelompok | Field |
|---|---|
| Source | `sourceCompanyName`, `sourcePoNumber`, `sourceBranchName` |
| Editable | `companyName`, `poNumber`, `branchName`, `documentCity`, `documentDate` |
| Opsional | `deliveryNoteNumber`, `vehicleDescription`, `vehiclePoNumber`, `receiptName` |
| Identity | `uniqueCode`, `purchaseOrderId`, `normalizedBranchName` |
| Status | `NOT_PRINTED` / `PRINTED` |
| Print audit | `firstPrintedAt`, `lastPrintedAt`, `printCount` |
| Audit | `createdAt`, `updatedAt` |

### 14.4 DeliveryNoteItem

| Field | Keterangan |
|---|---|
| `sourceProductName` | Nama asli dari Excel |
| `productName` | Nama tampilan editable |
| `sourceQuantity` | Kuantitas asli |
| `quantity` | Kuantitas editable |
| `unit` | Satuan opsional |
| `description` | Keterangan opsional |
| `sortOrder` | Urutan tampil |
| `isManuallyEdited` | Penanda perlindungan saat re-import |

> Source fields menyimpan asal Excel, sedangkan editable fields dipakai untuk preview dan output. Koreksi user tidak menghilangkan referensi data awal.

## 15. Algoritma Import Excel

1. Validasi extension, ukuran, dan buffer file.
2. Hitung SHA-256.
3. Parse workbook.
4. Prioritaskan sheet visible, tetapi pilih berdasarkan kecocokan struktur.
5. Cari sheet yang memiliki header `No`, `Cabang`, dan minimal satu kolom produk.
6. Cari baris header secara dinamis.
7. Cari judul PO pada area sebelum header.
8. Parse kode perusahaan dan nomor PO.
9. Baca nama produk dari header setelah kolom Cabang.
10. Iterasi baris cabang hingga `Grand Total` atau akhir data.
11. Normalisasi kuantitas dan ambil hanya nilai > 0.
12. Bangun preview typed yang tidak bergantung pada ORM.
13. Setelah user konfirmasi, simpan seluruh data dalam satu transaction.

### 15.1 Normalisasi Kuantitas

| Input | Hasil |
|---|---|
| `1000` numeric | 1000, valid |
| `1.000` / `1,000` | 1000 bila pola separator ribuan |
| `5` | 5, valid |
| Kosong | Diabaikan |
| `0` | Diabaikan |
| `-` | Diabaikan |
| Nilai negatif | Error |
| Teks non-angka | Error |

### 15.2 Normalisasi Nama

- Trim spasi awal dan akhir.
- Collapse spasi ganda.
- Rapikan spasi di dalam tanda kurung.
- Pertahankan acronym seperti SOF, HVS, PO, dan BASTK.
- Jangan menjalankan uppercase otomatis.

## 16. Pencarian dan Kode Unik

- Search server-side, case-insensitive, dan partial match.
- Search field: `branchName`, `normalizedBranchName`, `poNumber`, `companyCode`, `companyName`, dan `uniqueCode`.
- Debounce pada client.
- Pagination server-side.
- Index database pada field penting.
- Format kode unik awal: `SJ-YYYY-######`.
- Kode unik tidak wajib dicetak pada dokumen, tetapi dapat digunakan untuk pencarian internal.

Contoh:

```text
cian          -> Cianjur
678           -> seluruh cabang pada PO 678
SOF           -> seluruh data PT. Summit Oto Finance
SJ-2026-000092 -> satu surat jalan
```

## 17. Edit Data

### 17.1 Data yang Dapat Diedit

- Nama perusahaan/penerima.
- Nama cabang.
- Nomor PO utama.
- Kota dan tanggal.
- Nomor surat jalan.
- Kendaraan dan nomor PO tambahan.
- Nama penerima/tanda terima.
- Kuantitas, nama barang, keterangan, dan urutan.
- Tambah/hapus item.

### 17.2 Aturan Edit

- Desain template tidak dapat diubah dari form edit.
- Kuantitas harus > 0 agar item tampil.
- Kuantitas 0 atau kosong membuat item tidak tampil; user harus diberi informasi yang jelas.
- Nilai negatif dan non-angka ditolak.
- Uppercase tersedia per item dan seluruh item.
- Edit data yang sudah dicetak mengembalikan status menjadi Belum Dicetak.
- Source values tetap tersimpan untuk audit dan re-import.

## 18. Print, PDF, dan Status

### 18.1 Status

| Aksi | Efek |
|---|---|
| Upload/import | Belum Dicetak |
| Preview | Tidak berubah |
| Download PDF | Tidak berubah |
| Print pertama | Sudah Dicetak; set waktu cetak dan `printCount=1` |
| Print ulang | Tetap Sudah Dicetak; update waktu dan `printCount` |
| Edit isi dokumen | Kembali Belum Dicetak |

### 18.2 Keterbatasan Browser

Aplikasi tidak dapat memastikan apakah user menekan Cancel pada dialog printer atau apakah kertas benar-benar keluar. Karena itu, status **Sudah Dicetak** berarti proses print pernah dijalankan dari aplikasi.

### 18.3 Output PDF

- PDF memakai template dan CSS yang sama dengan preview/print.
- Ukuran A4 landscape.
- Nama file contoh: `Surat-Jalan_SOF-678_Cianjur_2026-07-30.pdf`.
- Filename disanitasi.
- PDF tidak mengubah status cetak.

## 19. Re-import dan Duplikasi

- File dengan hash identik tidak membuat data ganda.
- Identitas PO: `companyCode + poNumber`.
- Identitas surat jalan: `purchaseOrderId + normalizedBranchName`.
- Identitas item: `deliveryNoteId + normalizedProductName` atau strategi source-key setara.
- Revisi PO menggunakan upsert aman.
- Field yang belum diedit manual boleh mengikuti source terbaru.
- Field yang sudah diedit manual tidak ditimpa diam-diam.
- Cabang yang hilang dari revisi tidak langsung dihapus; sistem memberikan warning.
- Perubahan source yang memengaruhi output mengembalikan status menjadi Belum Dicetak.

## 20. Non-Functional Requirements

| Area | Target |
|---|---|
| Kinerja | Search responsif untuk minimal 10.000 surat jalan pada lingkungan lokal yang wajar |
| Reliability | Import atomic menggunakan transaction |
| Data durability | PostgreSQL named volume dan prosedur backup |
| Maintainability | Parser, service, UI, dan template dipisahkan |
| Consistency | Preview, print, dan PDF memakai satu template |
| Browser | Fokus Chrome/Edge desktop; Safari dapat diuji sebagai tambahan |
| Accessibility | Label form, keyboard navigation, dan kontras dasar |
| Localization | Bahasa Indonesia dan format angka/tanggal yang mudah dipahami |

## 21. Keamanan dan Integritas Data

- Validasi extension dan ukuran file.
- Validasi MIME best-effort dan parsing exception.
- Sanitasi filename.
- Tidak menyimpan secret di repository.
- Database credential melalui environment variable.
- Gunakan Prisma transaction untuk operasi multi-tabel.
- Endpoint PDF tidak boleh menerima arbitrary URL.
- Error log tidak membocorkan data sensitif.
- Dokumentasikan backup/restore PostgreSQL.

## 22. Strategi Pengujian

### 22.1 Unit Test

- Normalisasi kuantitas.
- Normalisasi nama barang.
- Deteksi sheet dan header.
- Parsing judul PO.
- Filter kuantitas > 0.
- Formatter kode unik dan quantity.
- Reset status setelah edit.

### 22.2 Integration Test

- Import fixture menghasilkan jumlah cabang dan item yang benar.
- Transaction rollback ketika terjadi error.
- Re-import tidak membuat duplikat.
- Search dan filter database.
- PDF endpoint menghasilkan `application/pdf` non-empty.

### 22.3 End-to-End

- Upload file, preview, dan simpan.
- Cari Cianjur.
- Buka preview.
- Edit quantity/nama barang.
- Isi field opsional.
- Download PDF.
- Jalankan print dan verifikasi status.

### 22.4 Manual Print QA

- A4 landscape dan scale 100%.
- Logo tajam dan tidak terpotong.
- Garis tabel tajam.
- Tidak ada clipping.
- Area tanda tangan kosong.
- Halaman lanjutan benar.

## 23. Acceptance Criteria

- User dapat menyelesaikan flow Upload -> Cari -> Preview/Edit -> Print atau PDF tanpa membuka CorelDRAW.
- Hanya item dengan kuantitas > 0 yang muncul.
- Nama barang tidak otomatis menjadi huruf kapital semua.
- Tidak ada tanda tangan digital pada output.
- Seluruh data dinamis dan field opsional dapat diedit.
- Field opsional yang kosong tetap dapat ditambahkan.
- Print dan PDF menggunakan template kode yang sama.
- Status pada UI hanya Belum Dicetak dan Sudah Dicetak.
- Download PDF tidak mengubah status.
- Edit setelah print mengembalikan status ke Belum Dicetak.
- Upload ulang tidak menggandakan PO, cabang, atau item.
- Aplikasi dapat mencari berdasarkan cabang, PO, perusahaan, dan kode unik.

## 24. Acceptance Fixture PO Juli 2026

Fixture utama: `Lampiran PO Aneka Cetakan Cabang Periode Juli 2026.xls`.

| Pengujian | Expected |
|---|---|
| Sheet terpilih | `Lampiran PO` |
| Judul | `Lampiran PO SOF 678/PPU SOF CCM/VII/2026` |
| Jumlah cabang | 92 |
| Jumlah kolom produk | 15 |
| Jumlah item dengan kuantitas > 0 | 462 |
| Cabang Cianjur | Tepat 3 item |

| Kuantitas | Nama barang Cianjur |
|---:|---|
| 1000 | Kartu Pembayaran |
| 5 | Kop Surat SOF (HVS) |
| 500 | Stiker Label Kendaraan Tarikan (Inventory) |

## 25. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Format Excel berubah | Parser modular, deteksi header/sheet dinamis, fixture test beragam |
| Separator angka ambigu | Prioritaskan numeric cell; aturan string eksplisit |
| Re-import menimpa edit | Source/editable fields dan `isManuallyEdited` |
| PDF berbeda dari preview | Satu komponen dokumen dan CSS yang sama |
| Hasil print terpotong | CSS mm/pt, print QA fisik, browser target yang jelas |
| Import besar gagal di tengah | Transaction dan rollback |
| Data ganda | Hash file dan unique constraint |
| Status print tidak 100% pasti | Jelaskan bahwa status merekam print intent dari aplikasi |

## 26. Roadmap Development

| Fase | Output |
|---|---|
| 1 | Fondasi Next.js, TypeScript, Tailwind, shadcn, layout |
| 2 | PostgreSQL Docker Compose, Prisma, migration |
| 3 | Domain service dan validasi |
| 4 | Parser `.xls/.xlsx` dan fixture test |
| 5 | Preview import dan transaction database |
| 6 | Daftar surat jalan, pencarian, filter, pagination |
| 7 | Edit seluruh data dinamis dan field opsional |
| 8 | Template surat jalan berbasis kode |
| 9 | Print dan status |
| 10 | Download PDF |
| 11 | Hardening re-import, performance, dan audit |
| 12 | QA end-to-end dan deployment readiness |

## 27. Keputusan yang Dapat Disempurnakan Saat Development

- File logo final paling tajam dan ukuran persisnya.
- Pengukuran margin dan font setelah print fisik pertama.
- Kapasitas item per halaman dan bentuk halaman lanjutan.
- Target deployment: komputer lokal, server kantor, VPS, atau cloud.
- Autentikasi setelah MVP bila aplikasi dibuka melalui jaringan/internet.
- Mapping kode perusahaan selain SOF.
- Format nomor surat jalan jika perusahaan ingin nomor formal selain kode unik internal.

## 28. Glosarium

| Istilah | Arti |
|---|---|
| PO | Purchase Order |
| Surat Jalan | Dokumen pengiriman per perusahaan + PO + cabang |
| DeliveryNote | Nama teknis entitas surat jalan |
| ImportBatch | Catatan satu proses upload/import |
| Source field | Nilai asli dari Excel |
| Editable field | Nilai kerja yang dapat diubah user |
| Belum Dicetak | Versi data saat ini belum pernah menjalankan proses print |
| Sudah Dicetak | Proses print pernah dijalankan untuk versi data saat ini |
| Fixture | File contoh tetap untuk pengujian |

---

**Dokumen ini menjadi baseline kebutuhan produk. Perubahan kebutuhan selama development harus dicatat sebagai revisi PRD agar implementasi dan ekspektasi tetap konsisten.**

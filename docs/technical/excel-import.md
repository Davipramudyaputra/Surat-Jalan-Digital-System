# Arsitektur Import Excel Adaptif

Dokumen ini menjelaskan implementasi Phase 2. Fixture
`docs/sample-data/Lampiran PO Aneka Cetakan Cabang Periode Juli 2026.xls`
digunakan sebagai acceptance fixture, bukan sebagai template permanen.

## Pipeline per file

```text
multipart file
  -> validasi nama, extension, MIME, ukuran, dan signature
  -> SHA-256
  -> duplicate check
  -> SheetJS workbook reader
  -> inspeksi semua worksheet
  -> sheet/header/column detection
  -> metadata extraction
  -> matrix transformation
  -> Zod validation
  -> Prisma transaction
  -> result per file
```

Parsing diselesaikan sebelum transaction dibuka. Transaction hanya memuat
operasi persistence agar lock database tidak ditahan selama pembacaan workbook.

## Inspeksi workbook

Setiap worksheet dicatat bersama:

- Nama dan visibility (`visible`, `hidden`, atau `very-hidden`)
- Used range
- Jumlah row dan column
- Merged cell
- Kandidat metadata
- Kandidat header

Sheet visible memperoleh prioritas, tetapi tetap harus memenuhi kriteria data.
Hidden sheet hanya menjadi kandidat jika strukturnya valid. Parser tidak
memilih sheet pertama atau active sheet secara otomatis.

## Deteksi header dan kolom

Header dicari sampai `MAX_HEADER_SCAN_ROWS` (200 row) menggunakan alias dalam
`config/header-aliases.ts`.

Kandidat harus memiliki:

- Header nomor
- Header cabang
- Minimal satu kolom produk dengan quantity positif
- Minimal satu row cabang valid

Kolom produk tidak harus berada setelah cabang. Header kosong dan marker
seperti total, biaya, harga, berat, catatan, atau metadata dikecualikan. Pola
nilai pada row cabang digunakan untuk membedakan produk dari kolom non-produk.

Dua header atau dua sheet dengan selisih score di bawah ambiguity margin
ditolak. Dua header produk dengan normalized name yang sama juga ditolak.

## Confidence

Confidence menggunakan skala 0–100 dan mempertimbangkan:

- Header cabang ditemukan
- Kolom produk ditemukan
- Row cabang valid
- Nomor PO ditemukan
- Konsistensi quantity
- Konsistensi transformasi row

Nilai minimal berada pada konstanta `MIN_IMPORT_CONFIDENCE` (75). Critical
error, ambiguity, atau confidence di bawah threshold menghentikan persistence.

## Metadata Purchase Order

Metadata dicari pada cell sebelum header dan kandidat metadata workbook.
Parser tidak menggunakan nama file sebagai sumber PO.

Mapping awal perusahaan berada pada:

```text
src/features/imports/config/company-mappings.ts
```

Mapping awal:

```text
SOF -> PT. SUMMIT OTO FINANCE
```

Kode yang belum memiliki mapping menggunakan kode tersebut sebagai nama
fallback dan menghasilkan warning. Tambahkan mapping baru pada file konfigurasi
tanpa mengubah algoritma parser.

Periode dikenali dari angka Romawi pada nomor PO atau nama bulan
Indonesia/Inggris dan disimpan sebagai `YYYY-MM`.

## Normalisasi

### Quantity

`normalizeQuantity` menghasilkan salah satu dari:

- `valid` dengan decimal string canonical
- `skip` untuk empty, zero, atau tanda strip
- `error` untuk negatif, non-numeric, atau formula tanpa cached result

Cell numeric diprioritaskan. String `1.000` dan `1,000` dikenali sebagai 1000.
Format campuran seperti `1.234,50` dan `1,234.50` disimpan sebagai `1234.5`.
`parseFloat` tidak digunakan.

Formula tidak dieksekusi. Cached numeric result digunakan bila tersedia;
formula tanpa cached result menghasilkan error.

### Cabang

- `originalBranchName` mempertahankan nilai sumber
- `branchName` melakukan trim dan collapse whitespace
- `normalizedBranchName` digunakan sebagai identity case-insensitive

### Produk

- `originalProductName` mempertahankan header sumber
- `displayProductName` merapikan whitespace dan acronym
- `normalizedProductName` digunakan sebagai identity

Exact display mapping berada pada:

```text
src/features/imports/config/product-display-mappings.ts
```

Mapping tersebut hanya mengubah produk yang cocok secara exact setelah
normalisasi; text dalam tanda kurung tidak dihapus secara generik.

## Persistence dan re-import

Satu file menggunakan satu Prisma transaction untuk perubahan bisnis.

Unique constraint:

- Purchase Order: `companyCode + normalizedPoNumber`
- Delivery Note: `purchaseOrderId + normalizedBranchName`
- Item: `deliveryNoteId + normalizedProductName`
- Kode surat jalan: `uniqueCode`

File identik:

- Dicari melalui SHA-256 pada upload `IMPORTED`
- Percobaan baru dicatat sebagai `DUPLICATE`
- PO, cabang, dan item tidak ditulis ulang

PO sama dengan file berbeda:

- Purchase Order di-upsert
- Cabang pada file terbaru dibuat atau diperbarui
- Item cabang disinkronkan
- Cabang yang tidak ada pada file terbaru tidak dihapus
- Cabang berubah menjadi `NOT_PRINTED`
- Cabang unchanged mempertahankan `printStatus`
- Audit print tetap dipertahankan

## Menambah format Excel baru

1. Tambahkan alias header bila istilah bisnis baru ditemukan.
2. Tambahkan marker kolom non-produk bila diperlukan.
3. Tambahkan company mapping atau exact product display mapping.
4. Buat variation fixture programmatic.
5. Tambahkan assertion eksplisit untuk sheet, header, metadata, row, dan item.
6. Jalankan `npm test` dan `npm run verify:sample`.

Jangan menambahkan hardcode nama sheet, nomor row, huruf column, jumlah produk,
atau lokasi Grand Total untuk mengakomodasi format baru.

## Security boundary

- Workbook dibaca pada Node.js server runtime.
- File tidak digunakan sebagai path filesystem.
- Nama file disanitasi.
- Binary upload tidak disimpan di repository, database, atau public folder.
- Macro/VBA/script tidak dieksekusi.
- Formula tidak dieksekusi.
- Parsing exception dikonversi menjadi error code stabil.
- Stack trace dan detail Prisma tidak dikirim ke client.
- Prisma hanya di-import oleh service/route server.

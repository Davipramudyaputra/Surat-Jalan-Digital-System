# Sistem Surat Jalan

Sistem Surat Jalan adalah aplikasi web internal CV. Pramudya Putra untuk
mengubah file Purchase Order Excel menjadi data surat jalan per cabang.

Project saat ini berada pada **Phase 3 — Daftar, Pencarian, Status, Detail, dan Edit Data Surat Jalan**. Upload `.xls`/`.xlsx`, penyimpanan transaksional, daftar surat jalan, pencarian berdasarkan kode/PO/cabang, detail surat jalan, serta form edit surat jalan telah tersedia. Pencetakan surat jalan ke PDF tetap menjadi scope Phase 4.
## Prasyarat

- Node.js 22.12 atau lebih baru
- npm
- Docker Desktop atau Docker Engine dengan Docker Compose
- Git

## Menyiapkan project

```bash
git clone https://github.com/Davipramudyaputra/Surat-Jalan-Digital-System.git
cd Surat-Jalan-Digital-System
cp .env.example .env
npm install
```

Buka `.env`, lalu ganti password contoh dengan password khusus local
development. Nilai `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_PORT`, dan `DATABASE_URL` harus tetap konsisten.

Jangan commit `.env`. Nilai dalam `.env.example` hanya contoh lokal, bukan
credential production.

## Menjalankan PostgreSQL dan migration

```bash
docker compose up -d
docker compose ps
npm run prisma:migrate
npm run prisma:generate
```

Migration domain membuat tabel:

- `Upload`
- `PurchaseOrder`
- `DeliveryNote`
- `DeliveryNoteItem`

Data PostgreSQL disimpan pada named volume
`surat_jalan_postgres_data`.

> Jangan menjalankan `docker compose down -v` bila data lokal masih
> diperlukan. Opsi `-v` menghapus named volume beserta data di dalamnya.

Untuk menghentikan dan menjalankan kembali database tanpa menghapus data:

```bash
docker compose stop
docker compose start
```

## Menjalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Route Phase 3:

- `/login` — login admin internal
- `/dashboard` — ringkasan PO dan progres pencetakan
- `/po` — upload Excel, preview/konfirmasi, serta daftar PO
- `/po/[id]` — detail satu PO dan surat jalannya
- `/upload` — redirect kompatibilitas ke `/po?upload=true`
- `/surat-jalan` — daftar dan pencarian surat jalan dengan paginasi
- `/surat-jalan/[id]` — halaman detail surat jalan
- `/surat-jalan/[id]/edit` — form edit surat jalan
- `/api/imports` — endpoint `POST multipart/form-data`
- `/api/health` — health check aplikasi dan PostgreSQL

## Menggunakan upload Excel

1. Login, lalu buka `/po`.
2. Tarik file ke area upload atau pilih melalui file picker.
3. Pilih maksimal 10 file.
4. Klik **Review Data PO** dan periksa preview tanpa perubahan database.
5. Klik **Import Data PO** untuk mengonfirmasi penyimpanan.
6. Periksa hasil per file, jumlah PO, cabang, item, sheet, confidence,
   warning, dan error.

## Provisioning admin

Isi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` (minimal 12 karakter) melalui
environment yang aman, lalu jalankan `npm run admin:provision`. Script tidak
memiliki username/password default dan tidak mencetak password.

Ketentuan awal:

- Format: `.xls` dan `.xlsx`
- Ukuran maksimal: 10 MB per file
- Jumlah maksimal: 10 file per request
- Satu request dapat berisi satu atau beberapa file

Setiap file diproses secara independen. Kegagalan satu file tidak membatalkan
file lain, tetapi seluruh perubahan bisnis untuk satu file selalu berhasil
bersama-sama atau rollback bersama-sama.

## Parser adaptif

File sample bukan template permanen. Parser tidak mengandalkan nama sheet,
nomor baris header, huruf kolom cabang, jumlah produk, atau lokasi total yang
tetap.

Pipeline akan:

1. Memeriksa semua worksheet dan visibility.
2. Mencari kandidat header berdasarkan alias nomor dan cabang.
3. Mengklasifikasikan kolom produk dari header serta pola quantity.
4. Menolak kandidat sheet/header yang ambigu.
5. Mengekstrak kode perusahaan, nomor PO, dan periode dari area metadata.
6. Mengubah matrix cabang × produk menjadi data surat jalan dan item.
7. Memvalidasi hasil dengan Zod sebelum membuka transaction database.

Detail teknis tersedia di
[`docs/technical/excel-import.md`](docs/technical/excel-import.md).

## Re-import dan duplicate

- SHA-256 dipakai untuk mengenali file identik.
- File identik dicatat sebagai `DUPLICATE` dan tidak menggandakan record
  bisnis.
- PO yang sama dikenali melalui `companyCode + normalizedPoNumber`.
- Cabang dikenali melalui `purchaseOrderId + normalizedBranchName`.
- Item dikenali melalui `deliveryNoteId + normalizedProductName`.
- Item pada cabang yang muncul dalam file terbaru disinkronkan.
- Cabang lama yang tidak ada dalam file terbaru tetap dipertahankan dan
  menghasilkan warning karena file mungkin hanya partial update.
- Cabang yang berubah kembali ke status `NOT_PRINTED`.
- Cabang yang tidak berubah mempertahankan status cetaknya.

## Menjalankan test

Unit, variation, parser, dan acceptance fixture:

```bash
npm test
```

Acceptance fixture saja:

```bash
npm run test:sample
```

Database verification membutuhkan PostgreSQL sehat dan migration sudah
diterapkan:

```bash
npm run verify:sample
```

Verification database akan:

- Meng-import fixture acceptance.
- Memastikan 1 PO, 92 surat jalan, dan 462 item tersedia.
- Meng-import file identik kembali.
- Memastikan business record tidak bertambah.
- Menguji update PO berbeda secara idempotent.
- Menguji reset/preservation status dan preservation cabang absent.

Fixture synthetic re-import dibersihkan secara terbatas setelah test. Data
fixture acceptance utama tidak dihapus.

## Validasi project

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
docker compose config
docker compose ps
```

## Error umum

- **Format file harus .xls atau .xlsx** — pilih extension yang didukung.
- **Ukuran file melebihi batas** — pastikan file maksimal 10 MB.
- **Isi file tidak sesuai format** — extension dan signature workbook tidak
  cocok.
- **Sheet data utama tidak ditemukan** — workbook tidak memiliki kombinasi
  header nomor, cabang, produk, dan row quantity yang cukup.
- **Struktur Excel ambigu** — lebih dari satu sheet/header memiliki confidence
  yang hampir sama.
- **Nomor PO tidak ditemukan** — area metadata workbook tidak memiliki
  informasi PO yang dapat dikenali.
- **Kuantitas tidak valid** — nilai negatif atau teks non-angka harus
  diperbaiki pada file sumber.
- **File yang sama sudah pernah di-import** — hasil bisnis lama dipertahankan
  tanpa duplicate.
- **Database unavailable** — periksa `docker compose ps` dan `/api/health`.

Pesan API tidak mengembalikan stack trace, SQL, URL database, path internal,
atau credential.

## Batas Phase 3

Phase 3 sudah menyediakan autentikasi admin, Dashboard, workspace Data PO,
preview/konfirmasi import, detail/edit, dan penghapusan PO yang aman. Preview
A4 final, Print, serta PDF tetap berada di phase berikutnya.

# Phase 5 — History UAT Checklist (Bagian 1)

Checklist verifikasi manual untuk Global History & Audit Trail.

## Persiapan

- [ ] Login sebagai admin.
- [ ] Buka `/history`.
- [ ] History kosong (sebelum ada aktivitas) menampilkan empty state.

## Import

- [ ] Import file Excel.
- [ ] Event `IMPORT` tercatat pada Global History.
- [ ] Metadata menampilkan jumlah PO, Surat Jalan, dan item.
- [ ] Re-import file yang sama menghasilkan `REIMPORT` (jika sesuai policy).
- [ ] Duplicate yang ditolak **tidak** menghasilkan event `IMPORT`.

## Purchase Order

- [ ] Edit PO.
- [ ] Event `UPDATE` tercatat dengan before/after dan changed fields.
- [ ] Changed fields hanya berisi field yang berubah.
- [ ] History PO pada detail PO hanya menampilkan event PO ini (tidak bocor ke PO lain).

## Surat Jalan

- [ ] Edit Surat Jalan.
- [ ] Event `UPDATE` tercatat.
- [ ] Tambah/edit/hapus/reorder item tercatat.
- [ ] Edit Surat Jalan yang sudah dicetak → event `PRINT_STATUS_RESET`.
- [ ] History Surat Jalan pada detail hanya menampilkan event Surat Jalan ini.

## Print

- [ ] Cetak → konfirmasi hasil → event `PRINT`.
- [ ] Cetak ulang → event `REPRINT` dengan previous/new print count.
- [ ] Membuka preview **tidak** menghasilkan `PRINT`.
- [ ] Mengganti paper profile **tidak** menghasilkan `PRINT`.
- [ ] Menjalankan `window.print()` tanpa konfirmasi hasil **tidak** menghasilkan `PRINT`.

## Autentikasi

- [ ] Login berhasil → event `LOGIN`.
- [ ] Logout → event `LOGOUT`.
- [ ] Ubah password → event `PASSWORD_CHANGE` (tanpa menyimpan password/hash).

## Global History UI

- [ ] Filter search bekerja.
- [ ] Filter actor bekerja.
- [ ] Filter action bekerja.
- [ ] Filter entity bekerja.
- [ ] Filter rentang tanggal bekerja.
- [ ] Pagination bekerja dan stabil (event terbaru lebih dahulu).
- [ ] Buka detail event menampilkan before/after per field yang mudah dibaca.
- [ ] Detail event read-only (tidak ada tombol edit/hapus).

## Keamanan

- [ ] History hanya dapat diakses user terautentikasi/berizin.
- [ ] Detail event memverifikasi authorization.
- [ ] Tidak ada secret (password, token, dsb.) pada detail event.

## Responsive

- [ ] Desktop 1440/1280.
- [ ] Tablet 1024/768.
- [ ] Mobile 390.
- [ ] Tidak ada overflow halaman.
- [ ] Tabel memakai horizontal scroll yang aman.

# Phase 5 — Recycle Bin UAT Checklist

Checklist verifikasi manual untuk Recycle Bin, restore, dan permanent delete.

## Persiapan

- [ ] Login sebagai admin.
- [ ] Menu sidebar menampilkan "Recycle Bin".
- [ ] `/recycle-bin` dapat dibuka.

## Tab Purchase Order

- [ ] Tab PO menampilkan data PO yang dihapus.
- [ ] Kolom: nomor PO, perusahaan, jumlah Surat Jalan, jumlah item, dihapus oleh, tanggal, aksi.
- [ ] Search bekerja.
- [ ] Pagination bekerja.
- [ ] Empty state tampil jika tidak ada data.

## Tab Surat Jalan

- [ ] Tab Surat Jalan menampilkan data SJ yang dihapus.
- [ ] Status parent (PO Aktif / PO di Recycle Bin) tampil.
- [ ] Search bekerja.

## Soft Delete

- [ ] Hapus PO → PO hilang dari Data PO.
- [ ] Dashboard tidak menghitung PO yang dihapus.
- [ ] Recycle Bin menampilkan PO + seluruh SJ + item.
- [ ] Event `DELETE` muncul di Global History.

## Restore PO

- [ ] Pulihkan PO → seluruh data kembali.
- [ ] Dashboard menghitung ulang dengan benar.
- [ ] Event `RESTORE` muncul di Global History.

## Restore Surat Jalan

- [ ] Pulihkan SJ (parent aktif) → SJ kembali.
- [ ] Restore SJ dengan parent terhapus → diblokir dengan pesan jelas.

## Conflict

- [ ] Restore PO dengan nomor sama sudah aktif → diblokir.
- [ ] Re-import lalu restore data lama → diblokir.
- [ ] Tidak ada "Timpa Data Aktif".

## Permanent Delete

- [ ] Hanya muncul untuk data Recycle Bin.
- [ ] Konfirmasi salah (phrase/identity) → ditolak.
- [ ] Konfirmasi benar → data hilang permanen.
- [ ] AuditEvent `PERMANENT_DELETE` tetap tersedia.
- [ ] Audit history tidak ikut terhapus.

## History

- [ ] Global History menampilkan `DELETE`, `RESTORE`, `PERMANENT_DELETE`.
- [ ] Filter action bekerja.
- [ ] Snapshot tetap tersedia setelah permanent delete.

## Responsive

- [ ] Desktop, tablet, mobile.
- [ ] Tab dapat digunakan di mobile.
- [ ] Tabel memakai horizontal scroll aman.
- [ ] Dialog restore/permanent delete tidak keluar viewport.
- [ ] Tidak ada overflow halaman.

## Aksesibilitas

- [ ] Focus ring terlihat.
- [ ] Dialog focus trap + Escape.
- [ ] Checkbox dan input memiliki label.
- [ ] Destructive action tidak hanya berdasarkan warna.
- [ ] Touch target minimal 44×44.
- [ ] Tabel header semantik.

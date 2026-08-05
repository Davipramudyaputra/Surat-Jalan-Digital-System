# Phase 5 — Soft Delete & Restore Rules

Dokumen ini menjelaskan aturan soft delete, restore, permanent delete, dan
Recycle Bin pada Phase 5.

## Entitas Soft Delete

| Entitas | Field | Keterangan |
|---|---|---|
| PurchaseOrder | `deletedAt`, `deletedById`, `deletionReason`, `trashBatchId` | Data soft-deleted |
| DeliveryNote | `deletedAt`, `deletedById`, `deletionReason`, `trashBatchId` | Data soft-deleted |
| DeliveryNoteItem | — | Tidak punya field soft-delete; mengikuti parent DeliveryNote |

`DeliveryNoteItem` **tidak** memiliki `deletedAt` sendiri. Item mengikuti parent
melalui relasi. Saat parent soft-deleted, item tidak muncul di query aktif
karena seluruh query dimulai dari DeliveryNote aktif. Saat parent di-restore,
item kembali otomatis. Permanent delete menghapus item child-to-parent.

## Trash Batch

- `trashBatchId` mengelompokkan satu operasi soft delete aggregate.
- Saat PO dihapus, seluruh DeliveryNote terkait memakai `trashBatchId` yang sama.
- Berguna untuk restore lengkap dan permanent delete yang konsisten.

## Child Behaviour

- Soft delete PO menandai PO + seluruh DeliveryNote terkait sebagai deleted.
- Item tidak ditandai, tetapi tidak muncul di query aktif karena mengikuti parent.
- Restore PO mengembalikan PO + DeliveryNote (item otomatis kembali).
- Permanent delete PO menghapus: DeliveryNoteItem → DeliveryNote → PurchaseOrder.

## Active-Only Query

Seluruh query operasional aktif memakai filter `deletedAt: null`:

- dashboard (total PO/SJ, printed/not printed, PO terbaru, perlu diselesaikan);
- Data PO (list, search, filter, statistik);
- detail PO;
- daftar/detail/edit/preview Surat Jalan;
- print confirmation;
- import active duplicate check;
- sample verification.

Helper terpusat: `src/features/soft-delete/active.ts` (`ACTIVE_PO_FILTER`,
`ACTIVE_DN_FILTER`).

## Delete Flow

### Purchase Order

1. Verifikasi session & role admin.
2. Verifikasi PO aktif.
3. Verifikasi optimistic concurrency.
4. Verifikasi konfirmasi (checkbox + nomor PO exact).
5. Hitung jumlah Surat Jalan dan item.
6. Buat `trashBatchId`.
7. Tandai seluruh DeliveryNote terkait deleted.
8. Tandai PO deleted.
9. Catat `deletedById`, `deletionReason`, `deletedAt`.
10. Buat AuditEvent `DELETE`.

### Surat Jalan

1. Verifikasi session & role.
2. Verifikasi Surat Jalan aktif.
3. Verifikasi parent PO aktif.
4. Buat `trashBatchId`.
5. Tandai Surat Jalan deleted.
6. Buat AuditEvent `DELETE`.

## Restore Flow

### Purchase Order

1. Verifikasi session & role.
2. Verifikasi PO terhapus.
3. Deteksi conflict: PO aktif dengan `(companyCode, normalizedPoNumber)` sama.
4. Restore seluruh DeliveryNote dalam trash batch yang sama.
5. Restore PO.
6. Buat AuditEvent `RESTORE`.

### Surat Jalan

1. Verifikasi session & role.
2. Verifikasi Surat Jalan terhapus.
3. Verifikasi **parent PO aktif**.
4. Restore Surat Jalan (item otomatis kembali).
5. Buat AuditEvent `RESTORE`.

Jika parent PO terhapus, restore Surat Jalan terpisah diblokir dengan pesan:
"Surat Jalan tidak dapat dipulihkan secara terpisah. Pulihkan Purchase Order terlebih dahulu."

## Conflict Matrix

| Skenario | Hasil |
|---|---|
| PO aktif dengan nomor sama | Restore PO diblokir |
| Surat Jalan parent PO terhapus | Restore SJ diblokir |
| Delivery Note identity sama aktif | Restore diblokir |
| Data baru sudah di-import aktif | Restore data lama diblokir |
| Optimistic concurrency berubah | Ditangani, minta muat ulang |

## Permanent Delete

- Hanya admin.
- Hanya data di Recycle Bin.
- Konfirmasi: checkbox, ketik `HAPUS PERMANEN`, ketik nomor PO/kode SJ.
- Transaction child-to-parent.
- AuditEvent `PERMANENT_DELETE` tetap tersedia setelah record bisnis dihapus.
- AuditEvent tidak ikut terhapus (tidak ada FK yang meng-cascade ke AuditEvent).

## Unique Index

Partial unique index agar soft-deleted tidak memblokir re-import data aktif:

- `PurchaseOrder (companyCode, normalizedPoNumber) WHERE deletedAt IS NULL`
- `DeliveryNote (uniqueCode) WHERE deletedAt IS NULL`
- `DeliveryNote (purchaseOrderId, normalizedBranchName) WHERE deletedAt IS NULL`

## Duplicate / Re-import

- HASH SAMA + DATA AKTIF → ditolak (DUPLICATE_ACTIVE).
- HASH SAMA + DATA LAMA DI RECYCLE BIN → re-import diizinkan (data baru aktif).
- DATA LAMA DI RECYCLE BIN + DATA BARU AKTIF → restore data lama diblokir.
- Audit history tidak menjadi unique blocker terhadap import.

## Transaction

Soft delete, restore, dan permanent delete berjalan dalam satu `prisma.$transaction`
dengan audit event di dalam transaction yang sama. Jika audit gagal, mutation
dibatalkan.

## Security

- Actor selalu dari session server.
- Timestamp selalu waktu server.
- Client tidak mengirim actor/timestamp/count sebagai sumber kebenaran.
- Permanent delete memvalidasi confirmation di server.
- Data deleted hanya dapat diakses melalui Recycle Bin dan service khusus.
- Route aktif menolak data deleted (notFound / error).

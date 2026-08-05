# Phase 5 — Database Migration Plan

## Schema Changes (Bagian 1 + Bagian 2)

### Bagian 1 — Audit History
- Model `AuditEvent` (id, entityType, entityId, entityLabelSnapshot, action,
  actor snapshots, occurredAt, source, requestId, batchId, changedFields,
  beforeData, afterData, metadata, createdAt).
- Index: occurredAt, (entityType, entityId), action, actorId, source, requestId, batchId.
- FK `AuditEvent.actorId` → User `ON DELETE SET NULL`.

Migration: `20260803182849_phase_5_add_audit_history`.

### Bagian 2 — Soft Delete & Recycle Bin
- `PurchaseOrder` + kolom: `deletedAt`, `deletedById`, `deletionReason`, `trashBatchId`.
- `DeliveryNote` + kolom: `deletedAt`, `deletedById`, `deletionReason`, `trashBatchId`.
- Hapus full unique constraints:
  - `PurchaseOrder (companyCode, normalizedPoNumber)`
  - `DeliveryNote (uniqueCode)`
  - `DeliveryNote (purchaseOrderId, normalizedBranchName)`
- Tambah index: `deletedAt`, `trashBatchId` pada PurchaseOrder dan DeliveryNote.
- FK `deletedById` → User `ON DELETE SET NULL`.

Migration: `20260805140504_phase_5_add_soft_delete_recycle_bin`.

## Index

| Tabel | Index | Tipe |
|---|---|---|
| AuditEvent | occurredAt | B-tree |
| AuditEvent | (entityType, entityId) | B-tree |
| AuditEvent | action | B-tree |
| AuditEvent | actorId | B-tree |
| AuditEvent | source | B-tree |
| AuditEvent | requestId | B-tree |
| AuditEvent | batchId | B-tree |
| PurchaseOrder | deletedAt | B-tree |
| PurchaseOrder | trashBatchId | B-tree |
| DeliveryNote | deletedAt | B-tree |
| DeliveryNote | trashBatchId | B-tree |

## Partial Unique Index

Raw SQL (Prisma tidak mendukung partial unique deklaratif):

```sql
CREATE UNIQUE INDEX "PurchaseOrder_companyCode_normalizedPoNumber_active_key"
ON "PurchaseOrder"("companyCode", "normalizedPoNumber")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "DeliveryNote_uniqueCode_active_key"
ON "DeliveryNote"("uniqueCode")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "DeliveryNote_purchaseOrderId_normalizedBranchName_active_key"
ON "DeliveryNote"("purchaseOrderId", "normalizedBranchName")
WHERE "deletedAt" IS NULL;
```

## Backfill

Tidak diperlukan backfill: seluruh record existing memiliki `deletedAt = NULL`
(default), sehingga tetap dianggap aktif.

## Compatibility

- Record existing (deletedAt null) tetap muncul di seluruh query aktif.
- Soft-deleted record tidak memblokir re-import data aktif (partial unique).
- Audit history tetap utuh; tidak ada cascade menuju AuditEvent.

## Rollback Plan

Jika Bagian 2 perlu dirollback:

1. Hapus partial unique index.
2. Pulihkan full unique constraint (setelah memastikan tidak ada duplikat aktif).
3. Hapus kolom `deletedAt`, `deletedById`, `deletionReason`, `trashBatchId`.

## Development Backup

Database development dibackup sebelum migration menggunakan mekanisme aman
(lihat setup project). Migration diaplikasikan pada database development.

## Production Migration Status

**NOT RUN** — tidak ada migration production pada fase ini.

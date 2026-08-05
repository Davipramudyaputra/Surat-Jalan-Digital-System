# Phase 5 — Audit Event Matrix

Dokumen ini mendokumentasikan setiap audit event yang dihasilkan Global History
& Audit Trail (Bagian 1). Nilai action, entity type, dan source menggunakan
konstanta terpusat di `src/features/audit/constants/index.ts`.

---

## 1. Konstanta

### Action
`CREATE`, `UPDATE`, `DELETE`, `IMPORT`, `REIMPORT`, `PRINT`, `REPRINT`,
`PRINT_STATUS_RESET`, `STATUS_CHANGE`, `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`.

`RESTORE` dan `PERMANENT_DELETE` dideklarasikan untuk Bagian 2 dan belum
diintegrasikan.

### Entity Type
`PURCHASE_ORDER`, `DELIVERY_NOTE`, `DELIVERY_NOTE_ITEM`, `IMPORT_JOB`,
`PRINT_AUDIT`, `USER_AUTH`, `SYSTEM_SETTING`.

Hanya entity yang benar-benar tersedia pada project yang digunakan.

### Source
`PO_IMPORT`, `PO_EDITOR`, `PO_DELETE_DIALOG`, `DELIVERY_NOTE_EDITOR`,
`DELIVERY_NOTE_PRINT`, `AUTH`, `SYSTEM`.

---

## 2. Event Matrix

### Purchase Order

| Action | Source | Before | After | Metadata | Mutation source | Transaction |
|---|---|---|---|---|---|---|
| UPDATE | PO_EDITOR | Ya | Ya | changedFields | `editPurchaseOrderAction` | Sama (tx) |
| DELETE | PO_DELETE_DIALOG | Ya (summary) | Tidak | deliveryNoteCount, itemCount | `deletePurchaseOrderAction` | Sama (tx) |

### Import

| Action | Source | Before | After | Metadata | Mutation source | Transaction |
|---|---|---|---|---|---|---|
| IMPORT | PO_IMPORT | Tidak | Ya (summary) | fileHash, classification, counts, databaseChanges | `importPurchaseOrder` | Sama (tx) |
| REIMPORT | PO_IMPORT | Tidak | Ya (summary) | fileHash, classification, counts, databaseChanges | `importPurchaseOrder` | Sama (tx) |

Duplicate yang ditolak tidak menghasilkan event IMPORT/REIMPORT.

### Surat Jalan

| Action | Source | Before | After | Metadata | Mutation source | Transaction |
|---|---|---|---|---|---|---|
| UPDATE | DELIVERY_NOTE_EDITOR | Ya (field berubah) | Ya | itemsChanged, documentChanged, poNumber | `updateDeliveryNote` | Sama (tx) |
| PRINT_STATUS_RESET | DELIVERY_NOTE_EDITOR | Ya (status) | Ya (status) | editedFields, previous/new status, previousPrintCount | `updateDeliveryNote` (saat data PRINTED diedit) | Sama (tx) |

### Print

| Action | Source | Before | After | Metadata | Mutation source | Transaction |
|---|---|---|---|---|---|---|
| PRINT | DELIVERY_NOTE_PRINT | Tidak | Ya (status) | paperProfile, dimensions, orientation, pageCount, previous/new printCount | `markDeliveryNotePrinted` | Sama (tx) |
| REPRINT | DELIVERY_NOTE_PRINT | Tidak | Ya (status) | paperProfile, previous/new printCount | `markDeliveryNotePrinted` (printCount > 0) | Sama (tx) |

PRINT/REPRINT hanya dibuat setelah user mengonfirmasi hasil cetak berhasil.

### Autentikasi

| Action | Source | Before | After | Metadata | Mutation source | Transaction |
|---|---|---|---|---|---|---|
| LOGIN | AUTH | Tidak | Tidak | - | `loginAction` (berhasil) | Terpisah (write audit) |
| LOGOUT | AUTH | Tidak | Tidak | - | `logoutAction` | Terpisah (write audit) |
| PASSWORD_CHANGE | AUTH | Tidak | Tidak | status: success | `changePasswordAction` (berhasil) | Terpisah (write audit) |

---

## 3. Actor

Actor selalu berasal dari **session server** (`requireAdmin`), bukan dari client.
Nilai yang disimpan adalah snapshot:

- `actorId`
- `actorNameSnapshot`
- `actorIdentifierSnapshot`
- `actorRoleSnapshot`

Event internal sistem memakai actor `SYSTEM`.

## 4. Timestamp

`occurredAt` dan `createdAt` selalu diisi waktu server.

Client tidak dapat mengirim actor maupun timestamp sebagai sumber kebenaran.

## 5. Redacted Fields

Field berikut selalu dibuang/diganti `[REDACTED]` sebelum disimpan:

- password, passwordHash, passwordConfirmation
- currentPassword, newPassword
- sessionToken, refreshToken, token
- apiKey, secret, privateKey
- databaseUrl, authSecret, sessionSecret
- cookie, authorization, credential

Redaction bersifat rekursif dan case-insensitive (`src/features/audit/lib/redact.ts`).

## 6. Immutability

Audit event tidak memiliki aksi edit/delete pada UI maupun application layer.
Tidak ada route yang mengubah/menghapus AuditEvent.

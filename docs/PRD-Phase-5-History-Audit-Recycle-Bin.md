# PRD Phase 5 — Global History, Audit Trail, Soft Delete, dan Recycle Bin

**Project:** Sistem Surat Jalan Digital  
**Perusahaan:** CV. Pramudya Putra  
**Versi:** 1.0  
**Status:** Siap direview sebelum implementasi  
**Branch sumber:** `main`  
**Branch target:** `phase/05-history-recycle-bin`

**Urutan implementasi:**

1. Global History & Audit Trail
2. Soft Delete & Recycle Bin

---

## 1. Ringkasan Eksekutif

Phase 5 menambahkan dua kemampuan utama:

### Global History & Audit Trail

Sistem mencatat perubahan penting terhadap data bisnis, meliputi:

- siapa yang melakukan perubahan;
- kapan perubahan dilakukan;
- entitas yang berubah;
- jenis tindakan;
- field yang berubah;
- nilai sebelum perubahan;
- nilai setelah perubahan;
- sumber tindakan;
- metadata pendukung.

### Soft Delete & Recycle Bin

Purchase Order dan Surat Jalan yang dihapus tidak langsung hilang secara permanen. Data dipindahkan ke Recycle Bin dan masih dapat dipulihkan selama belum dilakukan permanent delete.

Global History harus diselesaikan terlebih dahulu karena tindakan berikut harus menghasilkan audit event:

- `DELETE`;
- `RESTORE`;
- `PERMANENT_DELETE`.

Seluruh fungsi Phase 1 sampai Phase 4 wajib tetap berjalan.

---

## 2. Latar Belakang

Sistem saat ini telah memiliki:

- authentication dan session;
- dashboard;
- upload dan import Excel;
- Purchase Order;
- Surat Jalan;
- item Surat Jalan;
- pencarian dan filter;
- edit PO;
- delete PO;
- edit Surat Jalan;
- duplicate detection;
- re-import;
- template dan preview Surat Jalan;
- Setengah Folio sebagai format utama;
- A4, A5, B3, dan ukuran custom;
- `Ctrl + P`;
- `Command + P`;
- status cetak;
- `firstPrintedAt`;
- `lastPrintedAt`;
- `printCount`.

Phase 5 dibutuhkan untuk meningkatkan traceability dan mencegah kehilangan data akibat kesalahan penghapusan.

---

## 3. Tujuan

1. Mencatat seluruh mutation penting terhadap data bisnis.
2. Menyediakan halaman Global History.
3. Menyediakan history pada detail PO.
4. Menyediakan history pada detail Surat Jalan.
5. Menyimpan actor, waktu server, source, before, after, dan changed fields.
6. Menjaga audit event immutable dari UI.
7. Mengubah delete normal menjadi soft delete.
8. Menyediakan Recycle Bin.
9. Menyediakan restore PO dan Surat Jalan.
10. Mendeteksi konflik sebelum restore.
11. Menyediakan permanent delete untuk admin.
12. Mengecualikan data terhapus dari query aktif.
13. Mempertahankan duplicate detection dan re-import.
14. Mempertahankan status dan audit cetak Phase 4.
15. Mencegah data sensitif masuk audit log.
16. Menjaga mutation penting tetap transactional.

---

## 4. Non-Scope

Phase 5 tidak mencakup:

- download PDF;
- batch print;
- batch PDF;
- ZIP export;
- tanda tangan digital;
- pengiriman email;
- integrasi WhatsApp;
- approval bertingkat;
- auto purge terjadwal;
- deployment production;
- monitoring production;
- backup production otomatis;
- audit setiap page view;
- audit setiap klik;
- audit pencarian dan filter biasa;
- audit perubahan zoom preview;
- audit pergantian ukuran kertas sementara;
- recycle bin khusus item Surat Jalan;
- edit audit event;
- delete audit event melalui UI.

---

## 5. Struktur Implementasi

Phase 5 menggunakan satu branch:

```text
phase/05-history-recycle-bin
```

Implementasi dibagi menjadi dua tahap.

### Tahap 1 — Global History & Audit Trail

Mencakup:

- AuditEvent schema;
- migration audit;
- audit service;
- redaction;
- integration dengan mutation existing;
- Global History;
- contextual history;
- print history;
- auth history;
- automated test.

Pada tahap ini delete PO existing belum diubah menjadi soft delete.

### Tahap 2 — Soft Delete & Recycle Bin

Mencakup:

- field soft delete;
- trash batch;
- active-only queries;
- Recycle Bin;
- restore;
- restore conflict;
- permanent delete;
- unique constraint adjustment;
- duplicate/re-import regression;
- event `DELETE`, `RESTORE`, dan `PERMANENT_DELETE`;
- automated test dan UAT.

Tahap 2 hanya boleh dimulai setelah Tahap 1 direview.

---

# BAGIAN A — GLOBAL HISTORY & AUDIT TRAIL

## 6. Definisi History

History merupakan catatan mutation data bisnis yang berhasil.

History tidak digunakan untuk mencatat:

- membuka halaman;
- klik biasa;
- pencarian;
- filter;
- pergantian tab;
- zoom preview;
- pergantian paper profile sementara.

---

## 7. Entitas yang Dicakup

Entitas minimal:

```text
PURCHASE_ORDER
DELIVERY_NOTE
DELIVERY_NOTE_ITEM
IMPORT_JOB
PRINT_AUDIT
USER_AUTH
SYSTEM_SETTING
```

Gunakan nama enum dan naming convention berdasarkan Prisma schema aktual.

Jangan membuat entitas yang tidak tersedia pada project.

---

## 8. Jenis Audit Event

Jenis event minimal:

```text
CREATE
UPDATE
DELETE
RESTORE
PERMANENT_DELETE
IMPORT
REIMPORT
PRINT
REPRINT
PRINT_STATUS_RESET
STATUS_CHANGE
LOGIN
LOGOUT
PASSWORD_CHANGE
```

Event hanya dibuat setelah tindakan berhasil.

Mutation gagal tidak boleh menghasilkan success audit event.

---

## 9. Model Audit Konseptual

Model konseptual:

```text
AuditEvent
- id
- entityType
- entityId
- entityLabelSnapshot
- action
- actorId
- actorNameSnapshot
- actorIdentifierSnapshot
- actorRoleSnapshot
- occurredAt
- source
- requestId
- batchId
- changedFields
- beforeData
- afterData
- metadata
- createdAt
```

Ketentuan:

- naming final mengikuti schema aktual;
- audit tetap dapat dibaca setelah entitas dihapus permanen;
- actor snapshot tetap terbaca walaupun akun berubah;
- field JSON dapat digunakan untuk snapshot minimal;
- audit event tidak dapat diedit dari UI;
- audit event tidak ikut terhapus ketika actor atau entitas dihapus.

---

## 10. Actor dan Timestamp

Actor harus berasal dari session server.

Simpan jika tersedia:

- actor ID;
- nama actor;
- email atau username yang aman;
- role actor.

Event internal sistem menggunakan actor:

```text
SYSTEM
```

Timestamp menggunakan waktu server.

Client tidak boleh mengirim actor atau timestamp sebagai sumber kebenaran.

---

## 11. Before, After, dan Changed Fields

Untuk event `UPDATE`, hanya field yang benar-benar berubah yang disimpan.

Contoh:

```json
{
  "changedFields": [
    "vehicle",
    "vehicleNumber"
  ],
  "beforeData": {
    "vehicle": null,
    "vehicleNumber": null
  },
  "afterData": {
    "vehicle": "Toyota Blind Van",
    "vehicleNumber": "D 1234 AB"
  }
}
```

Jangan menyimpan seluruh record jika hanya dua field yang berubah.

---

## 12. Data Sensitif

Audit event dilarang menyimpan:

- password;
- password hash;
- session token;
- refresh token;
- API key;
- secret;
- private key;
- database URL;
- auth secret;
- cookie;
- authorization header;
- file credential.

Untuk `PASSWORD_CHANGE`, cukup simpan:

- actor;
- waktu;
- source;
- status berhasil.

Jangan menyimpan password lama, password baru, atau hash.

---

## 13. Event Matrix Minimum

| Entitas | Action | Before | After | Metadata |
|---|---|---:|---:|---|
| PO | CREATE | Tidak | Ya | source/import |
| PO | UPDATE | Ya | Ya | changedFields |
| PO | DELETE | Summary | Tidak | relatedCounts |
| PO | RESTORE | Summary | Ya | trashBatchId |
| PO | PERMANENT_DELETE | Summary | Tidak | relatedCounts |
| Surat Jalan | CREATE | Tidak | Ya | PO dan cabang |
| Surat Jalan | UPDATE | Ya | Ya | changedFields |
| Surat Jalan | DELETE | Ya | Tidak | parent PO |
| Surat Jalan | RESTORE | Summary | Ya | trashBatchId |
| Item | CREATE | Tidak | Ya | deliveryNoteId |
| Item | UPDATE | Ya | Ya | changedFields |
| Item | DELETE | Ya | Tidak | parent |
| Import | IMPORT | Tidak | Summary | hash dan counts |
| Import | REIMPORT | Summary | Summary | hash dan counts |
| Print | PRINT | Tidak | Summary | paper dan count |
| Print | REPRINT | Summary | Summary | old/new count |
| Print | PRINT_STATUS_RESET | Summary | Summary | editedFields |
| Auth | LOGIN | Tidak | Tidak | actor/source |
| Auth | LOGOUT | Tidak | Tidak | actor/source |
| Auth | PASSWORD_CHANGE | Tidak | Tidak | actor/source |

---

## 14. Audit Service

Buat service audit terpusat untuk:

- mengambil actor dari session;
- melakukan redaction;
- membuat timestamp server;
- menentukan source;
- menghitung changed fields;
- menormalisasi before/after snapshot;
- menormalisasi metadata;
- membuat entity label snapshot.

Mutation penting dan audit event sebaiknya berada dalam transaction yang sama.

Jika audit event gagal dibuat, mutation penting sebaiknya ikut dibatalkan agar tidak ada perubahan tanpa history.

---

## 15. Audit Source

Gunakan enum atau constant terpusat.

Contoh:

```text
PO_IMPORT
PO_EDITOR
PO_DELETE_DIALOG
DELIVERY_NOTE_EDITOR
DELIVERY_NOTE_PRINT
RECYCLE_BIN
AUTH
SYSTEM
```

---

## 16. Global History

Tambahkan route:

```text
/history
```

Kolom minimal:

- tanggal dan waktu;
- actor;
- action;
- entity type;
- entity identity;
- ringkasan;
- source;
- detail.

Filter:

- rentang tanggal;
- actor;
- entity type;
- action;
- nomor PO;
- cabang;
- search.

Ketentuan:

- server-side pagination;
- event terbaru tampil lebih dahulu;
- stable sort;
- tidak mengambil seluruh event sekaligus.

---

## 17. Detail Audit Event

Detail dapat menggunakan drawer, modal, atau halaman terpisah.

Tampilkan:

- event ID;
- actor;
- action;
- entity;
- entity ID;
- entity label snapshot;
- waktu;
- source;
- changed fields;
- before data;
- after data;
- metadata;
- request ID;
- batch ID.

Jangan menampilkan JSON mentah sebagai satu-satunya tampilan.

---

## 18. Contextual History

### Detail Purchase Order

Tambahkan tab atau section:

```text
History
```

Menampilkan event PO dan event child penting bila relevan.

### Detail Surat Jalan

Tambahkan tab atau section:

```text
History
```

Menampilkan:

- update data;
- perubahan item;
- print;
- reprint;
- print status reset;
- delete dan restore setelah Tahap 2.

---

## 19. Print History

Field Phase 4 tetap dipertahankan:

- `printStatus`;
- `firstPrintedAt`;
- `lastPrintedAt`;
- `printCount`.

Audit event tambahan:

### PRINT

Metadata:

- paper profile;
- orientation;
- page count;
- print count;
- actor.

### REPRINT

Metadata:

- previous print count;
- new print count;
- paper profile;
- orientation.

### PRINT_STATUS_RESET

Metadata:

- edited fields;
- previous status;
- new status.

Membuka preview, mengganti paper profile, dan menjalankan `window.print()` tidak langsung menghasilkan event `PRINT`.

Event dibuat setelah user mengonfirmasi hasil cetak berhasil.

---

## 20. Auth History

Catat:

- login berhasil;
- logout;
- password change berhasil.

Login gagal belum termasuk Global History bisnis Phase 5.

Security log untuk login gagal dapat dibuat pada fase lain.

---

# BAGIAN B — SOFT DELETE & RECYCLE BIN

## 21. Definisi Soft Delete

Delete normal tidak langsung menghapus data dari database.

Entitas yang masuk Recycle Bin:

```text
PurchaseOrder
DeliveryNote
```

Item Surat Jalan mengikuti parent dan tidak memiliki tab Recycle Bin sendiri.

---

## 22. Field Soft Delete Konseptual

Field minimal:

```text
deletedAt
deletedById
deletionReason
trashBatchId
```

Field opsional:

```text
restoredAt
restoredById
```

Nama field final ditentukan setelah audit schema dan unique constraints.

---

## 23. Trash Batch

`trashBatchId` mengelompokkan satu operasi penghapusan aggregate.

Contoh:

```text
1 PurchaseOrder
92 DeliveryNote
462 DeliveryNoteItem
```

Trash batch digunakan untuk:

- memastikan restore lengkap;
- menyimpan related counts;
- permanent delete;
- audit consistency.

---

## 24. Delete Purchase Order

Flow:

1. verifikasi session;
2. verifikasi role;
3. verifikasi PO aktif;
4. validasi confirmation existing;
5. hitung child records;
6. buat trash batch;
7. tandai PO terhapus;
8. tandai Surat Jalan terkait;
9. tandai item mengikuti parent bila diperlukan;
10. tulis event `DELETE`;
11. commit transaction.

Setelah delete:

- tidak muncul pada Data PO;
- tidak muncul pada dashboard;
- tidak muncul pada search aktif;
- tidak dapat diedit;
- tidak dapat dipreview;
- tidak dapat dicetak;
- muncul pada Recycle Bin;
- duplicate/re-import tetap mengikuti policy.

---

## 25. Delete Surat Jalan

Ketentuan:

- parent PO tetap aktif;
- Surat Jalan ditandai terhapus;
- item mengikuti Surat Jalan;
- statistik PO dihitung ulang;
- event `DELETE` dibuat;
- operation menggunakan transaction.

---

## 26. Active-Only Queries

Semua query normal wajib mengecualikan data soft deleted:

- dashboard;
- Data PO;
- search;
- filter;
- detail PO;
- statistik PO;
- daftar Surat Jalan;
- detail Surat Jalan;
- editor;
- preview;
- print;
- sample verification.

Data terhapus tidak boleh dihitung pada:

- total PO;
- total Surat Jalan;
- printed;
- not printed;
- progress;
- latest PO;
- need attention.

Gunakan helper atau abstraction terpusat bila memungkinkan agar filter `deletedAt: null` tidak terlupa.

---

## 27. Recycle Bin

Tambahkan route:

```text
/recycle-bin
```

Tab:

```text
Purchase Order
Surat Jalan
```

### Tab Purchase Order

Kolom:

- nomor PO;
- perusahaan;
- jumlah Surat Jalan;
- jumlah item;
- dihapus oleh;
- tanggal dihapus;
- alasan;
- umur di Recycle Bin;
- action.

### Tab Surat Jalan

Kolom:

- document number atau identity;
- cabang;
- nomor PO;
- jumlah item;
- status cetak snapshot;
- dihapus oleh;
- tanggal dihapus;
- action.

Action:

```text
Lihat Detail
Pulihkan
Hapus Permanen
```

Detail data terhapus bersifat read-only.

Gunakan server-side pagination.

---

## 28. Restore Purchase Order

Restore PO mengembalikan dalam satu transaction:

- PurchaseOrder;
- DeliveryNote;
- DeliveryNoteItem;
- relasi terkait dari trash batch yang sama.

Sebelum restore:

- verifikasi session;
- verifikasi role;
- verifikasi state terhapus;
- periksa nomor PO aktif yang sama;
- periksa duplicate hash;
- periksa child conflict;
- periksa unique constraints;
- periksa optimistic concurrency.

Event `RESTORE` hanya dibuat setelah restore berhasil.

---

## 29. Restore Surat Jalan

Restore Surat Jalan hanya diperbolehkan jika:

- parent PO aktif;
- tidak ada unique conflict;
- child tersedia;
- actor memiliki izin.

Jika parent PO masih berada di Recycle Bin:

```text
Surat Jalan tidak dapat dipulihkan secara terpisah.
Pulihkan Purchase Order terlebih dahulu.
```

---

## 30. Restore Conflict

Restore tidak boleh menimpa data aktif.

Conflict minimal:

- nomor PO yang sama sudah aktif;
- Delivery Note dengan identity sama sudah aktif;
- file atau hash sudah di-import ulang;
- parent masih terhapus;
- relasi tidak valid;
- unique index conflict.

Behaviour:

- blokir restore;
- jelaskan penyebab;
- tampilkan link ke data aktif jika aman;
- jangan rename otomatis;
- jangan merge otomatis;
- jangan overwrite otomatis.

---

## 31. Duplicate Detection dan Re-import

Pertahankan aturan Phase 3.

### Hash sama dan data aktif

```text
DUPLICATE_ACTIVE
```

Tidak membuat duplikat.

### Hash history ada dan data lama di Recycle Bin

Re-import diperbolehkan sesuai policy existing.

Data baru menjadi aktif.

Data lama tetap berada di Recycle Bin.

Restore data lama diblokir apabila terjadi konflik.

Audit history tidak boleh memblokir re-import selamanya.

---

## 32. Unique Constraint dan Index

Audit field unique:

- nomor PO;
- document number;
- unique code;
- file hash;
- import hash.

Jika diperlukan, gunakan partial unique index untuk data aktif:

```sql
WHERE deleted_at IS NULL
```

Jika Prisma tidak mendukung deklarasi penuh, gunakan raw SQL migration yang terkontrol.

Jangan menggunakan `prisma db push` sebagai pengganti migration yang aman.

---

## 33. Permanent Delete

Permanent delete:

- admin-only;
- hanya tersedia di Recycle Bin;
- tidak tersedia dari data aktif.

Konfirmasi minimum:

1. warning merah;
2. checkbox persetujuan;
3. ketik `HAPUS PERMANEN`;
4. ketik nomor PO atau identity Surat Jalan;
5. konfirmasi final.

Server harus memvalidasi seluruh konfirmasi.

Permanent delete PO dilakukan dalam transaction:

```text
DeliveryNoteItem
→ DeliveryNote
→ PurchaseOrder
```

Event `PERMANENT_DELETE` tetap disimpan dengan snapshot summary yang aman.

Audit event tidak ikut dihapus.

---

## 34. Retention

Rekomendasi default:

```text
30 hari
```

Phase 5 belum menjalankan auto purge.

Data yang melewati retention dapat diberi badge, tetapi permanent delete tetap dilakukan secara manual.

---

## 35. Dashboard dan Statistik

Data soft deleted tidak boleh dihitung pada:

- Total PO;
- Total Surat Jalan;
- Sudah Dicetak;
- Belum Dicetak;
- progress;
- PO terbaru;
- perlu diselesaikan.

Card Recycle Bin bersifat opsional dan hanya dibuat jika route dan data sudah benar-benar tersedia.

---

## 36. Error Handling

Gunakan Bahasa Indonesia.

Contoh:

```text
Data dipindahkan ke Recycle Bin.
Data berhasil dipulihkan.
Data tidak dapat dipulihkan karena nomor PO yang sama sudah aktif.
Purchase Order induk masih berada di Recycle Bin.
Penghapusan permanen gagal.
Data telah berubah. Muat ulang halaman.
Anda tidak memiliki izin.
```

Jangan menampilkan Prisma stack trace pada UI.

---

## 37. Security

Wajib:

- session server-side;
- role verification;
- actor dari session;
- timestamp server;
- redaction;
- immutable audit;
- transaction;
- optimistic concurrency;
- tidak mempercayai actor dari client;
- tidak mempercayai count dari client;
- tidak mempercayai status dari client;
- tidak mempercayai timestamp dari client;
- tidak menyimpan payload sensitif.

---

## 38. Performance

### Global History

Gunakan:

- server-side pagination;
- index `occurredAt`;
- index `entityType` dan `entityId`;
- index `action`;
- index `actorId`;
- index `batchId` atau `requestId` bila digunakan;
- stable sorting;
- field selection yang spesifik.

### Recycle Bin

Gunakan:

- index `deletedAt`;
- index `trashBatchId`;
- active/deleted query yang efisien.

---

## 39. Database Migration Plan

Audit dan persiapkan:

1. AuditEvent model.
2. Audit enum.
3. Actor snapshot.
4. JSON snapshot.
5. Soft delete fields.
6. Trash batch.
7. Indexes.
8. Partial unique indexes.
9. Migration order.
10. Backfill.
11. Compatibility dengan data lama.
12. Rollback plan.

Dilarang:

```text
prisma migrate reset
prisma db push --force-reset
docker compose down -v
DROP DATABASE
DROP TABLE
TRUNCATE
```

Backup database development sebelum migration.

---

## 40. Automated Tests

### History

1. Create PO menghasilkan event.
2. Edit PO menghasilkan before/after.
3. Import menghasilkan event summary.
4. Re-import menghasilkan event.
5. Edit Surat Jalan menghasilkan changed fields.
6. Perubahan item menghasilkan event.
7. PRINT dibuat setelah konfirmasi.
8. REPRINT memperbarui event.
9. PRINT_STATUS_RESET tercatat.
10. Login dan logout tercatat.
11. Password change tidak menyimpan password.
12. Actor berasal dari session.
13. Timestamp berasal dari server.
14. Sensitive fields ter-redact.
15. Mutation gagal tidak membuat success event.
16. Global History pagination stabil.
17. Contextual history terfilter dengan benar.

### Soft Delete

1. Delete PO menandai aggregate terhapus.
2. Child mengikuti parent.
3. PO tidak muncul di active query.
4. Dashboard tidak menghitung deleted data.
5. Preview deleted data ditolak.
6. Edit deleted data ditolak.
7. Print deleted data ditolak.
8. Delete Surat Jalan tidak menghapus parent.
9. Statistik PO diperbarui.
10. Event DELETE dibuat.

### Restore

1. Restore PO mengembalikan seluruh child.
2. Restore Surat Jalan berhasil jika parent aktif.
3. Restore child ditolak jika parent terhapus.
4. Conflict PO aktif ditolak.
5. Conflict Surat Jalan ditolak.
6. Restore tidak overwrite.
7. Event RESTORE dibuat.
8. Statistik kembali benar.

### Permanent Delete

1. Hanya admin.
2. Hanya data Recycle Bin.
3. Confirmation divalidasi server.
4. Transaction child-to-parent.
5. Event PERMANENT_DELETE tetap tersedia.
6. Audit history tidak ikut terhapus.
7. Failure tidak membuat success event.

### Regression

- upload;
- import;
- duplicate detection;
- re-import;
- edit PO;
- edit Surat Jalan;
- preview;
- paper profile;
- print;
- print audit;
- sample verification;
- UI Phase 4.

---

## 41. Sample Verification

Gunakan sample existing:

```text
PO: 678/PPU SOF CCM/VII/2026
Perusahaan: PT. SUMMIT OTO FINANCE
Total Surat Jalan: 92
Total Item: 462
```

Scenario:

1. Import sample.
2. Verifikasi import event.
3. Edit satu Surat Jalan.
4. Verifikasi history.
5. Print dan reprint.
6. Verifikasi print events.
7. Delete PO.
8. Pastikan data hilang dari active query.
9. Pastikan Recycle Bin menunjukkan 92 Surat Jalan dan 462 item.
10. Restore PO.
11. Pastikan seluruh data dan statistik kembali.
12. Delete ulang.
13. Re-import data yang sama.
14. Coba restore versi lama.
15. Pastikan restore diblokir karena conflict.

Jangan mengubah expected sample.

---

## 42. UAT Manual

### Global History

1. Login.
2. Buka `/history`.
3. Import PO.
4. Edit PO.
5. Edit Surat Jalan.
6. Cetak.
7. Cetak ulang.
8. Edit setelah cetak.
9. Verifikasi before dan after.
10. Buka history PO.
11. Buka history Surat Jalan.
12. Filter actor, action, dan tanggal.

### Recycle Bin

1. Delete Surat Jalan.
2. Pastikan hilang dari data aktif.
3. Restore Surat Jalan.
4. Delete PO.
5. Pastikan child ikut terhapus.
6. Pastikan statistik berubah.
7. Restore PO.
8. Pastikan child kembali.
9. Delete PO lagi.
10. Re-import PO yang sama.
11. Coba restore data lama.
12. Pastikan conflict tampil.
13. Uji permanent delete dengan confirmation salah.
14. Pastikan ditolak.
15. Uji permanent delete dengan confirmation benar.
16. Pastikan audit event tetap tersedia.

---

## 43. Acceptance Criteria — Global History

1. Audit model tersedia.
2. Migration tersedia.
3. Audit service terpusat.
4. Actor berasal dari session.
5. Timestamp berasal dari server.
6. Before/after tersedia untuk update.
7. Changed fields akurat.
8. Sensitive data tidak tersimpan.
9. Global History tersedia.
10. Filter tersedia.
11. Pagination server-side tersedia.
12. Detail event mudah dibaca.
13. PO history tersedia.
14. Surat Jalan history tersedia.
15. Import history tersedia.
16. Print history tersedia.
17. Auth history tersedia.
18. Audit event tidak dapat diedit.
19. Audit event tidak dapat dihapus dari UI.
20. Tests PASS.

---

## 44. Acceptance Criteria — Recycle Bin

1. Delete normal menjadi soft delete.
2. PO terhapus tidak muncul pada active query.
3. Surat Jalan terhapus tidak muncul pada active query.
4. Dashboard tidak menghitung deleted data.
5. Preview, edit, dan print deleted data ditolak.
6. Recycle Bin tersedia.
7. Tab PO tersedia.
8. Tab Surat Jalan tersedia.
9. Detail read-only tersedia.
10. Restore PO tersedia.
11. Restore Surat Jalan tersedia.
12. Parent-child restore konsisten.
13. Restore conflict tersedia.
14. Restore tidak overwrite.
15. Permanent delete admin-only.
16. Confirmation kuat.
17. Permanent delete menggunakan transaction.
18. Event DELETE tersedia.
19. Event RESTORE tersedia.
20. Event PERMANENT_DELETE tersedia.
21. Duplicate/re-import tetap bekerja.
22. Unique constraint aman.
23. Audit history tetap ada setelah permanent delete.
24. Tests PASS.

---

## 45. General Acceptance Criteria

1. Branch dibuat dari `main` yang sudah berisi Phase 4.
2. `main` sudah menjadi default branch.
3. Database development telah dibackup.
4. Tidak ada secret.
5. Migration aman.
6. Prisma validate PASS.
7. Prisma generate PASS.
8. Prisma migrate status PASS atau dijelaskan.
9. Lint PASS.
10. Typecheck PASS atau NOT AVAILABLE.
11. Build PASS.
12. Test PASS.
13. Verify sample PASS.
14. Tidak ada regression Phase 4.
15. Tidak ada PDF atau batch print.
16. Tidak ada auto purge.
17. Tidak commit sebelum review tahap terkait.
18. Tidak push sebelum review tahap terkait.

---

## 46. Deliverables

### Tahap 1

- audit schema dan migration;
- AuditEvent;
- audit service;
- redaction utility;
- event matrix;
- Global History;
- contextual history;
- automated tests;
- laporan Tahap 1.

### Tahap 2

- soft delete migration;
- active-only query;
- Recycle Bin;
- restore service;
- restore conflict;
- permanent delete;
- partial unique index bila diperlukan;
- automated tests;
- UAT;
- laporan final Phase 5.

---

## 47. Definition of Done

Phase 5 dinyatakan selesai ketika:

- Global History selesai dan tervalidasi;
- Recycle Bin selesai dan tervalidasi;
- mutation penting memiliki audit event;
- delete normal dapat dipulihkan;
- restore conflict aman;
- permanent delete terlindungi;
- deleted data tidak masuk query dan statistik aktif;
- duplicate/re-import tidak rusak;
- print audit tidak rusak;
- sensitive data tidak masuk history;
- migration aman;
- tests lulus;
- sample verification lulus;
- Phase 4 tidak mengalami regression;
- hasil siap untuk manual UAT;
- belum merge ke `main` sebelum persetujuan user.

---

## 48. Instruksi Implementasi untuk OpenCode

1. Baca PRD ini seluruhnya.
2. Audit Prisma schema aktual.
3. Audit migration existing.
4. Audit mutation PO dan Surat Jalan.
5. Audit delete logic existing.
6. Audit duplicate detection dan re-import.
7. Audit print audit Phase 4.
8. Jangan mengarang field.
9. Jangan reset database.
10. Jangan mengubah expected sample.
11. Kerjakan Tahap 1 terlebih dahulu.
12. Jangan mulai Tahap 2 sebelum Tahap 1 direview.
13. Jangan commit atau push sebelum instruksi eksplisit.

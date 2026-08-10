/**
 * Audit constants — Phase 5 Global History & Audit Trail.
 *
 * Nilai disimpan sebagai string pada kolom `AuditEvent.action` dan
 * `AuditEvent.source` agar tidak memerlukan enum database (menghindari
 * migration destructive pada Postgres). Seluruh referensi memakai konstanta
 * terpusat ini.
 */

export const AUDIT_ACTION = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
  PERMANENT_DELETE: "PERMANENT_DELETE",
  IMPORT: "IMPORT",
  REIMPORT: "REIMPORT",
  PRINT: "PRINT",
  REPRINT: "REPRINT",
  PRINT_STATUS_RESET: "PRINT_STATUS_RESET",
  STATUS_CHANGE: "STATUS_CHANGE",
  PDF_EXPORT: "PDF_EXPORT",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export const AUDIT_ENTITY_TYPE = {
  PURCHASE_ORDER: "PURCHASE_ORDER",
  DELIVERY_NOTE: "DELIVERY_NOTE",
  DELIVERY_NOTE_ITEM: "DELIVERY_NOTE_ITEM",
  IMPORT_JOB: "IMPORT_JOB",
  PRINT_AUDIT: "PRINT_AUDIT",
  USER_AUTH: "USER_AUTH",
  SYSTEM_SETTING: "SYSTEM_SETTING",
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];

export const AUDIT_SOURCE = {
  PO_IMPORT: "PO_IMPORT",
  PO_EDITOR: "PO_EDITOR",
  PO_DELETE_DIALOG: "PO_DELETE_DIALOG",
  DELIVERY_NOTE_EDITOR: "DELIVERY_NOTE_EDITOR",
  DELIVERY_NOTE_PRINT: "DELIVERY_NOTE_PRINT",
  PDF_EXPORT: "PDF_EXPORT",
  AUTH: "AUTH",
  RECYCLE_BIN: "RECYCLE_BIN",
  SYSTEM: "SYSTEM",
} as const;

export type AuditSource = (typeof AUDIT_SOURCE)[keyof typeof AUDIT_SOURCE];

/** Actor untuk event yang dihasilkan sistem tanpa user aktif. */
export const SYSTEM_ACTOR_NAME = "SYSTEM";

/** Label Bahasa Indonesia untuk action (tampilan UI). */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTION.CREATE]: "Dibuat",
  [AUDIT_ACTION.UPDATE]: "Diubah",
  [AUDIT_ACTION.DELETE]: "Dihapus",
  [AUDIT_ACTION.RESTORE]: "Dipulihkan",
  [AUDIT_ACTION.PERMANENT_DELETE]: "Dihapus Permanen",
  [AUDIT_ACTION.IMPORT]: "Import",
  [AUDIT_ACTION.REIMPORT]: "Import Ulang",
  [AUDIT_ACTION.PRINT]: "Cetak",
  [AUDIT_ACTION.REPRINT]: "Cetak Ulang",
  [AUDIT_ACTION.PRINT_STATUS_RESET]: "Reset Status Cetak",
  [AUDIT_ACTION.STATUS_CHANGE]: "Perubahan Status",
  [AUDIT_ACTION.PDF_EXPORT]: "Export PDF",
  [AUDIT_ACTION.LOGIN]: "Login",
  [AUDIT_ACTION.LOGOUT]: "Logout",
  [AUDIT_ACTION.PASSWORD_CHANGE]: "Ubah Password",
};

/** Label Bahasa Indonesia untuk entity type (tampilan UI). */
export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  [AUDIT_ENTITY_TYPE.PURCHASE_ORDER]: "Purchase Order",
  [AUDIT_ENTITY_TYPE.DELIVERY_NOTE]: "Surat Jalan",
  [AUDIT_ENTITY_TYPE.DELIVERY_NOTE_ITEM]: "Item Surat Jalan",
  [AUDIT_ENTITY_TYPE.IMPORT_JOB]: "Import",
  [AUDIT_ENTITY_TYPE.PRINT_AUDIT]: "Audit Cetak",
  [AUDIT_ENTITY_TYPE.USER_AUTH]: "Autentikasi",
  [AUDIT_ENTITY_TYPE.SYSTEM_SETTING]: "Pengaturan",
};

/** Label Bahasa Indonesia untuk source (tampilan UI). */
export const AUDIT_SOURCE_LABELS: Record<string, string> = {
  [AUDIT_SOURCE.PO_IMPORT]: "Import PO",
  [AUDIT_SOURCE.PO_EDITOR]: "Editor PO",
  [AUDIT_SOURCE.PO_DELETE_DIALOG]: "Dialog Hapus PO",
  [AUDIT_SOURCE.DELIVERY_NOTE_EDITOR]: "Editor Surat Jalan",
  [AUDIT_SOURCE.DELIVERY_NOTE_PRINT]: "Cetak Surat Jalan",
  [AUDIT_SOURCE.PDF_EXPORT]: "Export PDF",
  [AUDIT_SOURCE.AUTH]: "Autentikasi",
  [AUDIT_SOURCE.RECYCLE_BIN]: "Recycle Bin",
  [AUDIT_SOURCE.SYSTEM]: "Sistem",
};

import { z } from "zod";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "../constants";

export const auditHistorySearchSchema = z.object({
  q: z.string().optional().default("").catch(""),
  actor: z.string().optional().default("").catch(""),
  action: z.string().optional().default("").catch(""),
  entity: z.string().optional().default("").catch(""),
  from: z.string().optional().default("").catch(""),
  to: z.string().optional().default("").catch(""),
  page: z.coerce.number().int().min(1).default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).default(25).catch(25),
});

export type AuditHistorySearchParams = z.infer<
  typeof auditHistorySearchSchema
>;

export const AUDIT_ACTION_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "Semua Aksi" },
  { value: AUDIT_ACTION.CREATE, label: "Dibuat" },
  { value: AUDIT_ACTION.UPDATE, label: "Diubah" },
  { value: AUDIT_ACTION.DELETE, label: "Dihapus" },
  { value: AUDIT_ACTION.RESTORE, label: "Dipulihkan" },
  { value: AUDIT_ACTION.PERMANENT_DELETE, label: "Dihapus Permanen" },
  { value: AUDIT_ACTION.IMPORT, label: "Import" },
  { value: AUDIT_ACTION.REIMPORT, label: "Import Ulang" },
  { value: AUDIT_ACTION.PRINT, label: "Cetak" },
  { value: AUDIT_ACTION.REPRINT, label: "Cetak Ulang" },
  { value: AUDIT_ACTION.PRINT_STATUS_RESET, label: "Reset Status Cetak" },
  { value: AUDIT_ACTION.STATUS_CHANGE, label: "Perubahan Status" },
  { value: AUDIT_ACTION.LOGIN, label: "Login" },
  { value: AUDIT_ACTION.LOGOUT, label: "Logout" },
  { value: AUDIT_ACTION.PASSWORD_CHANGE, label: "Ubah Password" },
];

export const AUDIT_ENTITY_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "Semua Jenis Data" },
  { value: AUDIT_ENTITY_TYPE.PURCHASE_ORDER, label: "Purchase Order" },
  { value: AUDIT_ENTITY_TYPE.DELIVERY_NOTE, label: "Surat Jalan" },
  { value: AUDIT_ENTITY_TYPE.DELIVERY_NOTE_ITEM, label: "Item Surat Jalan" },
  { value: AUDIT_ENTITY_TYPE.IMPORT_JOB, label: "Import" },
  { value: AUDIT_ENTITY_TYPE.PRINT_AUDIT, label: "Audit Cetak" },
  { value: AUDIT_ENTITY_TYPE.USER_AUTH, label: "Autentikasi" },
];

export const AUDIT_SOURCE_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "", label: "Semua Sumber" },
  { value: AUDIT_SOURCE.PO_IMPORT, label: "Import PO" },
  { value: AUDIT_SOURCE.PO_EDITOR, label: "Editor PO" },
  { value: AUDIT_SOURCE.PO_DELETE_DIALOG, label: "Dialog Hapus PO" },
  { value: AUDIT_SOURCE.DELIVERY_NOTE_EDITOR, label: "Editor Surat Jalan" },
  { value: AUDIT_SOURCE.DELIVERY_NOTE_PRINT, label: "Cetak Surat Jalan" },
  { value: AUDIT_SOURCE.AUTH, label: "Autentikasi" },
  { value: AUDIT_SOURCE.SYSTEM, label: "Sistem" },
];

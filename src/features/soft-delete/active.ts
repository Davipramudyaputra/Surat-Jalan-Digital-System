import "server-only";

/**
 * Filter "active-only" untuk PurchaseOrder dan DeliveryNote.
 *
 * Data yang soft-deleted (deletedAt != null) harus dikecualikan dari seluruh
 * query operasional aktif. Gunakan helper ini agar filter konsisten di seluruh
 * tempat dan tidak terlupa.
 */

export const ACTIVE_PO_FILTER = { deletedAt: null } as const;
export const ACTIVE_DN_FILTER = { deletedAt: null } as const;

/** Jumlah hari maksimal sebuah record boleh berada di Recycle Bin (retention). */
export const RECYCLE_BIN_RETENTION_DAYS = 30;

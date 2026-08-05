import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import type { AuditActor } from "@/features/audit/services/audit-service";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { prisma } from "@/lib/prisma";

type DbClient = Pick<
  PrismaClient,
  "purchaseOrder" | "deliveryNote" | "deliveryNoteItem" | "auditEvent"
>;

export type ConflictResult = {
  conflict: boolean;
  reasons: string[];
};

/** Periksa apakah ada data aktif dengan identitas yang sama yang memblokir restore. */
export async function detectRestorePOConflict(
  db: DbClient,
  po: { companyCode: string; normalizedPoNumber: string; id: string },
): Promise<ConflictResult> {
  const reasons: string[] = [];
  const activePo = await db.purchaseOrder.findFirst({
    where: {
      companyCode: po.companyCode,
      normalizedPoNumber: po.normalizedPoNumber,
      deletedAt: null,
      id: { not: po.id },
    },
    select: { id: true, poNumber: true },
  });
  if (activePo) {
    reasons.push(
      `Purchase Order aktif dengan nomor yang sama sudah ada: ${activePo.poNumber}.`,
    );
  }
  return { conflict: reasons.length > 0, reasons };
}

/** Restore Purchase Order beserta seluruh child yang satu trash batch. */
export async function restorePurchaseOrder(
  poId: string,
  actor: AuditActor,
): Promise<{ success: true; restoredDeliveryNotes: number; restoredItems: number } | { error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId, deletedAt: { not: null } },
        include: {
          deliveryNotes: {
            where: { deletedAt: { not: null } },
            include: { _count: { select: { items: true } } },
          },
        },
      });

      if (!po) {
        return { error: "Purchase Order tidak ditemukan di Recycle Bin." } as const;
      }

      const conflict = await detectRestorePOConflict(tx, po);
      if (conflict.conflict) {
        return {
          error: conflict.reasons.join(" "),
        } as const;
      }

      const trashBatchId = po.trashBatchId;
      const restoredDeliveryNotes = po.deliveryNotes.length;
      const restoredItems = po.deliveryNotes.reduce(
        (acc, dn) => acc + dn._count.items,
        0,
      );

      // Restore child terlebih dahulu.
      await tx.deliveryNote.updateMany({
        where: { purchaseOrderId: poId, trashBatchId, deletedAt: { not: null } },
        data: { deletedAt: null, deletedById: null },
      });

      // Restore PO.
      const updated = await tx.purchaseOrder.updateMany({
        where: { id: poId, trashBatchId, deletedAt: { not: null } },
        data: { deletedAt: null, deletedById: null },
      });
      if (updated.count !== 1) {
        return { error: "Data telah berubah. Muat ulang halaman." } as const;
      }

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
            id: poId,
            label: po.poNumber,
          },
          action: AUDIT_ACTION.RESTORE,
          source: AUDIT_SOURCE.RECYCLE_BIN,
          after: {
            poNumber: po.poNumber,
            companyCode: po.companyCode,
            companyName: po.companyName,
            period: po.period,
          },
          metadata: {
            restoredDeliveryNotes,
            restoredItems,
            trashBatchId,
          },
          batchId: trashBatchId ?? undefined,
        },
        tx,
      );

      return { success: true, restoredDeliveryNotes, restoredItems };
    });
  } catch {
    return { error: "Terjadi kesalahan sistem saat memulihkan Purchase Order." };
  }
}

/** Restore satu Surat Jalan. Parent PO harus aktif. */
export async function restoreDeliveryNote(
  dnId: string,
  actor: AuditActor,
): Promise<{ success: true; restoredItems: number } | { error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const dn = await tx.deliveryNote.findFirst({
        where: { id: dnId, deletedAt: { not: null } },
        include: {
          purchaseOrder: { select: { id: true, deletedAt: true, poNumber: true } },
          _count: { select: { items: true } },
        },
      });

      if (!dn) {
        return { error: "Surat Jalan tidak ditemukan di Recycle Bin." } as const;
      }

      if (dn.purchaseOrder.deletedAt !== null) {
        return {
          error:
            "Surat Jalan tidak dapat dipulihkan secara terpisah. Pulihkan Purchase Order terlebih dahulu.",
        } as const;
      }

      const updated = await tx.deliveryNote.updateMany({
        where: { id: dnId, deletedAt: { not: null } },
        data: { deletedAt: null, deletedById: null },
      });
      if (updated.count !== 1) {
        return { error: "Data telah berubah. Muat ulang halaman." } as const;
      }

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
            id: dnId,
            label: dn.branchName || dn.uniqueCode,
          },
          action: AUDIT_ACTION.RESTORE,
          source: AUDIT_SOURCE.RECYCLE_BIN,
          after: {
            branchName: dn.branchName,
            poNumber: dn.purchaseOrder.poNumber,
          },
          metadata: {
            restoredItems: dn._count.items,
            purchaseOrderId: dn.purchaseOrder.id,
          },
        },
        tx,
      );

      return { success: true, restoredItems: dn._count.items };
    });
  } catch {
    return { error: "Terjadi kesalahan sistem saat memulihkan Surat Jalan." };
  }
}

/** Soft delete satu Surat Jalan. Parent PO harus aktif. */
export async function softDeleteDeliveryNote(
  dnId: string,
  actor: AuditActor,
  reason: string | null,
): Promise<{ success: true } | { error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const dn = await tx.deliveryNote.findFirst({
        where: { id: dnId, deletedAt: null },
        include: {
          purchaseOrder: { select: { id: true, deletedAt: true, poNumber: true } },
          _count: { select: { items: true } },
        },
      });

      if (!dn) {
        return { error: "Surat Jalan tidak ditemukan." } as const;
      }

      if (dn.purchaseOrder.deletedAt !== null) {
        return {
          error: "Surat Jalan milik Purchase Order yang sudah dihapus tidak dapat dihapus terpisah.",
        } as const;
      }

      const trashBatchId = crypto.randomUUID();
      const updated = await tx.deliveryNote.updateMany({
        where: { id: dnId, deletedAt: null },
        data: { deletedAt: new Date(), deletedById: actor.id, deletionReason: reason, trashBatchId },
      });
      if (updated.count !== 1) {
        return { error: "Data telah berubah. Muat ulang halaman." } as const;
      }

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
            id: dnId,
            label: dn.branchName || dn.uniqueCode,
          },
          action: AUDIT_ACTION.DELETE,
          source: AUDIT_SOURCE.RECYCLE_BIN,
          before: {
            branchName: dn.branchName,
            uniqueCode: dn.uniqueCode,
            poNumber: dn.purchaseOrder.poNumber,
            printStatus: dn.printStatus,
          },
          metadata: {
            itemCount: dn._count.items,
            purchaseOrderId: dn.purchaseOrder.id,
            trashBatchId,
            deletionReason: reason,
          },
          batchId: trashBatchId,
        },
        tx,
      );

      return { success: true };
    });
  } catch {
    return { error: "Terjadi kesalahan sistem saat menghapus Surat Jalan." };
  }
}

/** Permanent delete PO (child-to-parent) — hanya dari Recycle Bin. */
export async function permanentlyDeletePurchaseOrder(
  poId: string,
  actor: AuditActor,
): Promise<{ success: true } | { error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId, deletedAt: { not: null } },
      });
      if (!po) {
        return { error: "Purchase Order tidak ditemukan di Recycle Bin." } as const;
      }

      const deliveryNoteCount = await tx.deliveryNote.count({
        where: { purchaseOrderId: poId },
      });
      const itemCount = await tx.deliveryNoteItem.count({
        where: { deliveryNote: { purchaseOrderId: poId } },
      });

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
            id: poId,
            label: po.poNumber,
          },
          action: AUDIT_ACTION.PERMANENT_DELETE,
          source: AUDIT_SOURCE.RECYCLE_BIN,
          before: {
            poNumber: po.poNumber,
            companyCode: po.companyCode,
            companyName: po.companyName,
            period: po.period,
          },
          metadata: {
            deliveryNoteCount,
            itemCount,
            trashBatchId: po.trashBatchId,
            deletionReason: po.deletionReason,
          },
          batchId: po.trashBatchId ?? undefined,
        },
        tx,
      );

      // Hapus fisik child-to-parent.
      await tx.deliveryNoteItem.deleteMany({
        where: { deliveryNote: { purchaseOrderId: poId } },
      });
      await tx.deliveryNote.deleteMany({ where: { purchaseOrderId: poId } });
      await tx.purchaseOrder.delete({ where: { id: poId } });

      return { success: true };
    });
  } catch {
    return { error: "Terjadi kesalahan sistem saat menghapus permanen Purchase Order." };
  }
}

/** Permanent delete Surat Jalan — hanya dari Recycle Bin dan parent aktif. */
export async function permanentlyDeleteDeliveryNote(
  dnId: string,
  actor: AuditActor,
): Promise<{ success: true } | { error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const dn = await tx.deliveryNote.findFirst({
        where: { id: dnId, deletedAt: { not: null } },
        include: { purchaseOrder: { select: { id: true, deletedAt: true } } },
      });
      if (!dn) {
        return { error: "Surat Jalan tidak ditemukan di Recycle Bin." } as const;
      }

      if (dn.purchaseOrder.deletedAt !== null) {
        return {
          error:
            "Surat Jalan bagian dari Purchase Order yang dihapus. Hapus permanen melalui Purchase Order.",
        } as const;
      }

      const itemCount = await tx.deliveryNoteItem.count({
        where: { deliveryNoteId: dnId },
      });

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
            id: dnId,
            label: dn.branchName || dn.uniqueCode,
          },
          action: AUDIT_ACTION.PERMANENT_DELETE,
          source: AUDIT_SOURCE.RECYCLE_BIN,
          before: {
            branchName: dn.branchName,
            uniqueCode: dn.uniqueCode,
          },
          metadata: {
            itemCount,
            trashBatchId: dn.trashBatchId,
          },
          batchId: dn.trashBatchId ?? undefined,
        },
        tx,
      );

      await tx.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: dnId } });
      await tx.deliveryNote.delete({ where: { id: dnId } });

      return { success: true };
    });
  } catch {
    return { error: "Terjadi kesalahan sistem saat menghapus permanen Surat Jalan." };
  }
}

export type { DbClient };

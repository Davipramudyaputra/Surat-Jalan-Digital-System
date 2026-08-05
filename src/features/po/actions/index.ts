"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizePoNumber } from "@/features/imports/normalization/normalize-po-number";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import { actorFromSession } from "@/features/audit/lib/actor";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { ACTIVE_PO_FILTER } from "@/features/soft-delete/active";
import { editPurchaseOrderSchema } from "../schemas";

type ActionState = { error: string };

class ConcurrencyError extends Error {}

export async function editPurchaseOrderAction(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const actor = actorFromSession(session);

  const parsed = editPurchaseOrderSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    return { error: "Data form tidak valid. Periksa kembali seluruh field." };
  }

  const {
    poNumber,
    companyCode,
    companyName,
    period,
    expectedUpdatedAt,
  } = parsed.data;
  const normalizedPoNumber = normalizePoNumber(poNumber);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingPo = await tx.purchaseOrder.findFirst({
        where: { id, ...ACTIVE_PO_FILTER },
      });

      if (!existingPo) {
        return { error: "Purchase Order tidak ditemukan.", changed: false };
      }

      if (existingPo.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConcurrencyError();
      }

      const changed =
        existingPo.poNumber !== poNumber ||
        existingPo.normalizedPoNumber !== normalizedPoNumber ||
        existingPo.companyCode !== companyCode ||
        existingPo.companyName !== companyName ||
        existingPo.period !== period;

      if (!changed) {
        return { error: "", changed: false };
      }

      const duplicate = await tx.purchaseOrder.findFirst({
        where: {
          companyCode,
          normalizedPoNumber,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (duplicate && duplicate.id !== id) {
        return {
          error: "Purchase Order dengan nomor dan kode perusahaan tersebut sudah ada.",
          changed: false,
        };
      }

      const updated = await tx.purchaseOrder.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: {
          poNumber,
          normalizedPoNumber,
          companyCode,
          companyName,
          period,
        },
      });

      if (updated.count !== 1) {
        throw new ConcurrencyError();
      }

      await tx.deliveryNote.updateMany({
        where: { purchaseOrderId: id },
        data: {
          ...(existingPo.companyName !== companyName
            ? { recipientCompanyName: companyName }
            : {}),
          printStatus: "NOT_PRINTED",
        },
      });

      const afterSnapshot = {
        poNumber,
        normalizedPoNumber,
        companyCode,
        companyName,
        period,
      };
      const beforeSnapshot = {
        poNumber: existingPo.poNumber,
        normalizedPoNumber: existingPo.normalizedPoNumber,
        companyCode: existingPo.companyCode,
        companyName: existingPo.companyName,
        period: existingPo.period,
      };

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
            id,
            label: poNumber,
          },
          action: AUDIT_ACTION.UPDATE,
          source: AUDIT_SOURCE.PO_EDITOR,
          before: beforeSnapshot,
          after: afterSnapshot,
        },
        tx,
      );

      return { error: "", changed: true };
    });

    if (result.error) {
      return { error: result.error };
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        error:
          "Data PO sudah diperbarui dari sesi lain. Muat ulang halaman sebelum menyimpan kembali.",
      };
    }
    console.error("Pembaruan PO gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan sistem saat memperbarui Purchase Order." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath(`/po/${id}`);
  redirect(`/po/${id}`);
}

export async function deletePurchaseOrderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const actor = actorFromSession(session);

  const id = formData.get("id");
  const confirmationPoNumber = formData.get("confirmationPoNumber");
  const expectedUpdatedAtValue = formData.get("expectedUpdatedAt");
  const acknowledgment = formData.get("acknowledgment") === "true";

  if (
    typeof id !== "string" ||
    typeof confirmationPoNumber !== "string" ||
    typeof expectedUpdatedAtValue !== "string"
  ) {
    return { error: "Data konfirmasi penghapusan tidak valid." };
  }

  const expectedUpdatedAt = new Date(expectedUpdatedAtValue);
  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    return { error: "Snapshot data PO tidak valid. Muat ulang halaman." };
  }

  if (!acknowledgment) {
    return { error: "Persetujuan penghapusan wajib dicentang." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id, deletedAt: null },
      });

      if (!po) {
        throw new Error("NOT_FOUND");
      }

      if (po.poNumber !== confirmationPoNumber) {
        throw new Error("CONFIRMATION_MISMATCH");
      }

      if (po.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConcurrencyError();
      }

      const deliveryNoteCount = await tx.deliveryNote.count({
        where: { purchaseOrderId: id },
      });
      const itemCount = await tx.deliveryNoteItem.count({
        where: { deliveryNote: { purchaseOrderId: id } },
      });

      const trashBatchId = crypto.randomUUID();
      const now = new Date();
      const deletionReason = typeof formData.get("deletionReason") === "string"
        ? (formData.get("deletionReason") as string).trim() || null
        : null;

      // Tandai seluruh Surat Jalan terkait terhapus (soft delete child).
      await tx.deliveryNote.updateMany({
        where: { purchaseOrderId: id, deletedAt: null },
        data: { deletedAt: now, deletedById: actor.id, deletionReason, trashBatchId },
      });

      // Tandai PO terhapus (soft delete parent).
      const updated = await tx.purchaseOrder.updateMany({
        where: { id, updatedAt: expectedUpdatedAt, deletedAt: null },
        data: { deletedAt: now, deletedById: actor.id, deletionReason, trashBatchId },
      });
      if (updated.count !== 1) {
        throw new ConcurrencyError();
      }

      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
            id,
            label: po.poNumber,
          },
          action: AUDIT_ACTION.DELETE,
          source: AUDIT_SOURCE.PO_DELETE_DIALOG,
          before: {
            poNumber: po.poNumber,
            companyCode: po.companyCode,
            companyName: po.companyName,
            period: po.period,
          },
          metadata: {
            deliveryNoteCount,
            itemCount,
            relatedCounts: { deliveryNoteCount, itemCount },
            trashBatchId,
            deletionReason,
          },
          batchId: trashBatchId,
        },
        tx,
      );
    });
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        error:
          "Data PO sudah berubah. Muat ulang halaman dan periksa ringkasan sebelum menghapus.",
      };
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "Purchase Order tidak ditemukan." };
    }
    if (error instanceof Error && error.message === "CONFIRMATION_MISMATCH") {
      return { error: "Nomor PO konfirmasi harus sama persis." };
    }
    console.error("Penghapusan PO gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan sistem saat menghapus Purchase Order." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  redirect("/po");
}

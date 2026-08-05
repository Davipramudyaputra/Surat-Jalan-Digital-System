import { Prisma } from "@/generated/prisma/client";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import type { AuditActor } from "@/features/audit/services/audit-service";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { normalizeLookupKey } from "@/features/imports/normalization/normalize-key";
import { normalizePoNumber } from "@/features/imports/normalization/normalize-po-number";
import { prisma } from "@/lib/prisma";
import { ACTIVE_DN_FILTER } from "@/features/soft-delete/active";
import { type DeliveryNoteEditInput, deliveryNoteEditSchema } from "../schemas";

class DeliveryNoteConcurrencyError extends Error {}

function optionalText(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function documentDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateKey(value: Date | null): string {
  return value?.toISOString().slice(0, 10) ?? "";
}

export async function updateDeliveryNote(
  data: DeliveryNoteEditInput,
  actor: AuditActor,
) {
  const result = deliveryNoteEditSchema.safeParse(data);
  if (!result.success) {
    return { error: "Data tidak valid", details: result.error.flatten() };
  }

  const { id, items, updatedAt, ...updates } = result.data;

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.deliveryNote.findFirst({
        where: { id, ...ACTIVE_DN_FILTER },
        include: { purchaseOrder: true, items: true },
      });

      if (!current) {
        return { error: "Surat jalan tidak ditemukan" };
      }

      if (current.updatedAt.getTime() !== updatedAt.getTime()) {
        throw new DeliveryNoteConcurrencyError();
      }

      if (
        current.purchaseOrder.normalizedPoNumber !==
        normalizePoNumber(updates.poNumber)
      ) {
        return {
          error:
            "Nomor PO hanya dapat diubah melalui halaman Edit PO agar seluruh surat jalan tetap konsisten.",
        };
      }

      const branchName = updates.branchName.trim();
      const duplicateBranch = await tx.deliveryNote.findFirst({
        where: {
          id: { not: id },
          purchaseOrderId: current.purchaseOrderId,
          branchName: { equals: branchName, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicateBranch) {
        return { error: "Nama cabang sudah ada di Purchase Order ini." };
      }

      const submittedItemIds = items
        .map((item) => item.id)
        .filter((itemId): itemId is string => Boolean(itemId));
      if (new Set(submittedItemIds).size !== submittedItemIds.length) {
        return { error: "Payload barang mengandung ID duplikat." };
      }

      const currentItemIds = new Set(current.items.map((item) => item.id));
      if (submittedItemIds.some((itemId) => !currentItemIds.has(itemId))) {
        return {
          error:
            "Salah satu barang bukan milik surat jalan ini. Muat ulang halaman sebelum menyimpan.",
        };
      }

      const normalizedDisplayNames = new Set<string>();
      for (const item of items) {
        const normalized = normalizeLookupKey(item.displayProductName);
        if (normalizedDisplayNames.has(normalized)) {
          return {
            error: `Barang dengan nama yang sama sudah tersedia: ${item.displayProductName}`,
          };
        }
        normalizedDisplayNames.add(normalized);
      }

      const nextDocumentDate = documentDate(updates.documentDate);
      const nextDocumentNumber = optionalText(updates.documentNumber);
      const nextRecipientCompanyName = updates.recipientCompanyName.trim();
      const nextRecipientName = optionalText(updates.recipientName);
      const nextVehicleName = optionalText(updates.vehicleName);
      const nextVehicleNumber = optionalText(updates.vehicleNumber);
      const nextAdditionalPoNumber = optionalText(updates.additionalPoNumber);

      const documentChanged =
        current.documentNumber !== nextDocumentNumber ||
        dateKey(current.documentDate) !== dateKey(nextDocumentDate) ||
        current.recipientCompanyName !== nextRecipientCompanyName ||
        current.branchName !== branchName ||
        current.recipientName !== nextRecipientName ||
        current.vehicleName !== nextVehicleName ||
        current.vehicleNumber !== nextVehicleNumber ||
        current.additionalPoNumber !== nextAdditionalPoNumber;

      let itemsChanged = items.length !== current.items.length;
      if (!itemsChanged) {
        for (const item of items) {
          const existing = item.id
            ? current.items.find((candidate) => candidate.id === item.id)
            : undefined;
          if (
            !existing ||
            !existing.quantity.equals(new Prisma.Decimal(item.quantity)) ||
            existing.unit !== optionalText(item.unit) ||
            existing.displayProductName !== item.displayProductName.trim() ||
            existing.description !== optionalText(item.description) ||
            existing.sortOrder !== item.sortOrder
          ) {
            itemsChanged = true;
            break;
          }
        }
      }

      if (!documentChanged && !itemsChanged) {
        return { success: true, purchaseOrderId: current.purchaseOrderId };
      }

      await tx.deliveryNoteItem.deleteMany({
        where: {
          deliveryNoteId: id,
          id: { notIn: submittedItemIds },
        },
      });

      const keptIdentityKeys = new Set(
        current.items
          .filter((item) => submittedItemIds.includes(item.id))
          .map((item) => item.normalizedProductName),
      );

      const itemMutations: Prisma.PrismaPromise<unknown>[] = [];
      for (const item of items) {
        const displayProductName = item.displayProductName.trim();
        const quantity = new Prisma.Decimal(item.quantity);
        const unit = optionalText(item.unit);
        const description = optionalText(item.description);

        if (item.id) {
          const existing = current.items.find(
            (candidate) => candidate.id === item.id,
          );
          if (!existing) {
            return { error: "Barang surat jalan tidak ditemukan." };
          }

          const changed =
            !existing.quantity.equals(quantity) ||
            existing.unit !== unit ||
            existing.displayProductName !== displayProductName ||
            existing.description !== description ||
            existing.sortOrder !== item.sortOrder;

          if (changed) {
            itemMutations.push(
              tx.deliveryNoteItem.updateMany({
                where: { id: item.id, deliveryNoteId: id },
                data: {
                  quantity,
                  unit,
                  displayProductName,
                  description,
                  sortOrder: item.sortOrder,
                  isManuallyEdited: true,
                },
              }),
            );
          }
        } else {
          const baseIdentity = normalizeLookupKey(displayProductName);
          const normalizedProductName = keptIdentityKeys.has(baseIdentity)
            ? `${baseIdentity}#manual-${crypto.randomUUID()}`
            : baseIdentity;
          keptIdentityKeys.add(normalizedProductName);
          itemMutations.push(
            tx.deliveryNoteItem.create({
              data: {
                deliveryNoteId: id,
                originalProductName: displayProductName,
                displayProductName,
                normalizedProductName,
                sourceQuantity: quantity,
                quantity,
                unit,
                description,
                sortOrder: item.sortOrder,
                isManuallyEdited: true,
              },
            }),
          );
        }
      }

      await Promise.all(itemMutations);

      const updated = await tx.deliveryNote.updateMany({
        where: { id, updatedAt },
        data: {
          documentNumber: nextDocumentNumber,
          documentDate: nextDocumentDate,
          recipientCompanyName: nextRecipientCompanyName,
          branchName,
          recipientName: nextRecipientName,
          vehicleName: nextVehicleName,
          vehicleNumber: nextVehicleNumber,
          additionalPoNumber: nextAdditionalPoNumber,
          printStatus:
            current.printStatus === "PRINTED" ? "NOT_PRINTED" : current.printStatus,
        },
      });

      if (updated.count !== 1) {
        throw new DeliveryNoteConcurrencyError();
      }

      // ==== Audit ====
      const documentBefore = {
        documentNumber: current.documentNumber,
        documentDate: current.documentDate
          ? current.documentDate.toISOString().slice(0, 10)
          : null,
        recipientCompanyName: current.recipientCompanyName,
        branchName: current.branchName,
        recipientName: current.recipientName,
        vehicleName: current.vehicleName,
        vehicleNumber: current.vehicleNumber,
        additionalPoNumber: current.additionalPoNumber,
      };
      const documentAfter = {
        documentNumber: nextDocumentNumber,
        documentDate: nextDocumentDate
          ? nextDocumentDate.toISOString().slice(0, 10)
          : null,
        recipientCompanyName: nextRecipientCompanyName,
        branchName,
        recipientName: nextRecipientName,
        vehicleName: nextVehicleName,
        vehicleNumber: nextVehicleNumber,
        additionalPoNumber: nextAdditionalPoNumber,
      };

      const entityLabel = current.branchName || current.uniqueCode;

      if (documentChanged || itemsChanged) {
        await recordAuditEvent(
          {
            actor,
            entity: {
              type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
              id,
              label: entityLabel,
            },
            action: AUDIT_ACTION.UPDATE,
            source: AUDIT_SOURCE.DELIVERY_NOTE_EDITOR,
            before: documentChanged ? documentBefore : null,
            after: documentChanged ? documentAfter : null,
            metadata: {
              purchaseOrderId: current.purchaseOrderId,
              poNumber: current.purchaseOrder.normalizedPoNumber,
              itemsChanged,
              documentChanged,
            },
            batchId: id,
          },
          tx,
        );
      }

      if (current.printStatus === "PRINTED") {
        await recordAuditEvent(
          {
            actor,
            entity: {
              type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
              id,
              label: entityLabel,
            },
            action: AUDIT_ACTION.PRINT_STATUS_RESET,
            source: AUDIT_SOURCE.DELIVERY_NOTE_EDITOR,
            before: {
              printStatus: current.printStatus,
              printCount: current.printCount,
            },
            after: {
              printStatus: "NOT_PRINTED",
              printCount: current.printCount,
            },
            metadata: {
              previousStatus: current.printStatus,
              newStatus: "NOT_PRINTED",
              editedFields: Object.entries(documentAfter)
                .filter(([key, value]) => {
                  const beforeValue =
                    documentBefore[key as keyof typeof documentBefore];
                  return JSON.stringify(value) !== JSON.stringify(beforeValue);
                })
                .map(([key]) => key),
              previousPrintCount: current.printCount,
            },
            batchId: id,
          },
          tx,
        );
      }

      return { success: true, purchaseOrderId: current.purchaseOrderId };
    }, { timeout: 10_000 });
  } catch (error: unknown) {
    if (error instanceof DeliveryNoteConcurrencyError) {
      return {
        error:
          "Data ini sudah diperbarui dari sesi lain. Muat ulang halaman sebelum menyimpan kembali.",
      };
    }
    console.error("Pembaruan surat jalan gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan sistem saat menyimpan data." };
  }
}

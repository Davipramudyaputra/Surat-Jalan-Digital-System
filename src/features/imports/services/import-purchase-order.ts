import "server-only";

import { Prisma, PrintStatus } from "@/generated/prisma/client";
import { createStableDeliveryNoteCode } from "@/features/imports/services/create-delivery-note-code";
import type {
  ImportIssue,
  ParsedDeliveryNote,
  ParsedImport,
  ImportResultStatus,
} from "@/features/imports/types/import-types";
import { prisma } from "@/lib/prisma";

type ImportPurchaseOrderInput = {
  fileHash: string;
  parsed: ParsedImport;
  uploadId: string;
  importStatus: ImportResultStatus;
};

type ImportPurchaseOrderResult = {
  deliveryNotes: number;
  duplicate: boolean;
  items: number;
  purchaseOrders: number;
  warnings: ImportIssue[];
  databaseChanges: {
    purchaseOrdersCreated: number;
    purchaseOrdersUpdated: number;
    deliveryNotesCreated: number;
    deliveryNotesUpdated: number;
    itemsCreated: number;
    itemsUpdated: number;
  };
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function hasItemChanges(
  existingItems: Array<{
    displayProductName: string;
    normalizedProductName: string;
    originalProductName: string;
    quantity: Prisma.Decimal;
    sortOrder: number;
    sourceQuantity: Prisma.Decimal;
    isManuallyEdited: boolean;
  }>,
  parsedDeliveryNote: ParsedDeliveryNote,
): boolean {
  const existingByName = new Map(
    existingItems
      .filter((item) => !item.normalizedProductName.includes("#manual-"))
      .map((item) => [item.normalizedProductName, item]),
  );

  const importedNames = new Set(
    parsedDeliveryNote.items.map((item) => item.normalizedProductName),
  );

  const importedOutputChanged = parsedDeliveryNote.items.some((item) => {
    const existing = existingByName.get(item.normalizedProductName);

    if (existing?.isManuallyEdited) {
      return false;
    }

    return (
      !existing ||
      existing.originalProductName !== item.originalProductName ||
      existing.displayProductName !== item.displayProductName ||
      existing.sourceQuantity.toString() !== item.quantity ||
      existing.quantity.toString() !== item.quantity ||
      existing.sortOrder !== item.sortOrder
    );
  });

  const removedOutputItem = [...existingByName.values()].some(
    (item) =>
      !item.isManuallyEdited && !importedNames.has(item.normalizedProductName),
  );

  return importedOutputChanged || removedOutputItem;
}

export async function importPurchaseOrder(
  input: ImportPurchaseOrderInput,
): Promise<ImportPurchaseOrderResult> {
  return prisma.$transaction(
    async (transaction) => {
      // Validasi duplikat concurrent. Gunakan explicit check terhadap PO aktif
      // yang mungkin saja baru saja terbuat pada transaction lain.
      const existingPurchaseOrder = await transaction.purchaseOrder.findUnique({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode: input.parsed.companyCode,
            normalizedPoNumber: input.parsed.normalizedPoNumber,
          },
        },
        include: {
          deliveryNotes: {
            include: { items: true },
          },
        },
      });

      // Jika kita menganggap ini REIMPORT_AFTER_DELETE atau NEW_FILE,
      // tapi tiba-tiba PO nya ada, berarti race condition, batalkan import.
      if (
        existingPurchaseOrder &&
        (input.importStatus === "REIMPORT_AFTER_DELETE" || input.importStatus === "NEW_FILE")
      ) {
        // Karena ada perbedaan state sebelum transaction dan saat transaction,
        // kita batalkan.
        await transaction.upload.update({
          where: { id: input.uploadId },
          data: {
            importStatus: "DUPLICATE",
            purchaseOrderCount: 1,
            deliveryNoteCount: existingPurchaseOrder.deliveryNotes.length,
            itemCount: existingPurchaseOrder.deliveryNotes.reduce((acc, dn) => acc + dn.items.length, 0),
            warnings: toJsonValue([
              {
                code: "DUPLICATE_FILE",
                message: "File dan data PO yang sama baru saja terdeteksi masih tersedia.",
              },
            ]),
          },
        });

        return {
          deliveryNotes: existingPurchaseOrder.deliveryNotes.length,
          duplicate: true,
          items: existingPurchaseOrder.deliveryNotes.reduce((acc, dn) => acc + dn.items.length, 0),
          purchaseOrders: 1,
          warnings: [
            {
              code: "DUPLICATE_FILE",
              message: "File dan data PO yang sama baru saja terdeteksi masih tersedia.",
            },
          ],
          databaseChanges: {
            purchaseOrdersCreated: 0,
            purchaseOrdersUpdated: 0,
            deliveryNotesCreated: 0,
            deliveryNotesUpdated: 0,
            itemsCreated: 0,
            itemsUpdated: 0,
          },
        };
      }

      const isNewPO = !existingPurchaseOrder;

      const purchaseOrder = await transaction.purchaseOrder.upsert({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode: input.parsed.companyCode,
            normalizedPoNumber: input.parsed.normalizedPoNumber,
          },
        },
        create: {
          companyCode: input.parsed.companyCode,
          companyName: input.parsed.companyName,
          lastSourceUploadId: input.uploadId,
          normalizedPoNumber: input.parsed.normalizedPoNumber,
          period: input.parsed.period,
          poNumber: input.parsed.poNumber,
        },
        update: {
          lastSourceUploadId: input.uploadId,
        },
      });

      const existingNotesByBranch = new Map(
        (existingPurchaseOrder?.deliveryNotes ?? []).map((deliveryNote) => [
          deliveryNote.normalizedBranchName,
          deliveryNote,
        ]),
      );
      const importedBranches = new Set(
        input.parsed.deliveryNotes.map(
          (deliveryNote) => deliveryNote.normalizedBranchName,
        ),
      );
      const reimportWarnings: ImportIssue[] = [];

      let deliveryNotesCreated = 0;
      let deliveryNotesUpdated = 0;
      let itemsCreated = 0;
      let itemsUpdated = 0;

      for (const parsedDeliveryNote of input.parsed.deliveryNotes) {
        const existingDeliveryNote = existingNotesByBranch.get(
          parsedDeliveryNote.normalizedBranchName,
        );
        const branchWasManuallyEdited =
          existingDeliveryNote !== undefined &&
          existingDeliveryNote.branchName !==
            existingDeliveryNote.originalBranchName;
        const recipientWasManuallyEdited =
          existingDeliveryNote !== undefined &&
          existingPurchaseOrder !== null &&
          existingDeliveryNote.recipientCompanyName !==
            existingPurchaseOrder.companyName;
        const noteFieldsChanged =
          existingDeliveryNote !== undefined &&
          ((!branchWasManuallyEdited &&
            existingDeliveryNote.branchName !== parsedDeliveryNote.branchName) ||
            (!recipientWasManuallyEdited &&
              existingDeliveryNote.recipientCompanyName !==
                purchaseOrder.companyName));
        const itemsChanged =
          existingDeliveryNote !== undefined &&
          hasItemChanges(existingDeliveryNote.items, parsedDeliveryNote);
        const contentChanged = noteFieldsChanged || itemsChanged;

        if (!existingDeliveryNote) {
          deliveryNotesCreated++;
        } else if (contentChanged) {
          deliveryNotesUpdated++;
        }

        const deliveryNote = await transaction.deliveryNote.upsert({
          where: {
            purchaseOrderId_normalizedBranchName: {
              normalizedBranchName: parsedDeliveryNote.normalizedBranchName,
              purchaseOrderId: purchaseOrder.id,
            },
          },
          create: {
            branchName: parsedDeliveryNote.branchName,
            normalizedBranchName: parsedDeliveryNote.normalizedBranchName,
            originalBranchName: parsedDeliveryNote.originalBranchName,
            purchaseOrderId: purchaseOrder.id,
            recipientCompanyName: purchaseOrder.companyName,
            uniqueCode: createStableDeliveryNoteCode({
              companyCode: input.parsed.companyCode,
              normalizedBranchName:
                parsedDeliveryNote.normalizedBranchName,
              normalizedPoNumber: input.parsed.normalizedPoNumber,
            }),
          },
          update: {
            branchName: branchWasManuallyEdited
              ? undefined
              : parsedDeliveryNote.branchName,
            normalizedBranchName: parsedDeliveryNote.normalizedBranchName,
            originalBranchName: parsedDeliveryNote.originalBranchName,
            printStatus: contentChanged
              ? PrintStatus.NOT_PRINTED
              : undefined,
            recipientCompanyName: recipientWasManuallyEdited
              ? undefined
              : purchaseOrder.companyName,
          },
        });

        const importedProducts = parsedDeliveryNote.items.map(
          (item) => item.normalizedProductName,
        );

        const existingItemsMap = new Map(
          (existingDeliveryNote?.items ?? []).map(item => [item.normalizedProductName, item])
        );

        for (const item of parsedDeliveryNote.items) {
          const decimalQuantity = new Prisma.Decimal(item.quantity);
          const existingItem = existingItemsMap.get(item.normalizedProductName);

          if (!existingItem) {
            itemsCreated++;
          } else {
            const itemContentChanged =
              existingItem.originalProductName !== item.originalProductName ||
              (!existingItem.isManuallyEdited &&
                existingItem.displayProductName !== item.displayProductName) ||
              existingItem.sourceQuantity.toString() !== item.quantity ||
              (!existingItem.isManuallyEdited &&
                existingItem.quantity.toString() !== item.quantity) ||
              (!existingItem.isManuallyEdited &&
                existingItem.sortOrder !== item.sortOrder);
            if (itemContentChanged) {
              itemsUpdated++;
            }
          }

          await transaction.deliveryNoteItem.upsert({
            where: {
              deliveryNoteId_normalizedProductName: {
                deliveryNoteId: deliveryNote.id,
                normalizedProductName: item.normalizedProductName,
              },
            },
            create: {
              deliveryNoteId: deliveryNote.id,
              displayProductName: item.displayProductName,
              normalizedProductName: item.normalizedProductName,
              originalProductName: item.originalProductName,
              quantity: decimalQuantity,
              sortOrder: item.sortOrder,
              sourceQuantity: decimalQuantity,
            },
            update: {
              displayProductName: existingItem?.isManuallyEdited
                ? undefined
                : item.displayProductName,
              originalProductName: item.originalProductName,
              quantity: existingItem?.isManuallyEdited
                ? undefined
                : decimalQuantity,
              sortOrder: existingItem?.isManuallyEdited
                ? undefined
                : item.sortOrder,
              sourceQuantity: decimalQuantity,
            },
          });
        }

        await transaction.deliveryNoteItem.deleteMany({
          where: {
            deliveryNoteId: deliveryNote.id,
            normalizedProductName: { notIn: importedProducts },
            isManuallyEdited: false,
          },
        });
      }

      for (const existingDeliveryNote of existingPurchaseOrder?.deliveryNotes ??
        []) {
        if (!importedBranches.has(existingDeliveryNote.normalizedBranchName)) {
          reimportWarnings.push({
            code: "ABSENT_BRANCH_PRESERVED",
            message: `Cabang ${existingDeliveryNote.branchName} tidak ada pada file terbaru dan tetap dipertahankan.`,
          });
        }
      }

      const allWarnings = [
        ...input.parsed.diagnostics.warnings,
        ...reimportWarnings,
      ];

      await transaction.upload.update({
        where: { id: input.uploadId },
        data: {
          detectedHeaderRow: input.parsed.diagnostics.headerRow,
          detectedSheetName: input.parsed.detectedSheet,
          detectionConfidence: input.parsed.confidence,
          deliveryNoteCount: input.parsed.summary.deliveryNoteCount,
          errors: toJsonValue([]),
          importStatus: "IMPORTED",
          itemCount: input.parsed.summary.itemCount,
          purchaseOrderCount: 1,
          warnings: toJsonValue(allWarnings),
        },
      });

      return {
        deliveryNotes: input.parsed.summary.deliveryNoteCount,
        duplicate: false,
        items: input.parsed.summary.itemCount,
        purchaseOrders: 1,
        warnings: allWarnings,
        databaseChanges: {
          purchaseOrdersCreated: isNewPO ? 1 : 0,
          purchaseOrdersUpdated: isNewPO ? 0 : 1,
          deliveryNotesCreated,
          deliveryNotesUpdated,
          itemsCreated,
          itemsUpdated,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    },
  );
}

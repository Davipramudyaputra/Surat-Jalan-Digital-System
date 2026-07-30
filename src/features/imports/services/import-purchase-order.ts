import "server-only";

import { Prisma, PrintStatus } from "@/generated/prisma/client";
import { createStableDeliveryNoteCode } from "@/features/imports/services/create-delivery-note-code";
import type {
  ImportIssue,
  ParsedDeliveryNote,
  ParsedImport,
} from "@/features/imports/types/import-types";
import { prisma } from "@/lib/prisma";

type ImportPurchaseOrderInput = {
  fileHash: string;
  parsed: ParsedImport;
  uploadId: string;
};

type ImportPurchaseOrderResult = {
  deliveryNotes: number;
  duplicate: boolean;
  items: number;
  purchaseOrders: number;
  warnings: ImportIssue[];
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
  }>,
  parsedDeliveryNote: ParsedDeliveryNote,
): boolean {
  if (existingItems.length !== parsedDeliveryNote.items.length) {
    return true;
  }

  const existingByName = new Map(
    existingItems.map((item) => [item.normalizedProductName, item]),
  );

  return parsedDeliveryNote.items.some((item) => {
    const existing = existingByName.get(item.normalizedProductName);

    return (
      !existing ||
      existing.originalProductName !== item.originalProductName ||
      existing.displayProductName !== item.displayProductName ||
      existing.sourceQuantity.toString() !== item.quantity ||
      existing.quantity.toString() !== item.quantity ||
      existing.sortOrder !== item.sortOrder
    );
  });
}

export async function importPurchaseOrder(
  input: ImportPurchaseOrderInput,
): Promise<ImportPurchaseOrderResult> {
  return prisma.$transaction(
    async (transaction) => {
      const previousUpload = await transaction.upload.findFirst({
        where: {
          fileHash: input.fileHash,
          id: { not: input.uploadId },
          importStatus: "IMPORTED",
        },
        orderBy: { createdAt: "asc" },
      });

      if (previousUpload) {
        await transaction.upload.update({
          where: { id: input.uploadId },
          data: {
            importStatus: "DUPLICATE",
            purchaseOrderCount: previousUpload.purchaseOrderCount,
            deliveryNoteCount: previousUpload.deliveryNoteCount,
            itemCount: previousUpload.itemCount,
            warnings: toJsonValue([
              {
                code: "DUPLICATE_FILE",
                message: "File yang sama sudah pernah di-import.",
              },
            ]),
          },
        });

        return {
          deliveryNotes: previousUpload.deliveryNoteCount,
          duplicate: true,
          items: previousUpload.itemCount,
          purchaseOrders: previousUpload.purchaseOrderCount,
          warnings: [
            {
              code: "DUPLICATE_FILE",
              message: "File yang sama sudah pernah di-import.",
            },
          ],
        };
      }

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
          companyName: input.parsed.companyName,
          lastSourceUploadId: input.uploadId,
          period: input.parsed.period,
          poNumber: input.parsed.poNumber,
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

      for (const parsedDeliveryNote of input.parsed.deliveryNotes) {
        const existingDeliveryNote = existingNotesByBranch.get(
          parsedDeliveryNote.normalizedBranchName,
        );
        const noteFieldsChanged =
          existingDeliveryNote !== undefined &&
          (existingDeliveryNote.originalBranchName !==
            parsedDeliveryNote.originalBranchName ||
            existingDeliveryNote.branchName !== parsedDeliveryNote.branchName ||
            existingDeliveryNote.recipientCompanyName !==
              input.parsed.companyName);
        const itemsChanged =
          existingDeliveryNote !== undefined &&
          hasItemChanges(existingDeliveryNote.items, parsedDeliveryNote);
        const contentChanged = noteFieldsChanged || itemsChanged;
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
            recipientCompanyName: input.parsed.companyName,
            uniqueCode: createStableDeliveryNoteCode({
              companyCode: input.parsed.companyCode,
              normalizedBranchName:
                parsedDeliveryNote.normalizedBranchName,
              normalizedPoNumber: input.parsed.normalizedPoNumber,
            }),
          },
          update: {
            branchName: parsedDeliveryNote.branchName,
            normalizedBranchName: parsedDeliveryNote.normalizedBranchName,
            originalBranchName: parsedDeliveryNote.originalBranchName,
            printStatus: contentChanged
              ? PrintStatus.NOT_PRINTED
              : undefined,
            recipientCompanyName: input.parsed.companyName,
          },
        });
        const importedProducts = parsedDeliveryNote.items.map(
          (item) => item.normalizedProductName,
        );

        for (const item of parsedDeliveryNote.items) {
          const decimalQuantity = new Prisma.Decimal(item.quantity);

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
              displayProductName: item.displayProductName,
              originalProductName: item.originalProductName,
              quantity: decimalQuantity,
              sortOrder: item.sortOrder,
              sourceQuantity: decimalQuantity,
            },
          });
        }

        await transaction.deliveryNoteItem.deleteMany({
          where: {
            deliveryNoteId: deliveryNote.id,
            normalizedProductName: { notIn: importedProducts },
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
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    },
  );
}

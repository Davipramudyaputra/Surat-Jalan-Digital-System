import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { parseWorkbookBuffer } from "@/features/imports/parser/parse-workbook";
import { importPurchaseOrder } from "@/features/imports/services/import-purchase-order";
import type {
  ImportFileResult,
  ImportIssue,
  ImportResultStatus,
} from "@/features/imports/types/import-types";
import {
  sanitizeFileName,
  validateFileDescriptor,
  validateWorkbookSignature,
} from "@/features/imports/validation/file-validation";
import { prisma } from "@/lib/prisma";

export type ImportFilePayload = {
  buffer: Uint8Array;
  name: string;
  size: number;
  type: string;
  mode: "preview" | "commit";
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function calculateFileHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function getExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf(".");
  return extensionIndex >= 0
    ? fileName.slice(extensionIndex).toLocaleLowerCase("en-US")
    : "";
}

async function recordFailedUpload(input: {
  errors: ImportIssue[];
  fileHash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<void> {
  try {
    await prisma.upload.create({
      data: {
        errors: toJsonValue(input.errors),
        fileHash: input.fileHash,
        fileSize: input.fileSize,
        importStatus: "FAILED",
        mimeType: input.mimeType || null,
        originalFileName: input.fileName,
        warnings: toJsonValue([]),
      },
    });
  } catch {
    // Response pengguna tetap aman ketika pencatatan diagnostic gagal.
  }
}

export async function processImportFile(
  payload: ImportFilePayload,
): Promise<ImportFileResult> {
  const fileName = sanitizeFileName(payload.name);
  const fileDescriptor = {
    extension: getExtension(fileName),
    fileSize: payload.size,
  };
  const descriptorIssues = validateFileDescriptor({
    name: fileName,
    size: payload.size,
    type: payload.type,
  });
  const fileHash = calculateFileHash(payload.buffer);

  if (descriptorIssues.length > 0) {
    if (payload.mode === "commit") {
      await recordFailedUpload({
        errors: descriptorIssues,
        fileHash,
        fileName,
        fileSize: payload.size,
        mimeType: payload.type,
      });
    }

    return {
      ...fileDescriptor,
      confidence: null,
      deliveryNotes: 0,
      detectedSheet: null,
      errors: descriptorIssues,
      fileName,
      items: 0,
      purchaseOrders: 0,
      status: "FAILED",
      warnings: [],
    };
  }

  const signatureIssues = validateWorkbookSignature(payload.buffer, fileName);

  if (signatureIssues.length > 0) {
    if (payload.mode === "commit") {
      await recordFailedUpload({
        errors: signatureIssues,
        fileHash,
        fileName,
        fileSize: payload.size,
        mimeType: payload.type,
      });
    }

    return {
      ...fileDescriptor,
      confidence: null,
      deliveryNotes: 0,
      detectedSheet: null,
      errors: signatureIssues,
      fileName,
      items: 0,
      purchaseOrders: 0,
      status: "FAILED",
      warnings: [],
    };
  }

  let parsed;
  try {
    parsed = parseWorkbookBuffer(payload.buffer);
  } catch (error) {
    const pipelineError = error instanceof ImportPipelineError ? error : undefined;
    const errors = pipelineError?.issues ?? [
      {
        code: "IMPORT_FAILED",
        message: "File tidak dapat di-parse atau format tidak dikenali.",
      },
    ];
    if (payload.mode === "commit") {
      await recordFailedUpload({
        errors,
        fileHash,
        fileName,
        fileSize: payload.size,
        mimeType: payload.type,
      });
    }
    return {
      ...fileDescriptor,
      confidence: null,
      deliveryNotes: 0,
      detectedSheet: null,
      errors,
      fileName,
      items: 0,
      purchaseOrders: 0,
      status: "FAILED",
      warnings: pipelineError?.diagnostics?.warnings ?? [],
    };
  }

  const previousUpload = await prisma.upload.findFirst({
    where: {
      fileHash,
      importStatus: { in: ["IMPORTED", "DUPLICATE"] },
    },
    orderBy: { createdAt: "asc" },
  });

  const previousUploadWithSameName = await prisma.upload.findFirst({
    where: {
      originalFileName: fileName,
      fileHash: { not: fileHash },
      importStatus: { in: ["IMPORTED", "DUPLICATE"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const activePurchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      companyCode_normalizedPoNumber: {
        companyCode: parsed.companyCode,
        normalizedPoNumber: parsed.normalizedPoNumber,
      },
    },
    select: { id: true, lastSourceUploadId: true },
  });

  let importStatus: ImportResultStatus = "NEW_FILE";
  let classification: ImportFileResult["classification"] = "NEW_FILE";
  let existingPurchaseOrderId: string | undefined;

  if (previousUpload) {
    if (activePurchaseOrder) {
      importStatus = "DUPLICATE_ACTIVE";
      classification =
        previousUpload.originalFileName === fileName
          ? "DUPLICATE_ACTIVE"
          : "DIFFERENT_NAME_SAME_HASH";
      existingPurchaseOrderId = activePurchaseOrder.id;
    } else {
      importStatus = "REIMPORT_AFTER_DELETE";
      classification =
        previousUpload.originalFileName === fileName
          ? "REIMPORT_AFTER_DELETE"
          : "DIFFERENT_NAME_SAME_HASH";
    }
  } else {
    if (activePurchaseOrder) {
      importStatus = "REVISION";
      classification = previousUploadWithSameName
        ? "SAME_NAME_DIFFERENT_HASH"
        : "REVISION";
      existingPurchaseOrderId = activePurchaseOrder.id;
    } else {
      importStatus = "NEW_FILE";
      classification = previousUploadWithSameName
        ? "SAME_NAME_DIFFERENT_HASH"
        : "NEW_FILE";
    }
  }

  const parsedMetadata = {
    ...fileDescriptor,
    classification,
    companyCode: parsed.companyCode,
    companyName: parsed.companyName,
    period: parsed.period,
    poNumber: parsed.poNumber,
  };

  if (payload.mode === "preview") {
    return {
      ...parsedMetadata,
      confidence: parsed.confidence,
      deliveryNotes: parsed.summary.deliveryNoteCount,
      detectedSheet: parsed.detectedSheet,
      errors: [],
      fileName,
      items: parsed.summary.itemCount,
      purchaseOrders: 1,
      status: importStatus,
      warnings: parsed.diagnostics.warnings,
      existingPurchaseOrderId,
    };
  }

  if (importStatus === "DUPLICATE_ACTIVE") {
    const duplicateWarning = {
      code: "DUPLICATE_FILE",
      message: "File dan data PO yang sama masih tersedia.",
    };

    await prisma.upload.create({
      data: {
        detectedHeaderRow: parsed.diagnostics.headerRow,
        detectedSheetName: parsed.detectedSheet,
        detectionConfidence: parsed.confidence,
        deliveryNoteCount: parsed.summary.deliveryNoteCount,
        errors: toJsonValue([]),
        fileHash,
        fileSize: payload.size,
        importStatus: "DUPLICATE",
        itemCount: parsed.summary.itemCount,
        mimeType: payload.type || null,
        originalFileName: fileName,
        purchaseOrderCount: 1,
        warnings: toJsonValue([duplicateWarning]),
      },
    });

    return {
      ...parsedMetadata,
      confidence: parsed.confidence,
      deliveryNotes: parsed.summary.deliveryNoteCount,
      detectedSheet: parsed.detectedSheet,
      errors: [],
      fileName,
      items: parsed.summary.itemCount,
      purchaseOrders: 1,
      status: "DUPLICATE_ACTIVE",
      warnings: [duplicateWarning],
      existingPurchaseOrderId,
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

  const upload = await prisma.upload.create({
    data: {
      errors: toJsonValue([]),
      fileHash,
      fileSize: payload.size,
      importStatus: "PROCESSING",
      mimeType: payload.type || null,
      originalFileName: fileName,
      warnings: toJsonValue([]),
    },
  });

  try {
    const imported = await importPurchaseOrder({
      fileHash,
      parsed,
      uploadId: upload.id,
      importStatus,
    });

    return {
      ...parsedMetadata,
      confidence: parsed.confidence,
      deliveryNotes: imported.deliveryNotes,
      detectedSheet: parsed.detectedSheet,
      errors: [],
      fileName,
      items: imported.items,
      purchaseOrders: imported.purchaseOrders,
      status: imported.duplicate ? "DUPLICATE_ACTIVE" : (importStatus === "REIMPORT_AFTER_DELETE" ? "REIMPORT_AFTER_DELETE" : "IMPORTED"),
      warnings: imported.warnings,
      existingPurchaseOrderId,
      databaseChanges: imported.databaseChanges,
    };
  } catch (error) {
    if (
      importStatus === "NEW_FILE" ||
      importStatus === "REIMPORT_AFTER_DELETE"
    ) {
      const concurrentPurchaseOrder = await prisma.purchaseOrder.findUnique({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode: parsed.companyCode,
            normalizedPoNumber: parsed.normalizedPoNumber,
          },
        },
        select: { id: true },
      });

      if (concurrentPurchaseOrder) {
        const duplicateWarning = {
          code: "DUPLICATE_FILE",
          message: "Data PO yang sama baru saja di-import oleh proses lain.",
        };
        await prisma.upload.update({
          where: { id: upload.id },
          data: {
            errors: toJsonValue([]),
            importStatus: "DUPLICATE",
            warnings: toJsonValue([duplicateWarning]),
          },
        }).catch(() => undefined);

        return {
          ...parsedMetadata,
          confidence: parsed.confidence,
          deliveryNotes: parsed.summary.deliveryNoteCount,
          detectedSheet: parsed.detectedSheet,
          errors: [],
          existingPurchaseOrderId: concurrentPurchaseOrder.id,
          fileName,
          items: parsed.summary.itemCount,
          purchaseOrders: 1,
          status: "DUPLICATE_ACTIVE",
          warnings: [duplicateWarning],
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
    }

    const pipelineError =
      error instanceof ImportPipelineError ? error : undefined;
    const errors = pipelineError?.issues ?? [
      {
        code: "IMPORT_FAILED",
        message: "Import gagal dan tidak ada data dari file ini yang disimpan.",
      },
    ];

    try {
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          errors: toJsonValue(errors),
          importStatus: "FAILED",
          warnings: toJsonValue(
            pipelineError?.diagnostics?.warnings ?? [],
          ),
        },
      });
    } catch {
    }

    return {
      ...fileDescriptor,
      confidence: null,
      deliveryNotes: 0,
      detectedSheet: null,
      errors,
      fileName,
      items: 0,
      purchaseOrders: 0,
      status: "FAILED",
      warnings: pipelineError?.diagnostics?.warnings ?? [],
    };
  }
}

import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { parseWorkbookBuffer } from "@/features/imports/parser/parse-workbook";
import { importPurchaseOrder } from "@/features/imports/services/import-purchase-order";
import type {
  ImportFileResult,
  ImportIssue,
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
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function calculateFileHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
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
  const descriptorIssues = validateFileDescriptor({
    name: fileName,
    size: payload.size,
    type: payload.type,
  });
  const fileHash = calculateFileHash(payload.buffer);

  if (descriptorIssues.length > 0) {
    await recordFailedUpload({
      errors: descriptorIssues,
      fileHash,
      fileName,
      fileSize: payload.size,
      mimeType: payload.type,
    });

    return {
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
    await recordFailedUpload({
      errors: signatureIssues,
      fileHash,
      fileName,
      fileSize: payload.size,
      mimeType: payload.type,
    });

    return {
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

  const previousUpload = await prisma.upload.findFirst({
    where: {
      fileHash,
      importStatus: "IMPORTED",
    },
    orderBy: { createdAt: "asc" },
  });

  if (previousUpload) {
    const duplicateWarning = {
      code: "DUPLICATE_FILE",
      message: "File yang sama sudah pernah di-import.",
    };

    await prisma.upload.create({
      data: {
        detectedHeaderRow: previousUpload.detectedHeaderRow,
        detectedSheetName: previousUpload.detectedSheetName,
        detectionConfidence: previousUpload.detectionConfidence,
        deliveryNoteCount: previousUpload.deliveryNoteCount,
        errors: toJsonValue([]),
        fileHash,
        fileSize: payload.size,
        importStatus: "DUPLICATE",
        itemCount: previousUpload.itemCount,
        mimeType: payload.type || null,
        originalFileName: fileName,
        purchaseOrderCount: previousUpload.purchaseOrderCount,
        warnings: toJsonValue([duplicateWarning]),
      },
    });

    return {
      confidence: previousUpload.detectionConfidence,
      deliveryNotes: previousUpload.deliveryNoteCount,
      detectedSheet: previousUpload.detectedSheetName,
      errors: [],
      fileName,
      items: previousUpload.itemCount,
      purchaseOrders: previousUpload.purchaseOrderCount,
      status: "DUPLICATE",
      warnings: [duplicateWarning],
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
    const parsed = parseWorkbookBuffer(payload.buffer);
    const imported = await importPurchaseOrder({
      fileHash,
      parsed,
      uploadId: upload.id,
    });

    return {
      confidence: parsed.confidence,
      deliveryNotes: imported.deliveryNotes,
      detectedSheet: parsed.detectedSheet,
      errors: [],
      fileName,
      items: imported.items,
      purchaseOrders: imported.purchaseOrders,
      status: imported.duplicate ? "DUPLICATE" : "IMPORTED",
      warnings: imported.warnings,
    };
  } catch (error) {
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
      // Jangan mengganti error aman dengan detail database internal.
    }

    return {
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

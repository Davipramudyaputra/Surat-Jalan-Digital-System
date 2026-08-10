import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import type { AuditActor } from "@/features/audit/services/audit-service";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { getDeliveryNoteForPreview } from "@/features/delivery-notes/queries";
import { prisma } from "@/lib/prisma";
import { resolvePaperProfile, type PaperOrientation, type PaperSizeId } from "@/lib/delivery-note-template/paper-profiles";

import { buildPdfFilename } from "../lib/filename";
import { createRenderToken } from "../lib/render-token";
import { validateCustomPaperDimensions } from "../schemas";
import type { PdfPageOptions, PdfRenderResult } from "./pdf-renderer";
import { renderUrlToPdf } from "./pdf-renderer";

export type GeneratePdfInput = {
  deliveryNoteId: string;
  paper: PaperSizeId;
  orientation: PaperOrientation;
  widthMm?: number;
  heightMm?: number;
  marginMm?: number;
  actor: AuditActor;
};

export type GeneratePdfResult = {
  buffer: Buffer;
  filename: string;
  pageCount: number;
};

type Renderer = (url: string, options: PdfPageOptions) => Promise<PdfRenderResult>;

function getAppOrigin(): string {
  return process.env.APP_ORIGIN || "http://localhost:3000";
}

/**
 * End-to-end service PDF individual.
 *
 * 1. Memvalidasi session (di route), active-only, dan parent PO aktif.
 * 2. Memvalidasi paper profile / orientation / custom dimensions.
 * 3. Membentuk render token internal + URL.
 * 4. Merender PDF via renderer.
 * 5. Mencatat AuditEvent PDF_EXPORT setelah sukses.
 * 6. Tidak mengubah printStatus / printCount.
 */
export async function generateDeliveryNotePdf(
  input: GeneratePdfInput,
  renderer: Renderer = renderUrlToPdf,
): Promise<GeneratePdfResult> {
  const startedAt = Date.now();

  // Load data segar server-side (tidak mempercayai object client).
  const deliveryNote = await getDeliveryNoteForPreview(input.deliveryNoteId);
  if (!deliveryNote) {
    throw new Error("Surat Jalan tidak ditemukan atau tidak lagi aktif.");
  }

  // Validasi parent PO aktif.
  const parentPO = await prisma.purchaseOrder.findFirst({
    where: { id: deliveryNote.purchaseOrderId, deletedAt: null },
    select: { id: true, poNumber: true },
  });
  if (!parentPO) {
    throw new Error("Surat Jalan berada di Recycle Bin.");
  }

  // Validasi custom paper.
  if (input.paper === "CUSTOM") {
    const errors = validateCustomPaperDimensions(
      input.widthMm,
      input.heightMm,
      input.marginMm,
    );
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }

  // Resolve paper profile.
  const resolution = resolvePaperProfile(
    input.paper,
    input.orientation,
    {
      widthMm: input.widthMm ?? 250,
      heightMm: input.heightMm ?? 180,
      marginMm: input.marginMm ?? 7,
      orientation: input.orientation,
    },
  );
  const profile = resolution.profile;
  if (resolution.errors.length > 0) {
    throw new Error("Ukuran kertas tidak valid.");
  }

  const filename = buildPdfFilename(
    deliveryNote.purchaseOrder.poNumber,
    deliveryNote.branchName,
  );

  const token = createRenderToken({
    deliveryNoteId: input.deliveryNoteId,
    paper: input.paper,
    orientation: input.orientation,
    width: input.widthMm,
    height: input.heightMm,
    margin: input.marginMm,
  });
  const origin = getAppOrigin();
  const url = `${origin}/render/surat-jalan/${token}`;

  // Render PDF.
  const { buffer, pageCount } = await renderer(url, {
    widthMm: profile.widthMm,
    heightMm: profile.heightMm,
  });

  const durationMs = Date.now() - startedAt;

  // Catat PDF_EXPORT setelah render berhasil. Tidak mengubah print status.
  await recordAuditEvent({
    actor: input.actor,
    entity: {
      type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
      id: input.deliveryNoteId,
      label: deliveryNote.branchName || deliveryNote.uniqueCode,
    },
    action: AUDIT_ACTION.PDF_EXPORT,
    source: AUDIT_SOURCE.PDF_EXPORT,
    metadata: {
      purchaseOrderId: deliveryNote.purchaseOrderId,
      poNumber: deliveryNote.purchaseOrder.poNumber,
      branchName: deliveryNote.branchName,
      paperProfile: profile.id,
      paperWidthMm: profile.widthMm,
      paperHeightMm: profile.heightMm,
      orientation: input.orientation,
      pageCount,
      filename,
      outputSizeBytes: buffer.length,
      durationMs,
    },
  });

  return { buffer, filename, pageCount };
}

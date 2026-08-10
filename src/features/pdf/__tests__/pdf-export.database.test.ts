import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { TEST_AUDIT_ACTOR } from "@/features/audit/lib/test-actor";
import { AUDIT_ACTION } from "@/features/audit/constants";
import { generateDeliveryNotePdf } from "../services/generate-delivery-note-pdf";
import type { PdfRenderResult } from "../services/pdf-renderer";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const companyCode = "PHASE6-PDF-TEST";
let poId = "";
let dnId = "";

/** Mock renderer yang menghasilkan buffer PDF dummy tanpa Chromium. */
function mockRenderer(shouldFail = false) {
  return async () => {
    if (shouldFail) {
      throw new Error("render failed");
    }
    return {
      buffer: Buffer.from("%PDF-1.4\nmock pdf content"),
      pageCount: 1,
    } satisfies PdfRenderResult;
  };
}

describe.runIf(runDatabaseTests)("Phase 6 PDF export", () => {
  beforeAll(async () => {
    process.env.PDF_RENDER_SECRET = "test-render-secret";
    process.env.APP_ORIGIN = "http://localhost:3000";

    const po = await prisma.purchaseOrder.create({
      data: {
        companyCode,
        companyName: "PT PDF TEST",
        poNumber: "PO-PDF",
        normalizedPoNumber: `po-pdf-${Date.now()}-${crypto.randomUUID()}`,
      },
    });
    poId = po.id;
    const dn = await prisma.deliveryNote.create({
      data: {
        purchaseOrderId: poId,
        uniqueCode: `DN-PDF-${crypto.randomUUID()}`,
        recipientCompanyName: "PT PDF TEST",
        originalBranchName: "Cianjur",
        branchName: "Cianjur",
        normalizedBranchName: `cianjur-pdf-${crypto.randomUUID()}`,
      },
    });
    dnId = dn.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({ where: { entityId: { in: [poId, dnId] } } });
    await prisma.deliveryNoteItem.deleteMany({
      where: { deliveryNote: { purchaseOrder: { companyCode } } },
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrder: { companyCode } },
    });
    await prisma.purchaseOrder.deleteMany({ where: { companyCode } });
  });

  it("PDF aktif berhasil dan tidak mengubah print status", async () => {
    const before = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: dnId },
    });

    const result = await generateDeliveryNotePdf(
      {
        deliveryNoteId: dnId,
        paper: "HALF_FOLIO",
        orientation: "LANDSCAPE",
        actor: TEST_AUDIT_ACTOR,
      },
      mockRenderer(),
    );

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.filename).toMatch(/\.pdf$/u);

    const after = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: dnId },
    });
    expect(after.printStatus).toBe(before.printStatus);
    expect(after.printCount).toBe(before.printCount);
    expect(after.firstPrintedAt).toEqual(before.firstPrintedAt);
    expect(after.lastPrintedAt).toEqual(before.lastPrintedAt);
  });

  it("PDF_EXPORT dibuat setelah sukses", async () => {
    await generateDeliveryNotePdf(
      {
        deliveryNoteId: dnId,
        paper: "A4",
        orientation: "PORTRAIT",
        actor: TEST_AUDIT_ACTOR,
      },
      mockRenderer(),
    );

    const event = await prisma.auditEvent.findFirst({
      where: { entityId: dnId, action: AUDIT_ACTION.PDF_EXPORT },
      orderBy: { occurredAt: "desc" },
    });
    expect(event).not.toBeNull();
    expect(event?.actorNameSnapshot).toBe(TEST_AUDIT_ACTOR.name);
    expect(event?.metadata).not.toBeNull();
    // Tidak boleh menyimpan PDF binary.
    const meta = event?.metadata as Record<string, unknown>;
    expect("buffer" in meta).toBe(false);
  });

  it("PDF_EXPORT tidak dibuat setelah render gagal", async () => {
    const before = await prisma.auditEvent.count({
      where: { entityId: dnId, action: AUDIT_ACTION.PDF_EXPORT },
    });

    await expect(
      generateDeliveryNotePdf(
        {
          deliveryNoteId: dnId,
          paper: "A5",
          orientation: "LANDSCAPE",
          actor: TEST_AUDIT_ACTOR,
        },
        mockRenderer(true),
      ),
    ).rejects.toThrow();

    const after = await prisma.auditEvent.count({
      where: { entityId: dnId, action: AUDIT_ACTION.PDF_EXPORT },
    });
    expect(after).toBe(before);
  });

  it("soft-deleted Delivery Note ditolak", async () => {
    // Soft delete DN.
    await prisma.deliveryNote.updateMany({
      where: { id: dnId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "b" },
    });

    await expect(
      generateDeliveryNotePdf(
        { deliveryNoteId: dnId, paper: "HALF_FOLIO", orientation: "LANDSCAPE", actor: TEST_AUDIT_ACTOR },
        mockRenderer(),
      ),
    ).rejects.toThrow(/tidak ditemukan|tidak lagi aktif/);

    // Kembalikan.
    await prisma.deliveryNote.updateMany({
      where: { id: dnId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
  });

  it("parent PO terhapus menyebabkan export ditolak", async () => {
    // Soft delete parent PO (dan child).
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "b2" },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "b2" },
    });

    await expect(
      generateDeliveryNotePdf(
        { deliveryNoteId: dnId, paper: "HALF_FOLIO", orientation: "LANDSCAPE", actor: TEST_AUDIT_ACTOR },
        mockRenderer(),
      ),
    ).rejects.toThrow(/Recycle Bin|tidak ditemukan/);

    // Kembalikan.
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
  });

  it("custom paper invalid ditolak", async () => {
    await expect(
      generateDeliveryNotePdf(
        {
          deliveryNoteId: dnId,
          paper: "CUSTOM",
          orientation: "LANDSCAPE",
          widthMm: 10, // terlalu kecil
          heightMm: 10,
          marginMm: 0,
          actor: TEST_AUDIT_ACTOR,
        },
        mockRenderer(),
      ),
    ).rejects.toThrow(/Lebar|Tinggi|angka/);
  });
});

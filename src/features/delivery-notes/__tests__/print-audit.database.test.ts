import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { TEST_AUDIT_ACTOR } from "@/features/audit/lib/test-actor";
import { getDeliveryNoteForPreview } from "../queries";
import { markDeliveryNotePrinted } from "../services/mark-delivery-note-printed";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const companyCode = "PHASE4-PRINT-TEST";
let deliveryNoteId = "";

describe.runIf(runDatabaseTests)("Phase 4 print audit", () => {
  beforeAll(async () => {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyCode,
        companyName: "PT TEST PRINT",
        poNumber: `PO-PRINT-${Date.now()}`,
        normalizedPoNumber: `PO-PRINT-${Date.now()}-${crypto.randomUUID()}`,
      },
    });
    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        purchaseOrderId: purchaseOrder.id,
        uniqueCode: `DN-PRINT-${crypto.randomUUID()}`,
        recipientCompanyName: "PT TEST PRINT",
        originalBranchName: "Cianjur",
        branchName: "Cianjur",
        normalizedBranchName: `cianjur-${crypto.randomUUID()}`,
      },
    });
    deliveryNoteId = deliveryNote.id;
  });

  afterAll(async () => {
    await prisma.deliveryNoteItem.deleteMany({
      where: { deliveryNote: { purchaseOrder: { companyCode } } },
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrder: { companyCode } },
    });
    await prisma.purchaseOrder.deleteMany({ where: { companyCode } });
  });

  it("membuka preview tidak mengubah status atau printCount", async () => {
    const before = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    await getDeliveryNoteForPreview(deliveryNoteId);
    const after = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    expect(after.printStatus).toBe(before.printStatus);
    expect(after.printCount).toBe(before.printCount);
  });

  it("mencatat cetak pertama dan cetak ulang menggunakan state database", async () => {
    const initial = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    const first = await markDeliveryNotePrinted({
      id: deliveryNoteId,
      expectedUpdatedAt: initial.updatedAt,
      actor: TEST_AUDIT_ACTOR,
    });
    expect("success" in first && first.success).toBe(true);

    const afterFirst = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    expect(afterFirst.printStatus).toBe("PRINTED");
    expect(afterFirst.firstPrintedAt).not.toBeNull();
    expect(afterFirst.lastPrintedAt).not.toBeNull();
    expect(afterFirst.printCount).toBe(1);

    const second = await markDeliveryNotePrinted({
      id: deliveryNoteId,
      expectedUpdatedAt: afterFirst.updatedAt,
      actor: TEST_AUDIT_ACTOR,
    });
    expect("success" in second && second.success).toBe(true);

    const afterSecond = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    expect(afterSecond.firstPrintedAt).toEqual(afterFirst.firstPrintedAt);
    expect(afterSecond.lastPrintedAt?.getTime()).toBeGreaterThanOrEqual(
      afterFirst.lastPrintedAt?.getTime() ?? 0,
    );
    expect(afterSecond.printCount).toBe(2);
  });

  it("menolak optimistic concurrency conflict", async () => {
    const current = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: deliveryNoteId },
    });
    const result = await markDeliveryNotePrinted({
      id: deliveryNoteId,
      expectedUpdatedAt: new Date(current.updatedAt.getTime() - 1_000),
      actor: TEST_AUDIT_ACTOR,
    });
    expect(result.error).toContain("telah berubah");
  });
});

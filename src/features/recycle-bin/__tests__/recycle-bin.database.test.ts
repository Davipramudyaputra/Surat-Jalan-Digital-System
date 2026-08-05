import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { TEST_AUDIT_ACTOR } from "@/features/audit/lib/test-actor";
import { AUDIT_ACTION } from "@/features/audit/constants";
import {
  permanentlyDeletePurchaseOrder,
  restorePurchaseOrder,
  restoreDeliveryNote,
  softDeleteDeliveryNote,
} from "../services";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const companyCode = "PHASE5-RB-TEST";
let poId = "";
let dnId = "";

describe.runIf(runDatabaseTests)("Phase 5 Recycle Bin", () => {
  beforeAll(async () => {
    const po = await prisma.purchaseOrder.create({
      data: {
        companyCode,
        companyName: "PT RECYCLE TEST",
        poNumber: "PO-RB",
        normalizedPoNumber: `po-rb-${Date.now()}-${crypto.randomUUID()}`,
      },
    });
    poId = po.id;
    const dn = await prisma.deliveryNote.create({
      data: {
        purchaseOrderId: poId,
        uniqueCode: `DN-RB-${crypto.randomUUID()}`,
        recipientCompanyName: "PT RECYCLE TEST",
        originalBranchName: "Cianjur",
        branchName: "Cianjur",
        normalizedBranchName: `cianjur-rb-${crypto.randomUUID()}`,
      },
    });
    dnId = dn.id;
  });

  afterAll(async () => {
    // Hapus audit event untuk PO/DN test.
    await prisma.auditEvent.deleteMany({
      where: { entityId: { in: [poId, dnId] } },
    });
    // Bersihkan semua PO yang memakai company code test (aktif & conflict).
    await prisma.deliveryNoteItem.deleteMany({
      where: { deliveryNote: { purchaseOrder: { companyCode: { in: [companyCode, "PHASE5-RB-CONFLICT"] } } } },
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrder: { companyCode: { in: [companyCode, "PHASE5-RB-CONFLICT"] } } },
    });
    await prisma.purchaseOrder.deleteMany({
      where: { companyCode: { in: [companyCode, "PHASE5-RB-CONFLICT"] } },
    });
  });

  it("soft delete Surat Jalan memindahkan ke Recycle Bin dan membuat event DELETE", async () => {
    const result = await softDeleteDeliveryNote(dnId, TEST_AUDIT_ACTOR, "Test");
    expect("success" in result && result.success).toBe(true);

    const deleted = await prisma.deliveryNote.findFirst({
      where: { id: dnId },
    });
    expect(deleted?.deletedAt).not.toBeNull();
    expect(deleted?.trashBatchId).not.toBeNull();

    const deleteEvent = await prisma.auditEvent.findFirst({
      where: { entityId: dnId, action: AUDIT_ACTION.DELETE },
      orderBy: { occurredAt: "desc" },
    });
    expect(deleteEvent).not.toBeNull();
  });

  it("parent PO tetap aktif saat Surat Jalan dihapus", async () => {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: poId } });
    expect(po?.deletedAt).toBeNull();
  });

  it("restore Surat Jalan berhasil jika parent aktif dan membuat event RESTORE", async () => {
    const result = await restoreDeliveryNote(dnId, TEST_AUDIT_ACTOR);
    expect("success" in result && result.success).toBe(true);

    const restored = await prisma.deliveryNote.findFirst({
      where: { id: dnId },
    });
    expect(restored?.deletedAt).toBeNull();

    const restoreEvent = await prisma.auditEvent.findFirst({
      where: { entityId: dnId, action: AUDIT_ACTION.RESTORE },
      orderBy: { occurredAt: "desc" },
    });
    expect(restoreEvent).not.toBeNull();
  });

  it("restore Surat Jalan ditolak jika parent PO terhapus", async () => {
    // Soft delete PO (dan child-nya).
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-x" },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-x" },
    });

    const result = await restoreDeliveryNote(dnId, TEST_AUDIT_ACTOR);
    if (!("error" in result)) {
      throw new Error("Expected restore to fail");
    }
    expect(result.error).toContain("Purchase Order terlebih dahulu");

    // Kembalikan agar test lain tidak terganggu.
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
  });

  it("restore Purchase Order mengembalikan aggregate dan membuat event RESTORE", async () => {
    // Soft delete seluruh aggregate.
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-restore" },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-restore" },
    });

    const result = await restorePurchaseOrder(poId, TEST_AUDIT_ACTOR);
    expect("success" in result && result.success).toBe(true);

    const po = await prisma.purchaseOrder.findFirst({ where: { id: poId } });
    expect(po?.deletedAt).toBeNull();
    const dn = await prisma.deliveryNote.findFirst({ where: { id: dnId } });
    expect(dn?.deletedAt).toBeNull();

    const restoreEvent = await prisma.auditEvent.findFirst({
      where: { entityId: poId, action: AUDIT_ACTION.RESTORE },
      orderBy: { occurredAt: "desc" },
    });
    expect(restoreEvent).not.toBeNull();
  });

  it("restore PO ditolak jika PO aktif dengan identity sama ada", async () => {
    const conflictCode = "PHASE5-RB-CONFLICT";
    const sharedNormalized = "po-rb-shared-conflict";

    // Bersihkan sisa dari run sebelumnya.
    await prisma.purchaseOrder.deleteMany({
      where: { companyCode: conflictCode },
    });

    // PO lama yang akan dihapus.
    const deletedPo = await prisma.purchaseOrder.create({
      data: {
        companyCode: conflictCode,
        companyName: "PT LAMA",
        poNumber: "PO-RB-LAMA",
        normalizedPoNumber: sharedNormalized,
      },
    });

    // Soft delete PO lama terlebih dahulu agar partial unique index tidak
    // memblokir pembuatan PO aktif baru dengan identity sama.
    await prisma.purchaseOrder.update({
      where: { id: deletedPo.id },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-conflict" },
    });

    // PO aktif dengan identity (companyCode, normalizedPoNumber) sama.
    const activePo = await prisma.purchaseOrder.create({
      data: {
        companyCode: conflictCode,
        companyName: "PT BARU",
        poNumber: "PO-RB-BARU",
        normalizedPoNumber: sharedNormalized,
      },
    });

    const result = await restorePurchaseOrder(deletedPo.id, TEST_AUDIT_ACTOR);
    if (!("error" in result)) {
      throw new Error("Expected restore to be blocked");
    }
    expect(result.error).toContain("sudah ada");

    // Bersihkan.
    await prisma.purchaseOrder.deleteMany({ where: { id: { in: [deletedPo.id, activePo.id] } } });
  });

  it("permanent delete PO membuat event PERMANENT_DELETE dan audit tetap ada", async () => {
    // Soft delete aggregate.
    await prisma.deliveryNote.updateMany({
      where: { purchaseOrderId: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-perm" },
    });
    await prisma.purchaseOrder.updateMany({
      where: { id: poId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: TEST_AUDIT_ACTOR.id, trashBatchId: "batch-perm" },
    });

    const result = await permanentlyDeletePurchaseOrder(poId, TEST_AUDIT_ACTOR);
    expect("success" in result && result.success).toBe(true);

    const gone = await prisma.purchaseOrder.findFirst({ where: { id: poId } });
    expect(gone).toBeNull();

    const permEvent = await prisma.auditEvent.findFirst({
      where: { entityId: poId, action: AUDIT_ACTION.PERMANENT_DELETE },
      orderBy: { occurredAt: "desc" },
    });
    expect(permEvent).not.toBeNull();
  });
});

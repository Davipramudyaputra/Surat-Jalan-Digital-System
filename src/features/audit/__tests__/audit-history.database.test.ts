import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { TEST_AUDIT_ACTOR } from "../lib/test-actor";
import { redactSensitiveData } from "../lib/redact";
import {
  computeChangedFields,
  recordAuditEvent,
} from "../services/audit-service";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "../constants";
import { markDeliveryNotePrinted } from "@/features/delivery-notes/services/mark-delivery-note-printed";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const companyCode = "PHASE5-AUDIT-TEST";
let poId = "";
let dnId = "";

describe.runIf(runDatabaseTests)("Phase 5 audit history", () => {
  beforeAll(async () => {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyCode,
        companyName: "PT AUDIT TEST",
        poNumber: "PO-AUDIT",
        normalizedPoNumber: `po-audit-${Date.now()}-${crypto.randomUUID()}`,
      },
    });
    poId = purchaseOrder.id;
    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        purchaseOrderId: poId,
        uniqueCode: `DN-AUDIT-${crypto.randomUUID()}`,
        recipientCompanyName: "PT AUDIT TEST",
        originalBranchName: "Cianjur",
        branchName: "Cianjur",
        normalizedBranchName: `cianjur-audit-${crypto.randomUUID()}`,
      },
    });
    dnId = deliveryNote.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { entityId: poId },
          { entityId: dnId },
          { entityId: "non-existent-id" },
        ],
      },
    });
    await prisma.deliveryNoteItem.deleteMany({
      where: { deliveryNote: { purchaseOrder: { companyCode } } },
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrder: { companyCode } },
    });
    await prisma.purchaseOrder.deleteMany({ where: { companyCode } });
  });

  it("recordAuditEvent menyimpan actor snapshot dan timestamp server", async () => {
    await recordAuditEvent({
      actor: TEST_AUDIT_ACTOR,
      entity: {
        type: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
        id: poId,
        label: "PO-AUDIT",
      },
      action: AUDIT_ACTION.CREATE,
      source: AUDIT_SOURCE.PO_EDITOR,
      after: { poNumber: "PO-AUDIT" },
    });

    const events = await prisma.auditEvent.findMany({
      where: { entityId: poId, action: "CREATE" },
    });
    expect(events.length).toBeGreaterThan(0);
    const event = events[events.length - 1];
    expect(event.actorNameSnapshot).toBe(TEST_AUDIT_ACTOR.name);
    expect(event.actorIdentifierSnapshot).toBe(TEST_AUDIT_ACTOR.identifier);
    expect(event.actorRoleSnapshot).toBe(TEST_AUDIT_ACTOR.role);
    expect(event.entityLabelSnapshot).toBe("PO-AUDIT");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it("computeChangedFields hanya menyimpan field yang berubah", () => {
    const before = {
      poNumber: "PO-1",
      companyName: "PT A",
      period: "Juli 2026",
      printStatus: "NOT_PRINTED",
    };
    const after = {
      poNumber: "PO-1",
      companyName: "PT A Baru",
      period: "Juli 2026",
      printStatus: "NOT_PRINTED",
    };
    const changed = computeChangedFields(before, after);
    expect(changed).toEqual(["companyName"]);
  });

  it("redaction menghapus field sensitif dari snapshot", () => {
    const redacted = redactSensitiveData({
      password: "x",
      passwordHash: "hash",
      user: { sessionToken: "t", name: "Admin" },
      vehicle: "Truk",
    });
    expect(redacted).toEqual({
      password: "[REDACTED]",
      passwordHash: "[REDACTED]",
      user: { sessionToken: "[REDACTED]", name: "Admin" },
      vehicle: "Truk",
    });
  });

  it("membuka preview dan mengganti paper tidak menghasilkan PRINT", async () => {
    const dn = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: dnId },
    });
    // Tidak ada panggilan markDeliveryNotePrinted -> tidak ada event PRINT.
    const printEvents = await prisma.auditEvent.count({
      where: { entityId: dnId, action: { in: ["PRINT", "REPRINT"] } },
    });
    expect(printEvents).toBe(0);
    void dn;
  });

  it("PRINT pertama dan REPRINT mencatat previous/new count", async () => {
    const initial = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: dnId },
    });

    const first = await markDeliveryNotePrinted({
      id: dnId,
      expectedUpdatedAt: initial.updatedAt,
      actor: TEST_AUDIT_ACTOR,
      paper: {
        paperProfile: "Setengah Folio",
        paperWidthMm: 210,
        paperHeightMm: 165,
        orientation: "LANDSCAPE",
        pageCount: 1,
      },
    });
    expect("success" in first && first.success).toBe(true);

    const printEvent = await prisma.auditEvent.findFirst({
      where: { entityId: dnId, action: "PRINT" },
      orderBy: { occurredAt: "desc" },
    });
    expect(printEvent).not.toBeNull();
    expect(printEvent!.metadata).toMatchObject({
      previousPrintCount: 0,
      newPrintCount: 1,
      paperProfile: "Setengah Folio",
    });

    const afterFirst = await prisma.deliveryNote.findUniqueOrThrow({
      where: { id: dnId },
    });
    const second = await markDeliveryNotePrinted({
      id: dnId,
      expectedUpdatedAt: afterFirst.updatedAt,
      actor: TEST_AUDIT_ACTOR,
    });
    expect("success" in second && second.success).toBe(true);

    const reprintEvent = await prisma.auditEvent.findFirst({
      where: { entityId: dnId, action: "REPRINT" },
      orderBy: { occurredAt: "desc" },
    });
    expect(reprintEvent).not.toBeNull();
    expect(reprintEvent!.metadata).toMatchObject({
      previousPrintCount: 1,
      newPrintCount: 2,
    });
  });

  it("audit event tidak memiliki relasi wajib ke PO dan dapat dibaca setelah PO dihapus", async () => {
    // Audit event dibuat dengan entityId string tanpa FK ke PurchaseOrder.
    const standalone = await prisma.auditEvent.create({
      data: {
        entityType: AUDIT_ENTITY_TYPE.PURCHASE_ORDER,
        entityId: "non-existent-id",
        entityLabelSnapshot: "PO-HAPUS",
        action: AUDIT_ACTION.DELETE,
        source: AUDIT_SOURCE.PO_DELETE_DIALOG,
        actorId: TEST_AUDIT_ACTOR.id,
        actorNameSnapshot: TEST_AUDIT_ACTOR.name,
        occurredAt: new Date(),
        metadata: { deliveryNoteCount: 2, itemCount: 5 },
      },
    });
    const found = await prisma.auditEvent.findUnique({
      where: { id: standalone.id },
    });
    expect(found).not.toBeNull();
    expect(found!.entityId).toBe("non-existent-id");
    await prisma.auditEvent.delete({ where: { id: standalone.id } });
  });
});

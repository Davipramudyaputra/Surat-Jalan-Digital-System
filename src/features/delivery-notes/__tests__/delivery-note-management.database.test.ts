import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { TEST_AUDIT_ACTOR } from "@/features/audit/lib/test-actor";
import { getDeliveryNotes, getDeliveryNoteById } from "../queries";
import { updateDeliveryNote } from "../services";

describe("Phase 3 - Delivery Note Management", () => {
  // We need to seed data using the Phase 2 import pipeline to ensure realistic data.
  // We can use the sample excel file.
  let purchaseOrderId: string;
  let sampleDeliveryNoteId: string;
  const testPoNumber = `PO-TEST-${Date.now()}`;

  beforeAll(async () => {
    // Only run if RUN_DATABASE_TESTS is set
    if (!process.env.RUN_DATABASE_TESTS) return;

    // To make it simple for the test, we'll just query the existing data assuming the test DB is either seeded or we will seed it manually for this test block.
    // Let's create dummy data directly via Prisma since we just need to test search and update.
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: testPoNumber,
        normalizedPoNumber: testPoNumber,
        companyCode: "TEST-CO",
        companyName: "Test Company",
      }
    });
    purchaseOrderId = po.id;

    const timestamp = Date.now();
    const dn1 = await prisma.deliveryNote.create({
      data: {
        purchaseOrderId,
        uniqueCode: `DN-TEST-1-${timestamp}`,
        recipientCompanyName: "PT TEST PENERIMA",
        branchName: "Cianjur",
        originalBranchName: "Cianjur",
        normalizedBranchName: "cianjur",
        printStatus: "NOT_PRINTED",
        items: {
          create: [
            { originalProductName: "Item A", displayProductName: "Item A", normalizedProductName: "item a", sourceQuantity: 10, quantity: 10, sortOrder: 0 },
            { originalProductName: "Item B", displayProductName: "Item B", normalizedProductName: "item b", sourceQuantity: 5, quantity: 5, sortOrder: 1 },
          ]
        }
      }
    });
    sampleDeliveryNoteId = dn1.id;

    await prisma.deliveryNote.create({
      data: {
        purchaseOrderId,
        uniqueCode: `DN-TEST-2-${timestamp}`,
        recipientCompanyName: "PT TEST PENERIMA 2",
        branchName: "Bogor",
        originalBranchName: "Bogor",
        normalizedBranchName: "bogor",
        printStatus: "PRINTED",
        items: {
          create: [
            { originalProductName: "Item C", displayProductName: "Item C", normalizedProductName: "item c", sourceQuantity: 10, quantity: 10, sortOrder: 0 },
          ]
        }
      }
    });
  });

  afterAll(async () => {
    if (!process.env.RUN_DATABASE_TESTS) return;
    await prisma.deliveryNoteItem.deleteMany({
      where: { deliveryNote: { purchaseOrder: { companyCode: "TEST-CO" } } }
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrder: { companyCode: "TEST-CO" } }
    });
    await prisma.purchaseOrder.deleteMany({
      where: { companyCode: "TEST-CO" }
    });
  });

  describe("Search and Filter", () => {
    it("Search berdasarkan cabang (Cianjur)", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "Cianjur", status: "all", page: 1, limit: 10 });
      expect(res.data.length).toBeGreaterThanOrEqual(1);
      expect(res.data[0].branchName).toBe("Cianjur");
    });

    it("Search partial dan case insensitive (cianj)", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "cianj", status: "all", page: 1, limit: 10 });
      expect(res.data.length).toBeGreaterThanOrEqual(1);
      expect(res.data[0].branchName).toBe("Cianjur");
    });

    it("Search uniqueCode (DN-TEST-2)", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "DN-TEST-2", status: "all", page: 1, limit: 10 });
      expect(res.data.length).toBe(1);
      expect(res.data[0].uniqueCode).toContain("DN-TEST-2");
    });

    it("Filter NOT_PRINTED", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "", status: "not-printed", page: 1, limit: 10 });
      expect(res.data.every(d => d.printStatus === "NOT_PRINTED")).toBe(true);
    });

    it("Filter PRINTED", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "", status: "printed", page: 1, limit: 10 });
      expect(res.data.every(d => d.printStatus === "PRINTED")).toBe(true);
    });

    it("Search kosong menampilkan semua", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const res = await getDeliveryNotes({ q: "", status: "all", page: 1, limit: 10 });
      expect(res.meta.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Editing", () => {
    it("Update optional fields and items", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const dn = await getDeliveryNoteById(sampleDeliveryNoteId);
      expect(dn).toBeDefined();

      const res = await updateDeliveryNote({
        id: dn!.id,
        poNumber: dn!.purchaseOrder.poNumber,
        branchName: "Cianjur Updated",
        recipientCompanyName: "PT TEST PENERIMA",
        vehicleName: "Truk 1",
        updatedAt: dn!.updatedAt,
        items: [
          {
            id: dn!.items[0].id,
            displayProductName: "ITEM A UPDATED",
            quantity: "15",
            sortOrder: 0,
          }
        ]
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toBeUndefined();

      const updated = await getDeliveryNoteById(sampleDeliveryNoteId);
      expect(updated?.branchName).toBe("Cianjur Updated");
      expect(updated?.vehicleName).toBe("Truk 1");
      expect(updated?.items.length).toBe(1); // One item was deleted
      expect(updated?.items[0].displayProductName).toBe("ITEM A UPDATED");
      expect(Number(updated?.items[0].quantity)).toBe(15);
    });

    it("Duplicate product ditolak", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const dn = await getDeliveryNoteById(sampleDeliveryNoteId);

      const res = await updateDeliveryNote({
        id: dn!.id,
        poNumber: dn!.purchaseOrder.poNumber,
        branchName: "Cianjur Updated",
        recipientCompanyName: "PT TEST PENERIMA",
        updatedAt: dn!.updatedAt,
        items: [
          { displayProductName: "Same Item", quantity: "1", sortOrder: 0 },
          { displayProductName: "same item", quantity: "2", sortOrder: 1 },
        ]
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toContain("Barang dengan nama yang sama sudah tersedia");
    });

    it("Optimistic concurrency conflict ditolak", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const dn = await getDeliveryNoteById(sampleDeliveryNoteId);

      // Pass old date
      const oldDate = new Date(dn!.updatedAt.getTime() - 10000);

      const res = await updateDeliveryNote({
        id: dn!.id,
        poNumber: dn!.purchaseOrder.poNumber,
        branchName: "Cianjur Updated",
        recipientCompanyName: "PT TEST PENERIMA",
        updatedAt: oldDate,
        items: [
          { id: dn!.items[0].id, displayProductName: "Test", quantity: "1", sortOrder: 0 },
        ]
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toContain("diperbarui dari sesi lain");
    });

    it("Item milik surat jalan lain tidak dapat dimutasi", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const target = await getDeliveryNoteById(sampleDeliveryNoteId);
      const foreign = await prisma.deliveryNote.findFirstOrThrow({
        where: { purchaseOrderId, id: { not: sampleDeliveryNoteId } },
        include: { items: true },
      });
      const foreignName = foreign.items[0].displayProductName;

      const res = await updateDeliveryNote({
        id: target!.id,
        poNumber: target!.purchaseOrder.poNumber,
        branchName: target!.branchName,
        recipientCompanyName: target!.recipientCompanyName,
        updatedAt: target!.updatedAt,
        items: [
          {
            id: foreign.items[0].id,
            displayProductName: "MUTASI ILEGAL",
            quantity: "1",
            sortOrder: 0,
          },
        ],
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toContain("bukan milik surat jalan ini");
      const unchanged = await prisma.deliveryNoteItem.findUniqueOrThrow({
        where: { id: foreign.items[0].id },
      });
      expect(unchanged.displayProductName).toBe(foreignName);
    });

    it("Edit surat jalan tidak dapat mengubah nomor PO global", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      const target = await getDeliveryNoteById(sampleDeliveryNoteId);

      const res = await updateDeliveryNote({
        id: target!.id,
        poNumber: `${target!.purchaseOrder.poNumber}-DIUBAH`,
        branchName: target!.branchName,
        recipientCompanyName: target!.recipientCompanyName,
        updatedAt: target!.updatedAt,
        items: target!.items.map((item) => ({
          id: item.id,
          displayProductName: item.displayProductName,
          quantity: item.quantity.toString(),
          sortOrder: item.sortOrder,
        })),
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toContain("halaman Edit PO");
      const unchanged = await prisma.purchaseOrder.findUniqueOrThrow({
        where: { id: purchaseOrderId },
      });
      expect(unchanged.poNumber).toBe(testPoNumber);
    });

    it("Edit PRINTED mereset status menjadi NOT_PRINTED", async () => {
      if (!process.env.RUN_DATABASE_TESTS) return;
      // Use the DN-TEST-2 which is PRINTED
      const dn = await prisma.deliveryNote.findFirst({
        where: { uniqueCode: { contains: "DN-TEST-2" }, purchaseOrderId },
        include: { purchaseOrder: true, items: true }
      });

      expect(dn?.printStatus).toBe("PRINTED");

      const res = await updateDeliveryNote({
        id: dn!.id,
        poNumber: dn!.purchaseOrder.poNumber,
        branchName: dn!.branchName,
        recipientCompanyName: "PT BARU", // Change company to trigger reset
        updatedAt: dn!.updatedAt,
        items: [
          { id: dn!.items[0].id, displayProductName: "Item C", quantity: "10", sortOrder: 0 },
        ]
      }, TEST_AUDIT_ACTOR);

      expect(res.error).toBeUndefined();

      const updated = await getDeliveryNoteById(dn!.id);
      expect(updated?.printStatus).toBe("NOT_PRINTED");
    });
  });
});

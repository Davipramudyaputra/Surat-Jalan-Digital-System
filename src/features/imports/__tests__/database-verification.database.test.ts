import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const fixturePath = resolve(
  process.cwd(),
  "docs/sample-data/Lampiran PO Aneka Cetakan Cabang Periode Juli 2026.xls",
);
const fixtureBuffer = new Uint8Array(readFileSync(fixturePath));
const syntheticPoNumber = "PHASE2-REIMPORT-20260730/VII/2026";

function buildSyntheticWorkbook(
  rows: Array<Array<string | number | null>>,
): Uint8Array {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [`Lampiran PO SOF ${syntheticPoNumber}`],
    ["No", "Cabang", "Produk A", "Produk B", "Produk C"],
    ...rows,
    [null, "Grand Total", null, null, null],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Fleksibel");

  return new Uint8Array(
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    }),
  );
}

async function cleanupSyntheticFixture(prisma: PrismaClient): Promise<void> {
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      companyCode_normalizedPoNumber: {
        companyCode: "SOF",
        normalizedPoNumber: syntheticPoNumber,
      },
    },
  });

  if (purchaseOrder) {
    await prisma.deliveryNoteItem.deleteMany({
      where: {
        deliveryNote: { purchaseOrderId: purchaseOrder.id },
      },
    });
    await prisma.deliveryNote.deleteMany({
      where: { purchaseOrderId: purchaseOrder.id },
    });
    await prisma.purchaseOrder.delete({
      where: { id: purchaseOrder.id },
    });
  }

  await prisma.upload.deleteMany({
    where: {
      originalFileName: {
        startsWith: "phase-2-reimport-verification-",
      },
    },
  });
}

describe.runIf(runDatabaseTests)("database verification fixture", () => {
  it("meng-import secara atomic dan re-import identik tidak menggandakan data", async () => {
    await import("dotenv/config");
    const [{ processImportFile }, { prisma }] = await Promise.all([
      import("@/features/imports/services/process-import-file"),
      import("@/lib/prisma"),
    ]);
    const payload = {
      buffer: fixtureBuffer,
      name: "Lampiran PO Aneka Cetakan Cabang Periode Juli 2026.xls",
      size: fixtureBuffer.byteLength,
      type: "application/vnd.ms-excel",
    };
    const firstImport = await processImportFile(payload);

    expect(["IMPORTED", "DUPLICATE"]).toContain(firstImport.status);

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: {
        companyCode_normalizedPoNumber: {
          companyCode: "SOF",
          normalizedPoNumber: "678/PPU SOF CCM/VII/2026",
        },
      },
      include: {
        deliveryNotes: {
          include: { items: true },
        },
      },
    });

    expect(purchaseOrder).not.toBeNull();
    expect(purchaseOrder?.deliveryNotes).toHaveLength(92);
    expect(
      purchaseOrder?.deliveryNotes.reduce(
        (total, deliveryNote) => total + deliveryNote.items.length,
        0,
      ),
    ).toBe(462);

    const secondImport = await processImportFile(payload);
    expect(secondImport.status).toBe("DUPLICATE");

    const scopedPurchaseOrderCount = await prisma.purchaseOrder.count({
      where: {
        companyCode: "SOF",
        normalizedPoNumber: "678/PPU SOF CCM/VII/2026",
      },
    });
    const scopedDeliveryNoteCount = await prisma.deliveryNote.count({
      where: {
        purchaseOrder: {
          companyCode: "SOF",
          normalizedPoNumber: "678/PPU SOF CCM/VII/2026",
        },
      },
    });
    const scopedItemCount = await prisma.deliveryNoteItem.count({
      where: {
        deliveryNote: {
          purchaseOrder: {
            companyCode: "SOF",
            normalizedPoNumber: "678/PPU SOF CCM/VII/2026",
          },
        },
      },
    });

    expect(scopedPurchaseOrderCount).toBe(1);
    expect(scopedDeliveryNoteCount).toBe(92);
    expect(scopedItemCount).toBe(462);

    await prisma.$disconnect();
  }, 30_000);

  it("meng-update cabang berubah, menjaga status cabang unchanged, dan mempertahankan cabang absent", async () => {
    await import("dotenv/config");
    const [{ processImportFile }, { prisma }] = await Promise.all([
      import("@/features/imports/services/process-import-file"),
      import("@/lib/prisma"),
    ]);

    await cleanupSyntheticFixture(prisma);

    try {
      const firstBuffer = buildSyntheticWorkbook([
        [1, "Cianjur", 10, 2, null],
        [2, "Bandung", 5, null, null],
        [3, "Bogor", 7, null, null],
      ]);
      const firstImport = await processImportFile({
        buffer: firstBuffer,
        name: "phase-2-reimport-verification-a.xlsx",
        size: firstBuffer.byteLength,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      expect(firstImport.status).toBe("IMPORTED");

      const initialPurchaseOrder = await prisma.purchaseOrder.findUniqueOrThrow({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode: "SOF",
            normalizedPoNumber: syntheticPoNumber,
          },
        },
        include: { deliveryNotes: true },
      });
      const printAuditDate = new Date("2026-07-30T10:00:00.000Z");

      await prisma.deliveryNote.updateMany({
        where: { purchaseOrderId: initialPurchaseOrder.id },
        data: {
          firstPrintedAt: printAuditDate,
          lastPrintedAt: printAuditDate,
          printCount: 1,
          printStatus: "PRINTED",
        },
      });

      const secondBuffer = buildSyntheticWorkbook([
        [1, "Cianjur", 12, null, 3],
        [2, "Bogor", 7, null, null],
      ]);
      const secondImport = await processImportFile({
        buffer: secondBuffer,
        name: "phase-2-reimport-verification-b.xlsx",
        size: secondBuffer.byteLength,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      expect(secondImport.status).toBe("IMPORTED");
      expect(secondImport.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "ABSENT_BRANCH_PRESERVED" }),
        ]),
      );

      const updatedPurchaseOrder =
        await prisma.purchaseOrder.findUniqueOrThrow({
          where: {
            companyCode_normalizedPoNumber: {
              companyCode: "SOF",
              normalizedPoNumber: syntheticPoNumber,
            },
          },
          include: {
            deliveryNotes: {
              include: {
                items: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        });
      const cianjur = updatedPurchaseOrder.deliveryNotes.find(
        (deliveryNote) => deliveryNote.normalizedBranchName === "cianjur",
      );
      const bogor = updatedPurchaseOrder.deliveryNotes.find(
        (deliveryNote) => deliveryNote.normalizedBranchName === "bogor",
      );
      const bandung = updatedPurchaseOrder.deliveryNotes.find(
        (deliveryNote) => deliveryNote.normalizedBranchName === "bandung",
      );

      expect(updatedPurchaseOrder.deliveryNotes).toHaveLength(3);
      expect(cianjur?.printStatus).toBe("NOT_PRINTED");
      expect(cianjur?.firstPrintedAt).toEqual(printAuditDate);
      expect(cianjur?.printCount).toBe(1);
      expect(
        cianjur?.items.map((item) => [
          item.normalizedProductName,
          item.quantity.toString(),
        ]),
      ).toEqual([
        ["produk a", "12"],
        ["produk c", "3"],
      ]);
      expect(bogor?.printStatus).toBe("PRINTED");
      expect(bandung?.printStatus).toBe("PRINTED");
    } finally {
      await cleanupSyntheticFixture(prisma);
      await prisma.$disconnect();
    }
  }, 30_000);
});

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
      mode: "commit" as const,
    };
    const firstImport = await processImportFile(payload);

    expect(["IMPORTED", "DUPLICATE_ACTIVE", "REIMPORT_AFTER_DELETE"]).toContain(
      firstImport.status,
    );

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
    expect(secondImport.status).toBe("DUPLICATE_ACTIVE");

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
        mode: "commit",
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
        mode: "commit",
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

  it("preview tidak menulis data dan klasifikasi hash mendukung duplicate serta re-import setelah delete", async () => {
    await import("dotenv/config");
    const [{ processImportFile }, { prisma }] = await Promise.all([
      import("@/features/imports/services/process-import-file"),
      import("@/lib/prisma"),
    ]);

    await cleanupSyntheticFixture(prisma);

    try {
      const buffer = buildSyntheticWorkbook([
        [1, "Cianjur", 10, 2, null],
        [2, "Bogor", 5, null, null],
      ]);
      const fileName = "phase-2-reimport-verification-classification.xlsx";
      const basePayload = {
        buffer,
        name: fileName,
        size: buffer.byteLength,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      const uploadsBefore = await prisma.upload.count();

      const preview = await processImportFile({
        ...basePayload,
        mode: "preview",
      });
      expect(preview.status).toBe("NEW_FILE");
      expect(preview.classification).toBe("NEW_FILE");
      expect(await prisma.upload.count()).toBe(uploadsBefore);

      const committed = await processImportFile({
        ...basePayload,
        mode: "commit",
      });
      expect(committed.status).toBe("IMPORTED");
      expect(committed.databaseChanges).toMatchObject({
        purchaseOrdersCreated: 1,
        deliveryNotesCreated: 2,
      });

      const manuallyEditedItem = await prisma.deliveryNoteItem.findFirstOrThrow({
        where: {
          deliveryNote: {
            branchName: "Cianjur",
            purchaseOrder: { normalizedPoNumber: syntheticPoNumber },
          },
        },
      });
      await prisma.deliveryNoteItem.update({
        where: { id: manuallyEditedItem.id },
        data: {
          displayProductName: "Produk Manual",
          quantity: 99,
          isManuallyEdited: true,
        },
      });

      const renamedDuplicate = await processImportFile({
        ...basePayload,
        name: "phase-2-reimport-verification-renamed.xlsx",
        mode: "preview",
      });
      expect(renamedDuplicate.status).toBe("DUPLICATE_ACTIVE");
      expect(renamedDuplicate.classification).toBe("DIFFERENT_NAME_SAME_HASH");

      const revisionBuffer = buildSyntheticWorkbook([
        [1, "Cianjur", 11, 2, null],
        [2, "Bogor", 5, null, null],
      ]);
      const sameNameRevision = await processImportFile({
        ...basePayload,
        buffer: revisionBuffer,
        size: revisionBuffer.byteLength,
        mode: "preview",
      });
      expect(sameNameRevision.status).toBe("REVISION");
      expect(sameNameRevision.classification).toBe("SAME_NAME_DIFFERENT_HASH");

      const revisionCommit = await processImportFile({
        ...basePayload,
        buffer: revisionBuffer,
        size: revisionBuffer.byteLength,
        mode: "commit",
      });
      expect(revisionCommit.status).toBe("IMPORTED");
      const preservedManualItem = await prisma.deliveryNoteItem.findUniqueOrThrow({
        where: { id: manuallyEditedItem.id },
      });
      expect(preservedManualItem.displayProductName).toBe("Produk Manual");
      expect(preservedManualItem.quantity.toString()).toBe("99");

      const activePo = await prisma.purchaseOrder.findUniqueOrThrow({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode: "SOF",
            normalizedPoNumber: syntheticPoNumber,
          },
        },
      });
      await prisma.$transaction(async (tx) => {
        await tx.deliveryNoteItem.deleteMany({
          where: { deliveryNote: { purchaseOrderId: activePo.id } },
        });
        await tx.deliveryNote.deleteMany({
          where: { purchaseOrderId: activePo.id },
        });
        await tx.purchaseOrder.delete({ where: { id: activePo.id } });
      });

      const reimportPreview = await processImportFile({
        ...basePayload,
        mode: "preview",
      });
      expect(reimportPreview.status).toBe("REIMPORT_AFTER_DELETE");

      const reimported = await processImportFile({
        ...basePayload,
        mode: "commit",
      });
      expect(reimported.status).toBe("REIMPORT_AFTER_DELETE");
      expect(
        await prisma.purchaseOrder.count({
          where: {
            companyCode: "SOF",
            normalizedPoNumber: syntheticPoNumber,
          },
        }),
      ).toBe(1);
      expect(
        await prisma.deliveryNote.count({
          where: { purchaseOrder: { normalizedPoNumber: syntheticPoNumber } },
        }),
      ).toBe(2);
    } finally {
      await cleanupSyntheticFixture(prisma);
      await prisma.$disconnect();
    }
  }, 30_000);
});

import { describe, expect, it } from "vitest";

import { detectHeaderRow } from "@/features/imports/parser/detect-header-row";
import { transformMatrix } from "@/features/imports/parser/transform-matrix";
import { parsedImportSchema } from "@/features/imports/validation/parsed-import-schema";
import { makeWorksheet } from "@/features/imports/__tests__/fixtures";

describe("transformasi matrix", () => {
  it("mengubah baris cabang menjadi item dan melewati total/empty/zero/dash", () => {
    const sheet = makeWorksheet([
      ["PO SOF 101/ABC/VII/2026"],
      ["No", "Cabang", "Produk A", "Produk B"],
      [1, " Cianjur ", "1.000", "-"],
      [2, "Cabang Kosong", 0, null],
      [null, "Grand Total", 1000, 0],
    ]);
    const header = detectHeaderRow(
      sheet.headerCandidates,
      sheet.sheetName,
    );
    const result = transformMatrix(sheet, header);

    expect(result.errors).toEqual([]);
    expect(result.deliveryNotes).toEqual([
      {
        branchName: "Cianjur",
        items: [
          {
            displayProductName: "Produk A",
            normalizedProductName: "produk a",
            originalProductName: "Produk A",
            quantity: "1000",
            sortOrder: 0,
          },
        ],
        normalizedBranchName: "cianjur",
        originalBranchName: " Cianjur ",
      },
    ]);
    expect(result.skippedRows).toHaveLength(2);
  });

  it("menghasilkan critical error untuk quantity invalid", () => {
    const sheet = makeWorksheet([
      ["PO SOF 101/ABC/VII/2026"],
      ["No", "Cabang", "Produk A"],
      [1, "Cianjur", "invalid"],
      [2, "Bandung", 5],
    ]);
    const header = detectHeaderRow(
      sheet.headerCandidates,
      sheet.sheetName,
    );
    const result = transformMatrix(sheet, header);

    expect(result.errors).toMatchObject([
      { code: "INVALID_QUANTITY", row: 3 },
    ]);
  });
});

describe("validasi hasil parse", () => {
  const validResult = {
    companyCode: "SOF",
    companyName: "PT. SUMMIT OTO FINANCE",
    confidence: 100,
    deliveryNotes: [
      {
        branchName: "Cianjur",
        items: [
          {
            displayProductName: "Kartu Pembayaran",
            normalizedProductName: "kartu pembayaran",
            originalProductName: "Kartu Pembayaran",
            quantity: "1000",
            sortOrder: 0,
          },
        ],
        normalizedBranchName: "cianjur",
        originalBranchName: "Cianjur",
      },
    ],
    detectedSheet: "Data",
    diagnostics: {
      errors: [],
      headerRow: 3,
      skippedCells: [],
      skippedRows: [],
      warnings: [],
    },
    normalizedPoNumber: "101/ABC/VII/2026",
    period: "2026-07",
    poNumber: "101/ABC/VII/2026",
    summary: {
      deliveryNoteCount: 1,
      itemCount: 1,
      productColumnCount: 1,
    },
  };

  it("menerima hasil valid", () => {
    expect(parsedImportSchema.safeParse(validResult).success).toBe(true);
  });

  it("menolak duplicate branch dan quantity nol", () => {
    const invalidResult = {
      ...validResult,
      deliveryNotes: [
        validResult.deliveryNotes[0],
        {
          ...validResult.deliveryNotes[0],
          items: [
            {
              ...validResult.deliveryNotes[0].items[0],
              quantity: "0",
            },
          ],
        },
      ],
      summary: {
        ...validResult.summary,
        deliveryNoteCount: 2,
        itemCount: 2,
      },
    };

    expect(parsedImportSchema.safeParse(invalidResult).success).toBe(false);
  });
});

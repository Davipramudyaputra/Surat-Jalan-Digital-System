import { describe, expect, it } from "vitest";

import { calculateConfidence } from "@/features/imports/parser/calculate-confidence";
import { detectHeaderRow } from "@/features/imports/parser/detect-header-row";
import { extractPurchaseOrderMetadata } from "@/features/imports/parser/extract-po-metadata";
import { findCandidateSheets } from "@/features/imports/parser/find-candidate-sheets";
import { isSummaryRow } from "@/features/imports/parser/is-summary-row";
import {
  makeInspection,
  makeWorksheet,
} from "@/features/imports/__tests__/fixtures";

describe("deteksi struktur adaptif", () => {
  it("mendeteksi sheet, header berpindah, kolom cabang berpindah, dan produk bertambah", () => {
    const hiddenInvalid = makeWorksheet(
      [
        ["Catatan internal"],
        ["Tidak ada struktur data"],
      ],
      { name: "Sheet Pertama", visibility: "hidden" },
    );
    const dynamicSheet = makeWorksheet(
      [
        ["Lampiran PO SOF 999/PPU SOF CCM/VIII/2026"],
        [],
        [],
        ["Produk Awal", "Nomor", "Nama Cabang", "Produk Tambahan"],
        [10, 1, "Cianjur", 5],
        [],
        [null, null, "Grand Total", 15],
      ],
      {
        name: "Nama Sheet Berbeda",
        originColumnIndex: 2,
        originRowIndex: 4,
      },
    );
    const selected = findCandidateSheets(
      makeInspection([hiddenInvalid, dynamicSheet]),
    );

    expect(selected.worksheet.sheetName).toBe("Nama Sheet Berbeda");
    expect(selected.header.headerRowIndex).toBe(3);
    expect(selected.header.branchColumnIndex).toBe(2);
    expect(selected.header.productColumns).toHaveLength(2);
  });

  it("menolak header ambigu", () => {
    const sheet = makeWorksheet([
      ["PO SOF 100/ABC/VII/2026"],
      ["No", "Cabang", "Produk A"],
      [1, "Cabang A", 5],
      [],
      ["No", "Cabang", "Produk A"],
      [2, "Cabang B", 7],
    ]);

    expect(() =>
      detectHeaderRow(sheet.headerCandidates, sheet.sheetName),
    ).toThrow(/ambigu/iu);
  });

  it("menolak kandidat sheet yang imbang", () => {
    const first = makeWorksheet(
      [
        ["PO SOF 100/ABC/VII/2026"],
        ["No", "Cabang", "Produk A"],
        [1, "Cabang A", 5],
      ],
      { name: "Kandidat A" },
    );
    const second = makeWorksheet(
      [
        ["PO SOF 100/ABC/VII/2026"],
        ["No", "Cabang", "Produk A"],
        [1, "Cabang A", 5],
      ],
      { name: "Kandidat B" },
    );

    expect(() => findCandidateSheets(makeInspection([first, second]))).toThrow(
      /ambigu/iu,
    );
  });
});

describe("metadata, summary marker, dan confidence", () => {
  it("mengekstrak metadata PO dan periode dari area sebelum header", () => {
    const sheet = makeWorksheet([
      ["Lampiran PO SOF 678/PPU SOF CCM/VII/2026"],
      ["No", "Cabang", "Kartu Pembayaran"],
      [1, "Cianjur", 1000],
    ]);
    const header = detectHeaderRow(
      sheet.headerCandidates,
      sheet.sheetName,
    );

    expect(extractPurchaseOrderMetadata(sheet, header)).toMatchObject({
      companyCode: "SOF",
      companyName: "PT. SUMMIT OTO FINANCE",
      normalizedPoNumber: "678/PPU SOF CCM/VII/2026",
      period: "2026-07",
      poNumber: "678/PPU SOF CCM/VII/2026",
    });
  });

  it.each(["Total", "GRAND TOTAL", "Subtotal Cabang", "Jumlah keseluruhan"])(
    "mengenali row ringkasan %s",
    (value) => {
      expect(isSummaryRow(value)).toBe(true);
    },
  );

  it("menghasilkan confidence eksplisit 0 sampai 100", () => {
    expect(
      calculateConfidence({
        branchHeaderFound: true,
        dataRowCount: 92,
        poNumberFound: true,
        productColumnCount: 15,
        quantityErrorCount: 0,
        quantityValueCount: 462,
        rowConsistency: 1,
      }),
    ).toBe(100);
  });
});

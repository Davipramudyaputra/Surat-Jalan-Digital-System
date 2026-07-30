import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { parseWorkbookBuffer } from "@/features/imports/parser/parse-workbook";

const fixturePath = resolve(
  process.cwd(),
  "docs/sample-data/Lampiran PO Aneka Cetakan Cabang Periode Juli 2026.xls",
);

describe("acceptance fixture PO Juli 2026", () => {
  it("menghasilkan metadata, 92 surat jalan, dan 462 item", () => {
    const parsed = parseWorkbookBuffer(
      new Uint8Array(readFileSync(fixturePath)),
    );

    expect(parsed.companyCode).toBe("SOF");
    expect(parsed.companyName).toBe("PT. SUMMIT OTO FINANCE");
    expect(parsed.poNumber).toBe("678/PPU SOF CCM/VII/2026");
    expect(parsed.period).toBe("2026-07");
    expect(parsed.detectedSheet).toBe("Lampiran PO");
    expect(parsed.diagnostics.headerRow).toBe(3);
    expect(parsed.confidence).toBeGreaterThanOrEqual(75);
    expect(parsed.summary.deliveryNoteCount).toBe(92);
    expect(parsed.summary.itemCount).toBe(462);
  });

  it("menghasilkan tepat tiga item Cianjur dengan quantity dan display benar", () => {
    const parsed = parseWorkbookBuffer(
      new Uint8Array(readFileSync(fixturePath)),
    );
    const cianjur = parsed.deliveryNotes.find(
      (deliveryNote) => deliveryNote.normalizedBranchName === "cianjur",
    );

    expect(cianjur?.items).toEqual([
      {
        displayProductName: "Kartu Pembayaran",
        normalizedProductName: "kartu pembayaran",
        originalProductName: "Kartu Pembayaran",
        quantity: "1000",
        sortOrder: 1,
      },
      {
        displayProductName: "Kop Surat SOF (HVS)",
        normalizedProductName: "kop surat sof(hvs)",
        originalProductName: "Kop Surat SOF (HVS)",
        quantity: "5",
        sortOrder: 3,
      },
      {
        displayProductName: "Stiker Label Kendaraan Tarikan",
        normalizedProductName:
          "stiker label kendaraan tarikan(inventory)",
        originalProductName:
          "Stiker Label Kendaraan Tarikan ( Inventory )",
        quantity: "500",
        sortOrder: 10,
      },
    ]);
  });

  it("membaca variasi workbook XLSX tanpa nama sheet atau posisi header tetap", () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["PO SOF 700/PPU SOF CCM/VIII/2026"],
      [],
      [],
      ["Produk A", "Nama Cabang", "Nomor", "Produk B"],
      [10, "Cianjur", 1, 5],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Worksheet Baru");
    const buffer = new Uint8Array(
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      }),
    );
    const parsed = parseWorkbookBuffer(buffer);

    expect(parsed.detectedSheet).toBe("Worksheet Baru");
    expect(parsed.diagnostics.headerRow).toBe(4);
    expect(parsed.summary.deliveryNoteCount).toBe(1);
    expect(parsed.summary.itemCount).toBe(2);
  });
});

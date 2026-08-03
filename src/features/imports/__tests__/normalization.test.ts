import { describe, expect, it } from "vitest";

import { formatProductDisplayName } from "@/features/imports/normalization/format-product-display-name";
import { normalizeBranchName } from "@/features/imports/normalization/normalize-branch-name";
import { normalizePoNumber } from "@/features/imports/normalization/normalize-po-number";
import { normalizeProductName } from "@/features/imports/normalization/normalize-product-name";
import { normalizeQuantity } from "@/features/imports/normalization/normalize-quantity";

describe("normalizeQuantity", () => {
  it.each([
    [1000, { kind: "valid", value: "1000" }],
    ["1000", { kind: "valid", value: "1000" }],
    ["1.000", { kind: "valid", value: "1000" }],
    ["1,000", { kind: "valid", value: "1000" }],
    ["1.234,50", { kind: "valid", value: "1234.5" }],
    ["1,234.50", { kind: "valid", value: "1234.5" }],
    ["", { kind: "skip", reason: "empty" }],
    ["   ", { kind: "skip", reason: "empty" }],
    ["-", { kind: "skip", reason: "dash" }],
    [0, { kind: "skip", reason: "zero" }],
    ["0", { kind: "skip", reason: "zero" }],
  ])("menormalisasi %j tanpa kehilangan nilai", (input, expected) => {
    expect(normalizeQuantity(input)).toEqual(expected);
  });

  it("menolak nilai negatif", () => {
    expect(normalizeQuantity(-1)).toMatchObject({
      code: "NEGATIVE_QUANTITY",
      kind: "error",
    });
  });

  it("menolak teks non-angka", () => {
    expect(normalizeQuantity("seribu")).toMatchObject({
      code: "INVALID_QUANTITY",
      kind: "error",
    });
  });

  it("menggunakan cached result formula dan menolak formula tanpa hasil", () => {
    expect(
      normalizeQuantity({
        address: "C8",
        formula: "SUM(C2:C7)",
        type: "n",
        value: 25,
      }),
    ).toEqual({ kind: "valid", value: "25" });
    expect(
      normalizeQuantity({
        address: "C8",
        formula: "SUM(C2:C7)",
        value: null,
      }),
    ).toMatchObject({
      code: "FORMULA_RESULT_MISSING",
      kind: "error",
    });
  });
});

describe("normalisasi identitas dan nama tampilan", () => {
  it("merapikan cabang tanpa menghilangkan nilai asli", () => {
    expect(normalizeBranchName("  ST   Berau  ")).toEqual({
      branchName: "ST Berau",
      normalizedBranchName: "st berau",
      originalBranchName: "  ST   Berau  ",
    });
  });

  it("menormalisasi nomor PO secara deterministik", () => {
    expect(normalizePoNumber(" 678 / ppu  sof / VII / 2026 ")).toBe(
      "678/PPU SOF/VII/2026",
    );
  });

  it("menormalisasi nama produk untuk identifikasi", () => {
    expect(normalizeProductName(" Kop  Surat SOF ( HVS ) ")).toBe(
      "kop surat sof(hvs)",
    );
  });

  it("menggunakan exact display mapping tanpa menghapus kurung generik", () => {
    expect(
      formatProductDisplayName(
        "Stiker Label Kendaraan Tarikan ( Inventory )",
      ),
    ).toBe("Stiker Label Kendaraan Tarikan");
    expect(formatProductDisplayName("Kop Surat sof ( hvs )")).toBe(
      "Kop Surat SOF (HVS)",
    );
  });

  it("mengubah teks uppercase menjadi title case dan menjaga acronym", () => {
    expect(formatProductDisplayName("KOP SURAT SOF (HVS)")).toBe(
      "Kop Surat SOF (HVS)",
    );
  });
});

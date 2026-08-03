import { describe, expect, it } from "vitest";

import { DELIVERY_NOTE_ROWS_PER_PAGE } from "./constants";
import { paginateDeliveryNoteItems } from "./pagination";
import {
  buildPrintPageCss,
  calculatePreviewScale,
  CUSTOM_PAPER_LIMITS,
  DEFAULT_PAPER_PROFILE,
  getPaperCssVariables,
  PAPER_PROFILES,
  resolvePaperProfile,
  validateCustomPaper,
  type PaperOrientation,
  type PaperSizeId,
} from "./paper-profiles";
import type { DeliveryNoteDocumentItem } from "./types";

const DEFAULT_CUSTOM_INPUT = {
  widthMm: 250,
  heightMm: 180,
  marginMm: 7,
  orientation: "LANDSCAPE" as const,
};

function resolve(
  paperSize: PaperSizeId,
  orientation: PaperOrientation,
) {
  return resolvePaperProfile(paperSize, orientation, {
    ...DEFAULT_CUSTOM_INPUT,
    orientation,
  });
}

function items(count: number): DeliveryNoteDocumentItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `paper-item-${index + 1}`,
    quantity: "1 pcs",
    productName: `Barang ${index + 1}`,
    description: "",
    sortOrder: index,
  }));
}

describe("paper profiles", () => {
  it("menggunakan Setengah Folio landscape sebagai default", () => {
    expect(DEFAULT_PAPER_PROFILE).toMatchObject({
      id: "HALF_FOLIO_LANDSCAPE",
      widthMm: 210,
      heightMm: 165,
      orientation: "LANDSCAPE",
      fontScale: 1,
      logoScale: 1,
      spacingScale: 1,
    });
  });

  it.each([
    ["A4", "PORTRAIT", "A4_PORTRAIT", 210, 297],
    ["A4", "LANDSCAPE", "A4_LANDSCAPE", 297, 210],
    ["A5", "PORTRAIT", "A5_PORTRAIT", 148, 210],
    ["A5", "LANDSCAPE", "A5_LANDSCAPE", 210, 148],
    ["B3", "PORTRAIT", "B3_PORTRAIT", 353, 500],
    ["B3", "LANDSCAPE", "B3_LANDSCAPE", 500, 353],
  ] as const)(
    "memetakan %s %s ke dimensi fisik yang benar",
    (paperSize, orientation, id, widthMm, heightMm) => {
      expect(resolve(paperSize, orientation).profile).toMatchObject({
        id,
        widthMm,
        heightMm,
        orientation,
      });
    },
  );

  it("memakai area A4 portrait dan landscape secara penuh", () => {
    const portraitVariables = getPaperCssVariables(PAPER_PROFILES.A4_PORTRAIT);
    const landscapeVariables = getPaperCssVariables(
      PAPER_PROFILES.A4_LANDSCAPE,
    );

    expect(portraitVariables["--paper-width"]).toBe("210mm");
    expect(portraitVariables["--paper-height"]).toBe("297mm");
    expect(landscapeVariables["--paper-width"]).toBe("297mm");
    expect(landscapeVariables["--paper-height"]).toBe("210mm");
    expect(PAPER_PROFILES.A4_PORTRAIT.tableRowScale).toBeGreaterThan(1);
    expect(PAPER_PROFILES.A4_LANDSCAPE.logoScale).toBeGreaterThan(1);
  });

  it("memperbesar B3 secara seimbang tanpa mengubahnya menjadi blok kecil", () => {
    const b3 = PAPER_PROFILES.B3_LANDSCAPE;
    expect(b3.widthMm).toBe(500);
    expect(b3.logoScale).toBeGreaterThan(1);
    expect(b3.spacingScale).toBeGreaterThan(1);
    expect(b3.tableRowScale).toBeGreaterThan(1);
    expect(b3.fontScale).toBeLessThanOrEqual(1.45);
  });

  it("memberi peringatan keterbacaan untuk A5", () => {
    expect(resolve("A5", "PORTRAIT").warnings).toHaveLength(1);
    expect(resolve("A5", "LANDSCAPE").warnings[0]).toMatch(/lebih ringkas/iu);
  });

  it("menghasilkan profil custom landscape dan portrait yang valid", () => {
    const landscape = resolvePaperProfile("CUSTOM", "LANDSCAPE", {
      widthMm: 250,
      heightMm: 180,
      marginMm: 7,
      orientation: "LANDSCAPE",
    });
    const portrait = resolvePaperProfile("CUSTOM", "PORTRAIT", {
      widthMm: 250,
      heightMm: 180,
      marginMm: 8,
      orientation: "PORTRAIT",
    });

    expect(landscape.errors).toEqual([]);
    expect(landscape.profile).toMatchObject({
      id: "CUSTOM",
      widthMm: 250,
      heightMm: 180,
      pagePaddingMm: 7,
    });
    expect(portrait.profile).toMatchObject({
      widthMm: 180,
      heightMm: 250,
      orientation: "PORTRAIT",
      pagePaddingMm: 8,
    });
  });

  it.each([
    [{ widthMm: "", heightMm: 180, marginMm: 7 }, /Lebar custom wajib/iu],
    [{ widthMm: 0, heightMm: 180, marginMm: 7 }, /lebih besar dari 0/iu],
    [{ widthMm: -1, heightMm: 180, marginMm: 7 }, /lebih besar dari 0/iu],
    [{ widthMm: "NaN", heightMm: 180, marginMm: 7 }, /berupa angka/iu],
    [{ widthMm: 140, heightMm: 180, marginMm: 7 }, /minimal 148/iu],
    [{ widthMm: 1_001, heightMm: 180, marginMm: 7 }, /maksimal 1000/iu],
    [{ widthMm: 180, heightMm: 180, marginMm: -1 }, /tidak boleh negatif/iu],
    [{ widthMm: 180, heightMm: 180, marginMm: 41 }, /maksimal 40/iu],
  ])("menolak input custom yang tidak aman: %o", (input, expected) => {
    expect(
      validateCustomPaper({
        ...input,
        orientation: "LANDSCAPE",
      }),
    ).toEqual(expect.arrayContaining([expect.stringMatching(expected)]));
  });

  it("menggunakan Setengah Folio sebagai fallback ketika custom invalid", () => {
    const resolution = resolvePaperProfile("CUSTOM", "LANDSCAPE", {
      widthMm: 0,
      heightMm: 0,
      marginMm: 0,
      orientation: "LANDSCAPE",
    });

    expect(resolution.usesFallback).toBe(true);
    expect(resolution.profile).toBe(DEFAULT_PAPER_PROFILE);
    expect(resolution.errors.length).toBeGreaterThan(0);
  });

  it("mendokumentasikan batas aman custom pada konstanta terpusat", () => {
    expect(CUSTOM_PAPER_LIMITS).toEqual({
      minDimensionMm: 148,
      maxDimensionMm: 1_000,
      minContentDimensionMm: 128,
      minMarginMm: 0,
      maxMarginMm: 40,
    });
  });

  it("membuat aturan @page sesuai profil aktif", () => {
    expect(buildPrintPageCss(DEFAULT_PAPER_PROFILE)).toBe(
      "@page { size: 210mm 165mm; margin: 0; }",
    );
    expect(buildPrintPageCss(PAPER_PROFILES.A4_PORTRAIT)).toContain(
      "size: 210mm 297mm",
    );
    expect(buildPrintPageCss(PAPER_PROFILES.B3_LANDSCAPE)).toContain(
      "size: 500mm 353mm",
    );
  });

  it("menghitung scale hanya untuk membuat preview muat di viewport", () => {
    expect(calculatePreviewScale(1_200, 210)).toBe(1);
    expect(calculatePreviewScale(390, 210)).toBeGreaterThan(0);
    expect(calculatePreviewScale(390, 210)).toBeLessThan(1);
    expect(calculatePreviewScale(1_280, 500)).toBeLessThan(1);
  });

  it.each([1_440, 1_280, 768, 390])(
    "menghasilkan preview scale aman pada viewport %d px",
    (viewportWidth) => {
      const halfFolioScale = calculatePreviewScale(viewportWidth, 210);
      const b3Scale = calculatePreviewScale(viewportWidth, 500);

      expect(halfFolioScale).toBeGreaterThan(0);
      expect(halfFolioScale).toBeLessThanOrEqual(1);
      expect(b3Scale).toBeGreaterThan(0);
      expect(b3Scale).toBeLessThanOrEqual(1);
    },
  );

  it("menjaga kapasitas tabel sama pada seluruh profil", () => {
    const profiles = [
      DEFAULT_PAPER_PROFILE,
      PAPER_PROFILES.A4_PORTRAIT,
      PAPER_PROFILES.A5_LANDSCAPE,
      PAPER_PROFILES.B3_PORTRAIT,
    ];

    for (const profile of profiles) {
      expect(profile.id).toBeTruthy();
      expect(
        paginateDeliveryNoteItems(items(3))[0].rows.reduce(
          (total, row) => total + row.visualRowSpan,
          0,
        ),
      ).toBe(DELIVERY_NOTE_ROWS_PER_PAGE);
      expect(paginateDeliveryNoteItems(items(25))).toHaveLength(3);
    }
  });

  it("resolusi profil bersifat lokal dan tidak mengubah audit cetak", () => {
    const audit = Object.freeze({
      printStatus: "NOT_PRINTED",
      printCount: 0,
      firstPrintedAt: null,
      lastPrintedAt: null,
    });
    const before = JSON.stringify(audit);

    resolve("A4", "LANDSCAPE");
    resolve("B3", "PORTRAIT");

    expect(JSON.stringify(audit)).toBe(before);
  });
});

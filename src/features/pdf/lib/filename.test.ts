import { describe, expect, it } from "vitest";

import { buildPdfFilename } from "./filename";

describe("buildPdfFilename", () => {
  it("menghasilkan format Surat-Jalan_<PO>_<Cabang>.pdf", () => {
    expect(buildPdfFilename("678/PPU SOF CCM/VII/2026", "Bandar Jaya")).toBe(
      "Surat-Jalan_678-PPU-SOF-CCM-VII-2026_Bandar-Jaya.pdf",
    );
  });

  it("menyantasi karakter terlarang", () => {
    expect(buildPdfFilename('PO:1*?<>|\\"', "Cianjur/Utara")).toBe(
      "Surat-Jalan_PO-1_Cianjur-Utara.pdf",
    );
  });

  it("mengganti spasi dan menormalisasi separator berulang", () => {
    expect(buildPdfFilename("PO  1", "Cianjur  Utara")).toBe(
      "Surat-Jalan_PO-1_Cianjur-Utara.pdf",
    );
  });

  it("menghapus titik/spasi di akhir segment", () => {
    expect(buildPdfFilename("PO 1. ", "Cianjur ")).toBe(
      "Surat-Jalan_PO-1_Cianjur.pdf",
    );
  });

  it("menggunakan fallback untuk cabang kosong", () => {
    expect(buildPdfFilename("PO 1", "")).toBe("Surat-Jalan_PO-1_Cabang.pdf");
  });

  it("menggunakan fallback untuk PO kosong", () => {
    expect(buildPdfFilename("", "Cianjur")).toBe("Surat-Jalan_PO_Cianjur.pdf");
  });

  it("membatasi panjang filename", () => {
    const longPo = "X".repeat(200);
    const longBranch = "Y".repeat(200);
    const name = buildPdfFilename(longPo, longBranch);
    expect(name.length).toBeLessThanOrEqual(124);
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("menangani nama reserved Windows", () => {
    // Segment pertama tidak pernah jadi CON/PRN, tapi pastikan aman.
    const name = buildPdfFilename("CON", "PRN");
    expect(name).toBe("Surat-Jalan_CON_PRN.pdf");
  });

  it("selalu berakhir dengan .pdf tepat satu kali", () => {
    const name = buildPdfFilename("PO 1.pdf", "Cianjur");
    expect(name.endsWith(".pdf")).toBe(true);
    expect(name.endsWith(".pdf.pdf")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  formatBandungDate,
  formatBusinessDate,
  formatIndonesiaPrintDate,
  formatQuantity,
  getBusinessDatePrintParts,
  getIndonesiaPrintDateParts,
} from "./formatter";

describe("delivery note formatter", () => {
  it("memformat business date tanpa pergeseran timezone", () => {
    expect(formatBusinessDate("2026-08-02")).toBe("2 Agustus 2026");
    expect(formatBusinessDate(new Date("2026-08-02T00:00:00.000Z"))).toBe(
      "2 Agustus 2026",
    );
  });

  it("menghasilkan garis Bandung untuk tanggal kosong atau invalid", () => {
    expect(formatBandungDate(null)).toBe("Bandung, ____________________");
    expect(formatBandungDate("invalid")).toBe(
      "Bandung, ____________________",
    );
  });

  it("menggunakan tanggal kalender Indonesia untuk waktu cetak", () => {
    expect(
      formatIndonesiaPrintDate(new Date("2026-08-02T16:59:59.000Z")),
    ).toBe("Bandung, 2 Agustus 2026");
    expect(
      formatIndonesiaPrintDate(new Date("2026-08-02T17:00:00.000Z")),
    ).toBe("Bandung, 3 Agustus 2026");
    expect(
      getIndonesiaPrintDateParts(new Date("2026-08-02T17:00:00.000Z")),
    ).toEqual({
      dayMonth: "3 Agustus",
      century: "20",
      yearSuffix: "26",
      label: "Bandung, 3 Agustus 2026",
    });
  });

  it("memecah tanggal pilihan tanpa menggeser tanggal kalender", () => {
    expect(getBusinessDatePrintParts("2026-08-21")).toEqual({
      dayMonth: "21 Agustus",
      century: "20",
      yearSuffix: "26",
      label: "Bandung, 21 Agustus 2026",
    });
    expect(getBusinessDatePrintParts(null)).toBeNull();
  });

  it("menggabungkan quantity dan unit tanpa mengubah nilainya", () => {
    expect(formatQuantity("1000.000", "pcs")).toBe("1000 pcs");
    expect(formatQuantity("2.500", "rim")).toBe("2.5 rim");
  });

  it("tidak menambahkan unit atau teks rusak ketika kosong", () => {
    expect(formatQuantity("5", null)).toBe("5");
    expect(formatQuantity(Number.NaN, "pcs")).toBe("");
  });
});

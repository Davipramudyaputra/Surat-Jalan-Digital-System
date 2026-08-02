import { describe, expect, it } from "vitest";

import { calculatePOStats } from "./stats";

describe("calculatePOStats", () => {
  it("menghasilkan status Kosong dan progress 0 ketika belum ada surat jalan", () => {
    expect(calculatePOStats(0, 0, 0)).toEqual({
      totalCount: 0,
      totalItemCount: 0,
      printedCount: 0,
      notPrintedCount: 0,
      printedPercentage: 0,
      notPrintedPercentage: 0,
      status: "Kosong",
    });
  });

  it("membedakan Belum Dimulai, Dalam Proses, dan Selesai", () => {
    expect(calculatePOStats(4, 0).status).toBe("Belum Dimulai");
    expect(calculatePOStats(4, 1).status).toBe("Dalam Proses");
    expect(calculatePOStats(4, 4).status).toBe("Selesai");
  });

  it("menghitung printed dan not printed secara konsisten", () => {
    expect(calculatePOStats(4, 1, 12)).toMatchObject({
      totalItemCount: 12,
      printedCount: 1,
      notPrintedCount: 3,
      printedPercentage: 25,
      notPrintedPercentage: 75,
    });
  });
});

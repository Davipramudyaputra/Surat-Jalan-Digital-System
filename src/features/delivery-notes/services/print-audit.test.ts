import { describe, expect, it } from "vitest";

import { calculateNextPrintAudit } from "./print-audit";

describe("calculateNextPrintAudit", () => {
  it("mengisi audit cetak pertama", () => {
    const serverTime = new Date("2026-08-02T03:00:00.000Z");
    expect(
      calculateNextPrintAudit(
        { firstPrintedAt: null, printCount: 0 },
        serverTime,
      ),
    ).toEqual({
      printStatus: "PRINTED",
      firstPrintedAt: serverTime,
      lastPrintedAt: serverTime,
      printCount: 1,
    });
  });

  it("mempertahankan firstPrintedAt dan menambah audit cetak ulang", () => {
    const firstPrintedAt = new Date("2026-08-01T03:00:00.000Z");
    const serverTime = new Date("2026-08-02T03:00:00.000Z");
    expect(
      calculateNextPrintAudit({ firstPrintedAt, printCount: 2 }, serverTime),
    ).toEqual({
      printStatus: "PRINTED",
      firstPrintedAt,
      lastPrintedAt: serverTime,
      printCount: 3,
    });
  });
});

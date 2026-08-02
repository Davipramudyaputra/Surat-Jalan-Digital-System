import { describe, expect, it } from "vitest";

import { canDeletePurchaseOrder } from "./delete-policy";

describe("canDeletePurchaseOrder", () => {
  it("mengizinkan PO ketika seluruh surat jalan sudah dicetak", () => {
    expect(
      canDeletePurchaseOrder({
        totalCount: 92,
        printedCount: 92,
        notPrintedCount: 0,
      }),
    ).toBe(true);
  });

  it("menolak PO ketika masih ada surat jalan yang belum dicetak", () => {
    expect(
      canDeletePurchaseOrder({
        totalCount: 92,
        printedCount: 91,
        notPrintedCount: 1,
      }),
    ).toBe(false);
  });

  it("menolak ringkasan status cetak yang tidak konsisten", () => {
    expect(
      canDeletePurchaseOrder({
        totalCount: 92,
        printedCount: 91,
        notPrintedCount: 0,
      }),
    ).toBe(false);
  });

  it("mengizinkan PO kosong", () => {
    expect(
      canDeletePurchaseOrder({
        totalCount: 0,
        printedCount: 0,
        notPrintedCount: 0,
      }),
    ).toBe(true);
  });
});

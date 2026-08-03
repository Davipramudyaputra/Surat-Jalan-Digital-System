import { describe, expect, it } from "vitest";

import { canSubmitDeleteConfirmation } from "./delete-confirmation";

const baseState = {
  confirmationText: "678/PPU SOF CCM/VII/2026",
  isAcknowledged: true,
  isPending: false,
  notPrintedCount: 92,
  poNumber: "678/PPU SOF CCM/VII/2026",
};

describe("canSubmitDeleteConfirmation", () => {
  it("mengizinkan konfirmasi meskipun masih ada surat jalan belum dicetak", () => {
    expect(canSubmitDeleteConfirmation(baseState)).toBe(true);
  });

  it("menolak ketika acknowledgment belum dicentang", () => {
    expect(
      canSubmitDeleteConfirmation({
        ...baseState,
        isAcknowledged: false,
      }),
    ).toBe(false);
  });

  it("menolak ketika nomor PO tidak cocok persis", () => {
    expect(
      canSubmitDeleteConfirmation({
        ...baseState,
        confirmationText: "678/PPU SOF CCM/VII/2026 ",
      }),
    ).toBe(false);
  });

  it("menolak submit ganda ketika action sedang berjalan", () => {
    expect(
      canSubmitDeleteConfirmation({
        ...baseState,
        isPending: true,
      }),
    ).toBe(false);
  });
});

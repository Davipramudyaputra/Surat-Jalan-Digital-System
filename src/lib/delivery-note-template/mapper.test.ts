import { describe, expect, it } from "vitest";

import { mapDeliveryNoteToDocument } from "./mapper";
import type { DeliveryNoteTemplateSource } from "./types";

function source(): DeliveryNoteTemplateSource {
  return {
    id: "dn-cianjur",
    purchaseOrderId: "po-sof",
    uniqueCode: "SOF-CIANJUR",
    documentNumber: "SJ-001",
    documentDate: "2026-08-02",
    recipientCompanyName: "PT. SUMMIT OTO FINANCE",
    branchName: "Cianjur",
    vehicleName: null,
    vehicleNumber: null,
    additionalPoNumber: null,
    recipientName: null,
    updatedAt: new Date("2026-08-02T01:00:00.000Z"),
    purchaseOrder: {
      companyCode: "SOF",
      poNumber: "678/PPU SOF CCM/VII/2026",
    },
    items: [
      {
        id: "item-2",
        quantity: { toString: () => "5" },
        unit: null,
        displayProductName: "Kop Surat SOF (HVS)",
        originalProductName: "Kop Surat SOF (HVS) ORIGINAL",
        description: null,
        sortOrder: 3,
      },
      {
        id: "item-1",
        quantity: { toString: () => "1000" },
        unit: "pcs",
        displayProductName: "Kartu Pembayaran",
        originalProductName: "Kartu Pembayaran ORIGINAL",
        description: "",
        sortOrder: 1,
      },
    ],
  };
}

describe("mapDeliveryNoteToDocument", () => {
  it("memetakan identitas PO, perusahaan, cabang, dan surat jalan", () => {
    const mapped = mapDeliveryNoteToDocument(source());
    expect(mapped).toMatchObject({
      poNumber: "678/PPU SOF CCM/VII/2026",
      companyCode: "SOF",
      recipientCompanyName: "PT. SUMMIT OTO FINANCE",
      branchName: "Cianjur",
      documentNumber: "SJ-001",
      documentDate: "2026-08-02",
    });
  });

  it("mempertahankan tanggal pilihan dan mode realtime", () => {
    expect(mapDeliveryNoteToDocument(source()).documentDate).toBe(
      "2026-08-02",
    );

    const realtimeSource = source();
    realtimeSource.documentDate = null;
    expect(mapDeliveryNoteToDocument(realtimeSource).documentDate).toBeNull();
  });

  it("mengurutkan item dan menggunakan displayProductName", () => {
    const input = source();
    const originalNames = input.items.map((item) => item.originalProductName);
    const mapped = mapDeliveryNoteToDocument(input);

    expect(mapped.items.map((item) => item.productName)).toEqual([
      "Kartu Pembayaran",
      "Kop Surat SOF (HVS)",
    ]);
    expect(input.items.map((item) => item.originalProductName)).toEqual(
      originalNames,
    );
  });

  it("menangani field opsional kosong tanpa null atau undefined", () => {
    const mapped = mapDeliveryNoteToDocument(source());
    expect(mapped.vehicleName).toBe("");
    expect(mapped.vehicleNumber).toBe("");
    expect(mapped.additionalPoNumber).toBe("");
    expect(mapped.recipientName).toBe("");
    expect(JSON.stringify(mapped)).not.toMatch(/null|undefined|Invalid Date|NaN/u);
  });
});

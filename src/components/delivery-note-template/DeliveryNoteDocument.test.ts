import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEFAULT_PAPER_PROFILE } from "@/lib/delivery-note-template/paper-profiles";
import type { DeliveryNoteDocumentData } from "@/lib/delivery-note-template/types";

import { DeliveryNoteDocument } from "./DeliveryNoteDocument";

function documentData(itemCount: number): DeliveryNoteDocumentData {
  return {
    id: "document-test",
    purchaseOrderId: "po-test",
    uniqueCode: "TEST-DOCUMENT",
    documentNumber: "SJ-TEST-001",
    documentDate: "2026-08-21",
    recipientCompanyName: "PT. PENERIMA TEST",
    companyCode: "TST",
    branchName: "Cabang Test",
    poNumber: "PO-TEST-001",
    vehicleName: "Mobil Box",
    vehicleNumber: "D 1234 TEST",
    additionalPoNumber: "PO-TAMBAHAN",
    recipientName: "Penerima Test",
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: `render-item-${index + 1}`,
      quantity: `${index + 1} pcs`,
      productName: `BARANG UNIK ${index + 1}`,
      description: `KETERANGAN ${index + 1}`,
      sortOrder: index,
    })),
  };
}

function renderDocument(itemCount: number): string {
  return renderToStaticMarkup(
    createElement(DeliveryNoteDocument, {
      data: documentData(itemCount),
      paperProfile: DEFAULT_PAPER_PROFILE,
    }),
  );
}

describe("DeliveryNoteDocument", () => {
  it("menampilkan tiga item dalam satu halaman dengan footer utama", () => {
    const html = renderDocument(3);
    expect(html.match(/data-page-number=/gu)).toHaveLength(1);
    expect(html.match(/BARANG UNIK/gu)).toHaveLength(3);
    expect(html.match(/Hormat Kami/gu)).toHaveLength(1);
    expect(html).not.toContain("Daftar barang berlanjut");
  });

  it("menampilkan 25 item pada tiga halaman tanpa hilang atau duplikat", () => {
    const html = renderDocument(25);
    expect(html.match(/data-page-number=/gu)).toHaveLength(3);
    expect(html.match(/BANYAKNYA/gu)).toHaveLength(3);
    expect(html.match(/BARANG UNIK/gu)).toHaveLength(25);
    expect(html.match(/Hormat Kami/gu)).toHaveLength(1);
    expect(html.match(/Daftar barang berlanjut/gu)).toHaveLength(2);

    for (let index = 1; index <= 25; index += 1) {
      expect(html.match(new RegExp(`BARANG UNIK ${index}(?!\\d)`, "gu"))).toHaveLength(1);
    }
  });

  it("mengulang identitas lanjutan dan menempatkan footer utama hanya di halaman terakhir", () => {
    const html = renderDocument(25);
    expect(html.match(/PENGADAAN &amp; PERDAGANGAN UMUM/gu)).toHaveLength(2);
    expect(html).toContain("Halaman 2 dari 3");
    expect(html).toContain("Halaman 3 dari 3");
    expect(html.match(/CV\. PRAMUDYA PUTRA\)/gu)).toHaveLength(1);
  });
});

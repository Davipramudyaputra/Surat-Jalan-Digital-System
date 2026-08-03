import { describe, expect, it } from "vitest";

import { DELIVERY_NOTE_ROWS_PER_PAGE } from "./constants";
import {
  estimateDeliveryNoteItemRowSpan,
  paginateDeliveryNoteItems,
} from "./pagination";
import type { DeliveryNoteDocumentItem } from "./types";

function items(count: number): DeliveryNoteDocumentItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    quantity: String(index + 1),
    productName: `Barang ${index + 1}`,
    description: "",
    sortOrder: index,
  }));
}

describe("paginateDeliveryNoteItems", () => {
  it("melengkapi item sedikit dengan baris kosong", () => {
    const [page] = paginateDeliveryNoteItems(items(3));
    expect(
      page.rows.reduce((total, row) => total + row.visualRowSpan, 0),
    ).toBe(DELIVERY_NOTE_ROWS_PER_PAGE);
    expect(page.rows.filter((row) => row.item !== null)).toHaveLength(3);
    expect(page.pageNumber).toBe(1);
    expect(page.totalPages).toBe(1);
  });

  it("menggunakan satu halaman ketika item sama dengan kapasitas", () => {
    expect(paginateDeliveryNoteItems(items(DELIVERY_NOTE_ROWS_PER_PAGE))).toHaveLength(
      1,
    );
  });

  it("membagi item banyak tanpa kehilangan atau menduplikasi item", () => {
    const source = items(DELIVERY_NOTE_ROWS_PER_PAGE * 2 + 3);
    const pages = paginateDeliveryNoteItems(source);
    const renderedIds = pages
      .flatMap((page) => page.rows)
      .map((row) => row.item)
      .filter((item): item is DeliveryNoteDocumentItem => item !== null)
      .map((item) => item.id);

    expect(pages).toHaveLength(3);
    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2, 3]);
    expect(pages.every((page) => page.totalPages === 3)).toBe(true);
    expect(renderedIds).toEqual(source.map((item) => item.id));
    expect(new Set(renderedIds).size).toBe(source.length);
  });

  it("memberi beberapa slot visual untuk teks panjang tanpa memotong item", () => {
    const longItem = items(1)[0];
    longItem.description = "Keterangan panjang ".repeat(8);
    const rowSpan = estimateDeliveryNoteItemRowSpan(longItem);
    const [page] = paginateDeliveryNoteItems([longItem]);

    expect(rowSpan).toBeGreaterThan(1);
    expect(page.rows[0]).toEqual({ item: longItem, visualRowSpan: rowSpan });
    expect(
      page.rows.reduce((total, row) => total + row.visualRowSpan, 0),
    ).toBe(DELIVERY_NOTE_ROWS_PER_PAGE);
  });
});

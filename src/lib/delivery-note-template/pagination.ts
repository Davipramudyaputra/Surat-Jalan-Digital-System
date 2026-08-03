import { DELIVERY_NOTE_ROWS_PER_PAGE } from "./constants";
import type {
  DeliveryNoteDocumentItem,
  DeliveryNoteDocumentPage,
  DeliveryNoteDocumentRow,
} from "./types";

const ESTIMATED_CHARACTERS_PER_VISUAL_ROW = {
  quantity: 12,
  productName: 64,
  description: 30,
} as const;

function estimatedLines(value: string, charactersPerLine: number): number {
  const normalized = value.trim();
  return normalized ? Math.max(1, Math.ceil(normalized.length / charactersPerLine)) : 1;
}

export function estimateDeliveryNoteItemRowSpan(
  item: DeliveryNoteDocumentItem,
  rowsPerPage = DELIVERY_NOTE_ROWS_PER_PAGE,
): number {
  const lines = Math.max(
    estimatedLines(
      item.quantity,
      ESTIMATED_CHARACTERS_PER_VISUAL_ROW.quantity,
    ),
    estimatedLines(
      item.productName,
      ESTIMATED_CHARACTERS_PER_VISUAL_ROW.productName,
    ),
    estimatedLines(
      item.description,
      ESTIMATED_CHARACTERS_PER_VISUAL_ROW.description,
    ),
  );

  return Math.min(rowsPerPage, lines);
}

export function paginateDeliveryNoteItems(
  items: DeliveryNoteDocumentItem[],
  rowsPerPage = DELIVERY_NOTE_ROWS_PER_PAGE,
): DeliveryNoteDocumentPage[] {
  if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1) {
    throw new Error("Kapasitas baris Surat Jalan harus berupa bilangan positif.");
  }

  const pageRows: DeliveryNoteDocumentRow[][] = [];
  let currentRows: DeliveryNoteDocumentRow[] = [];
  let usedVisualRows = 0;

  const finishPage = () => {
    while (usedVisualRows < rowsPerPage) {
      currentRows.push({ item: null, visualRowSpan: 1 });
      usedVisualRows += 1;
    }
    pageRows.push(currentRows);
    currentRows = [];
    usedVisualRows = 0;
  };

  for (const item of items) {
    const visualRowSpan = estimateDeliveryNoteItemRowSpan(item, rowsPerPage);
    if (usedVisualRows > 0 && usedVisualRows + visualRowSpan > rowsPerPage) {
      finishPage();
    }

    currentRows.push({ item, visualRowSpan });
    usedVisualRows += visualRowSpan;

    if (usedVisualRows === rowsPerPage) {
      finishPage();
    }
  }

  if (currentRows.length > 0 || pageRows.length === 0) {
    finishPage();
  }

  return pageRows.map((rows, pageIndex) => ({
    pageNumber: pageIndex + 1,
    totalPages: pageRows.length,
    rows,
  }));
}

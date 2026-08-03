import { EXCLUDED_PRODUCT_HEADER_MARKERS } from "@/features/imports/config/header-aliases";
import { QUANTITY_SAMPLE_ROWS } from "@/features/imports/config/import-limits";
import { formatProductDisplayName } from "@/features/imports/normalization/format-product-display-name";
import { normalizeHeaderValue } from "@/features/imports/normalization/normalize-key";
import { normalizeProductName } from "@/features/imports/normalization/normalize-product-name";
import { normalizeQuantity } from "@/features/imports/normalization/normalize-quantity";
import { isSummaryRow } from "@/features/imports/parser/is-summary-row";
import type {
  ImportIssue,
  ProductColumn,
  WorkbookCell,
} from "@/features/imports/types/import-types";

export type DetectedColumns = {
  ambiguityErrors: ImportIssue[];
  dataRowCount: number;
  productColumns: ProductColumn[];
  quantityErrorCount: number;
  quantityValueCount: number;
};

function isExcludedProductHeader(value: string): boolean {
  const normalized = normalizeHeaderValue(value);

  return EXCLUDED_PRODUCT_HEADER_MARKERS.some(
    (marker) =>
      normalized === marker ||
      normalized.startsWith(`${marker} `) ||
      normalized.endsWith(` ${marker}`),
  );
}

function isPotentialBranch(value: unknown): boolean {
  return (
    (typeof value === "string" || typeof value === "number") &&
    String(value).trim().length > 0 &&
    !isSummaryRow(value)
  );
}

export function detectColumns(options: {
  branchColumnIndex: number;
  headerRowIndex: number;
  numberColumnIndex: number;
  rows: WorkbookCell[][];
  sheetName?: string;
}): DetectedColumns {
  const {
    branchColumnIndex,
    headerRowIndex,
    numberColumnIndex,
    rows,
    sheetName,
  } = options;
  const headerRow = rows[headerRowIndex] ?? [];
  const sampleEnd = Math.min(
    rows.length,
    headerRowIndex + 1 + QUANTITY_SAMPLE_ROWS,
  );
  const productColumns: ProductColumn[] = [];
  const ambiguityErrors: ImportIssue[] = [];
  let quantityErrorCount = 0;
  let quantityValueCount = 0;
  let dataRowCount = 0;

  const candidateBranchRows = rows
    .slice(headerRowIndex + 1, sampleEnd)
    .filter((row) => isPotentialBranch(row[branchColumnIndex]?.value));

  for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex += 1) {
    if (
      columnIndex === branchColumnIndex ||
      columnIndex === numberColumnIndex
    ) {
      continue;
    }

    const rawHeader = headerRow[columnIndex]?.value;

    if (
      typeof rawHeader !== "string" ||
      rawHeader.trim().length === 0 ||
      isExcludedProductHeader(rawHeader)
    ) {
      continue;
    }

    let positiveValueCount = 0;
    let observedQuantityCount = 0;

    for (const row of candidateBranchRows) {
      const result = normalizeQuantity(row[columnIndex] ?? null);

      if (result.kind === "valid") {
        positiveValueCount += 1;
        observedQuantityCount += 1;
      } else if (result.kind === "error") {
        quantityErrorCount += 1;
        observedQuantityCount += 1;
      }
    }

    if (positiveValueCount === 0) {
      continue;
    }

    quantityValueCount += observedQuantityCount;
    const originalProductName = rawHeader;

    productColumns.push({
      columnIndex,
      displayProductName: formatProductDisplayName(originalProductName),
      normalizedProductName: normalizeProductName(originalProductName),
      originalProductName,
      positiveValueCount,
      sortOrder: productColumns.length,
    });
  }

  const duplicateProducts = new Map<string, ProductColumn[]>();

  for (const product of productColumns) {
    const existing = duplicateProducts.get(product.normalizedProductName) ?? [];
    existing.push(product);
    duplicateProducts.set(product.normalizedProductName, existing);
  }

  for (const [normalizedName, products] of duplicateProducts) {
    if (products.length <= 1) {
      continue;
    }

    ambiguityErrors.push({
      code: "DUPLICATE_PRODUCT_COLUMN",
      message: `Lebih dari satu kolom produk memiliki identitas yang sama: ${normalizedName}.`,
      sheet: sheetName,
    });
  }

  dataRowCount = candidateBranchRows.filter((row) =>
    productColumns.some(
      (product) =>
        normalizeQuantity(row[product.columnIndex] ?? null).kind === "valid",
    ),
  ).length;

  return {
    ambiguityErrors,
    dataRowCount,
    productColumns,
    quantityErrorCount,
    quantityValueCount,
  };
}

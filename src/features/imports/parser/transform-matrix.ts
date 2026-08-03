import { normalizeBranchName } from "@/features/imports/normalization/normalize-branch-name";
import { normalizeQuantity } from "@/features/imports/normalization/normalize-quantity";
import { isSummaryRow } from "@/features/imports/parser/is-summary-row";
import type {
  HeaderCandidate,
  ImportIssue,
  ParsedDeliveryNote,
  SkippedCell,
  SkippedRow,
  WorksheetInspection,
} from "@/features/imports/types/import-types";

export type MatrixTransformation = {
  deliveryNotes: ParsedDeliveryNote[];
  errors: ImportIssue[];
  skippedCells: SkippedCell[];
  skippedRows: SkippedRow[];
  warnings: ImportIssue[];
};

export function transformMatrix(
  worksheet: WorksheetInspection,
  header: HeaderCandidate,
): MatrixTransformation {
  const deliveryNotes: ParsedDeliveryNote[] = [];
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const skippedRows: SkippedRow[] = [];
  const skippedCells: SkippedCell[] = [];
  const branchKeys = new Set<string>();

  for (
    let rowIndex = header.headerRowIndex + 1;
    rowIndex < worksheet.rows.length;
    rowIndex += 1
  ) {
    const row = worksheet.rows[rowIndex] ?? [];
    const branchCell = row[header.branchColumnIndex];
    const branchValue = branchCell?.value;
    const excelRow = worksheet.originRowIndex + rowIndex + 1;

    if (
      branchValue === null ||
      branchValue === undefined ||
      String(branchValue).trim().length === 0
    ) {
      continue;
    }

    if (isSummaryRow(branchValue)) {
      skippedRows.push({
        reason: "Baris ringkasan atau total tidak di-import.",
        row: excelRow,
        sheet: worksheet.sheetName,
      });
      continue;
    }

    const normalizedBranch = normalizeBranchName(String(branchValue));
    const items = [];

    for (const product of header.productColumns) {
      const cell = row[product.columnIndex];
      const quantity = normalizeQuantity(cell ?? null);

      if (quantity.kind === "valid") {
        items.push({
          displayProductName: product.displayProductName,
          normalizedProductName: product.normalizedProductName,
          originalProductName: product.originalProductName,
          quantity: quantity.value,
          sortOrder: product.sortOrder,
        });
        continue;
      }

      if (quantity.kind === "error") {
        errors.push({
          code: quantity.code,
          column: cell?.address,
          message: `${quantity.message} Cabang: ${normalizedBranch.branchName}.`,
          row: excelRow,
          sheet: worksheet.sheetName,
        });
        continue;
      }

      if (
        quantity.reason !== "empty" &&
        skippedCells.length < 250 &&
        cell
      ) {
        skippedCells.push({
          column: cell.address,
          reason:
            quantity.reason === "zero"
              ? "Kuantitas nol diabaikan."
              : "Tanda strip diabaikan.",
          row: excelRow,
          sheet: worksheet.sheetName,
        });
      }
    }

    if (items.length === 0) {
      skippedRows.push({
        reason: "Cabang tidak memiliki barang dengan kuantitas lebih dari 0.",
        row: excelRow,
        sheet: worksheet.sheetName,
      });
      warnings.push({
        code: "EMPTY_BRANCH_SKIPPED",
        message: `Cabang ${normalizedBranch.branchName} tidak memiliki barang dengan kuantitas lebih dari 0 dan tidak dibuatkan surat jalan.`,
        row: excelRow,
        sheet: worksheet.sheetName,
      });
      continue;
    }

    if (branchKeys.has(normalizedBranch.normalizedBranchName)) {
      errors.push({
        code: "DUPLICATE_BRANCH",
        message: `Nama cabang ${normalizedBranch.branchName} muncul lebih dari sekali setelah normalisasi.`,
        row: excelRow,
        sheet: worksheet.sheetName,
      });
      continue;
    }

    branchKeys.add(normalizedBranch.normalizedBranchName);
    deliveryNotes.push({
      ...normalizedBranch,
      items,
    });
  }

  return {
    deliveryNotes,
    errors,
    skippedCells,
    skippedRows,
    warnings,
  };
}

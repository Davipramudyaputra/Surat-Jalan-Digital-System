import * as XLSX from "xlsx";

import { findHeaderCandidates } from "@/features/imports/parser/detect-header-row";
import type {
  WorkbookCell,
  WorkbookCellValue,
  WorkbookInspection,
  WorksheetInspection,
  WorksheetVisibility,
} from "@/features/imports/types/import-types";

export function makeWorksheet(
  values: WorkbookCellValue[][],
  options?: {
    name?: string;
    originColumnIndex?: number;
    originRowIndex?: number;
    visibility?: WorksheetVisibility;
  },
): WorksheetInspection {
  const originColumnIndex = options?.originColumnIndex ?? 0;
  const originRowIndex = options?.originRowIndex ?? 0;
  const columnCount = Math.max(0, ...values.map((row) => row.length));
  const rows: WorkbookCell[][] = values.map((row, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) => ({
      address: XLSX.utils.encode_cell({
        c: originColumnIndex + columnIndex,
        r: originRowIndex + rowIndex,
      }),
      value: row[columnIndex] ?? null,
    })),
  );
  const sheetName = options?.name ?? "Data Dinamis";
  const endAddress =
    rows.length > 0 && columnCount > 0
      ? XLSX.utils.encode_cell({
          c: originColumnIndex + columnCount - 1,
          r: originRowIndex + rows.length - 1,
        })
      : null;
  const startAddress =
    rows.length > 0 && columnCount > 0
      ? XLSX.utils.encode_cell({
          c: originColumnIndex,
          r: originRowIndex,
        })
      : null;

  return {
    columnCount,
    headerCandidates: findHeaderCandidates(rows, sheetName),
    mergedCells: [],
    metadataCandidates: values
      .flat()
      .filter(
        (value): value is string =>
          typeof value === "string" && /\bpo\b/iu.test(value),
      ),
    originColumnIndex,
    originRowIndex,
    range:
      startAddress && endAddress ? `${startAddress}:${endAddress}` : null,
    rowCount: rows.length,
    rows,
    sheetName,
    visibility: options?.visibility ?? "visible",
  };
}

export function makeInspection(
  sheets: WorksheetInspection[],
): WorkbookInspection {
  return { sheets };
}

import * as XLSX from "xlsx";

import { findHeaderCandidates } from "@/features/imports/parser/detect-header-row";
import type {
  WorkbookCell,
  WorkbookCellValue,
  WorkbookInspection,
  WorksheetInspection,
  WorksheetVisibility,
} from "@/features/imports/types/import-types";

function getVisibility(value: number | undefined): WorksheetVisibility {
  if (value === 1) {
    return "hidden";
  }

  if (value === 2) {
    return "very-hidden";
  }

  return "visible";
}

function toCellValue(value: unknown): WorkbookCellValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }

  return value === undefined ? null : String(value);
}

function inspectWorksheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  sheetIndex: number,
): WorksheetInspection {
  const worksheet = workbook.Sheets[sheetName];
  const rangeText = worksheet?.["!ref"] ?? null;
  const workbookSheet = workbook.Workbook?.Sheets?.[sheetIndex];
  const visibility = getVisibility(workbookSheet?.Hidden);

  if (!worksheet || !rangeText) {
    return {
      columnCount: 0,
      headerCandidates: [],
      mergedCells: [],
      metadataCandidates: [],
      originColumnIndex: 0,
      originRowIndex: 0,
      range: rangeText,
      rowCount: 0,
      rows: [],
      sheetName,
      visibility,
    };
  }

  const range = XLSX.utils.decode_range(rangeText);
  const rows: WorkbookCell[][] = [];

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const cells: WorkbookCell[] = [];

    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ c: column, r: row });
      const sourceCell = worksheet[address];

      cells.push({
        address,
        formula: sourceCell?.f,
        numberFormat: sourceCell?.z,
        type: sourceCell?.t,
        value: toCellValue(sourceCell?.v),
      });
    }

    rows.push(cells);
  }

  const metadataCandidates = rows
    .flatMap((row) => row)
    .map((cell) => cell.value)
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        /\b(?:po|purchase\s+order|periode|lampiran)\b/iu.test(value),
    )
    .slice(0, 100);
  const mergedCells = (worksheet["!merges"] ?? []).map((merge) =>
    XLSX.utils.encode_range(merge),
  );
  const headerCandidates = findHeaderCandidates(rows, sheetName);

  return {
    columnCount: range.e.c - range.s.c + 1,
    headerCandidates,
    mergedCells,
    metadataCandidates,
    originColumnIndex: range.s.c,
    originRowIndex: range.s.r,
    range: rangeText,
    rowCount: range.e.r - range.s.r + 1,
    rows,
    sheetName,
    visibility,
  };
}

export function inspectWorkbook(workbook: XLSX.WorkBook): WorkbookInspection {
  return {
    sheets: workbook.SheetNames.map((sheetName, sheetIndex) =>
      inspectWorksheet(workbook, sheetName, sheetIndex),
    ),
  };
}

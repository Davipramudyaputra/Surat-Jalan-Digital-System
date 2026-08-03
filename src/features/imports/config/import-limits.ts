export const MAX_IMPORT_FILES = 10;
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export const SUPPORTED_EXCEL_EXTENSIONS = [".xls", ".xlsx"] as const;

export const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

export const MAX_HEADER_SCAN_ROWS = 200;
export const QUANTITY_SAMPLE_ROWS = 75;
export const MIN_IMPORT_CONFIDENCE = 75;
export const HEADER_AMBIGUITY_MARGIN = 4;
export const SHEET_AMBIGUITY_MARGIN = 4;

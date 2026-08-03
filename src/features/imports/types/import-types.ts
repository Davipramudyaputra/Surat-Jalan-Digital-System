export type WorkbookCellValue = string | number | boolean | Date | null;

export type WorksheetVisibility = "visible" | "hidden" | "very-hidden";

export type WorkbookCell = {
  address: string;
  value: WorkbookCellValue;
  type?: string;
  numberFormat?: string;
  formula?: string;
};

export type ProductColumn = {
  columnIndex: number;
  displayProductName: string;
  normalizedProductName: string;
  originalProductName: string;
  positiveValueCount: number;
  sortOrder: number;
};

export type HeaderCandidate = {
  ambiguityErrors: ImportIssue[];
  branchColumnIndex: number;
  dataRowCount: number;
  headerRowIndex: number;
  numberColumnIndex: number;
  productColumns: ProductColumn[];
  quantityErrorCount: number;
  quantityValueCount: number;
  score: number;
};

export type WorksheetInspection = {
  columnCount: number;
  headerCandidates: HeaderCandidate[];
  mergedCells: string[];
  metadataCandidates: string[];
  originColumnIndex: number;
  originRowIndex: number;
  range: string | null;
  rowCount: number;
  rows: WorkbookCell[][];
  sheetName: string;
  visibility: WorksheetVisibility;
};

export type WorkbookInspection = {
  sheets: WorksheetInspection[];
};

export type ImportIssue = {
  code: string;
  column?: string;
  message: string;
  row?: number;
  sheet?: string;
};

export type SkippedRow = {
  reason: string;
  row: number;
  sheet: string;
};

export type SkippedCell = {
  column: string;
  reason: string;
  row: number;
  sheet: string;
};

export type ParsedDeliveryNoteItem = {
  displayProductName: string;
  normalizedProductName: string;
  originalProductName: string;
  quantity: string;
  sortOrder: number;
};

export type ParsedDeliveryNote = {
  branchName: string;
  items: ParsedDeliveryNoteItem[];
  normalizedBranchName: string;
  originalBranchName: string;
};

export type ParsedImportSummary = {
  deliveryNoteCount: number;
  itemCount: number;
  productColumnCount: number;
};

export type ParsedImportDiagnostics = {
  errors: ImportIssue[];
  headerRow: number;
  skippedCells: SkippedCell[];
  skippedRows: SkippedRow[];
  warnings: ImportIssue[];
};

export type ParsedImport = {
  companyCode: string;
  companyName: string;
  confidence: number;
  deliveryNotes: ParsedDeliveryNote[];
  detectedSheet: string;
  diagnostics: ParsedImportDiagnostics;
  normalizedPoNumber: string;
  period: string | null;
  poNumber: string;
  summary: ParsedImportSummary;
};

export type ImportResultStatus =
  | "NEW_FILE"
  | "DUPLICATE_ACTIVE"
  | "REIMPORT_AFTER_DELETE"
  | "REVISION"
  | "IMPORTED"
  | "DUPLICATE" // Legacy or fallback duplicate state
  | "FAILED";

export type DuplicateClassification =
  | "NEW_FILE"
  | "DUPLICATE_ACTIVE"
  | "REIMPORT_AFTER_DELETE"
  | "SAME_NAME_DIFFERENT_HASH"
  | "DIFFERENT_NAME_SAME_HASH"
  | "REVISION";

export type ImportFileResult = {
  confidence: number | null;
  deliveryNotes: number;
  detectedSheet: string | null;
  errors: ImportIssue[];
  fileName: string;
  items: number;
  purchaseOrders: number;
  status: ImportResultStatus;
  warnings: ImportIssue[];
  classification?: DuplicateClassification;
  companyCode?: string;
  companyName?: string;
  extension?: string;
  fileSize?: number;
  period?: string | null;
  poNumber?: string;
  existingPurchaseOrderId?: string;
  databaseChanges?: {
    purchaseOrdersCreated: number;
    purchaseOrdersUpdated: number;
    deliveryNotesCreated: number;
    deliveryNotesUpdated: number;
    itemsCreated: number;
    itemsUpdated: number;
  };
};

export type ExtractedPurchaseOrderMetadata = {
  companyCode: string;
  companyName: string;
  normalizedPoNumber: string;
  period: string | null;
  poNumber: string;
  warnings: ImportIssue[];
};

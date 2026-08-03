import { MIN_IMPORT_CONFIDENCE } from "@/features/imports/config/import-limits";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { calculateConfidence } from "@/features/imports/parser/calculate-confidence";
import { extractPurchaseOrderMetadata } from "@/features/imports/parser/extract-po-metadata";
import type { SelectedWorksheet } from "@/features/imports/parser/find-candidate-sheets";
import { transformMatrix } from "@/features/imports/parser/transform-matrix";
import type { ParsedImport } from "@/features/imports/types/import-types";
import { parsedImportSchema } from "@/features/imports/validation/parsed-import-schema";

export function parseWorksheet(selected: SelectedWorksheet): ParsedImport {
  const { header, worksheet } = selected;
  const metadata = extractPurchaseOrderMetadata(worksheet, header);
  const transformed = transformMatrix(worksheet, header);
  const rowConsistency =
    header.dataRowCount === 0
      ? 0
      : transformed.deliveryNotes.length / header.dataRowCount;
  const confidence = calculateConfidence({
    branchHeaderFound: header.branchColumnIndex >= 0,
    dataRowCount: transformed.deliveryNotes.length,
    poNumberFound: metadata.poNumber.length > 0,
    productColumnCount: header.productColumns.length,
    quantityErrorCount: header.quantityErrorCount,
    quantityValueCount: header.quantityValueCount,
    rowConsistency,
  });
  const parsedImport: ParsedImport = {
    companyCode: metadata.companyCode,
    companyName: metadata.companyName,
    confidence,
    deliveryNotes: transformed.deliveryNotes,
    detectedSheet: worksheet.sheetName,
    diagnostics: {
      errors: transformed.errors,
      headerRow: worksheet.originRowIndex + header.headerRowIndex + 1,
      skippedCells: transformed.skippedCells,
      skippedRows: transformed.skippedRows,
      warnings: [...metadata.warnings, ...transformed.warnings],
    },
    normalizedPoNumber: metadata.normalizedPoNumber,
    period: metadata.period,
    poNumber: metadata.poNumber,
    summary: {
      deliveryNoteCount: transformed.deliveryNotes.length,
      itemCount: transformed.deliveryNotes.reduce(
        (total, deliveryNote) => total + deliveryNote.items.length,
        0,
      ),
      productColumnCount: header.productColumns.length,
    },
  };
  const validation = parsedImportSchema.safeParse(parsedImport);

  if (!validation.success) {
    const validationIssues = validation.error.issues.map((issue) => ({
      code:
        confidence < MIN_IMPORT_CONFIDENCE
          ? "LOW_IMPORT_CONFIDENCE"
          : "PARSED_RESULT_INVALID",
      message: issue.message,
      sheet: worksheet.sheetName,
    }));

    throw new ImportPipelineError(
      confidence < MIN_IMPORT_CONFIDENCE
        ? "LOW_IMPORT_CONFIDENCE"
        : "PARSED_RESULT_INVALID",
      confidence < MIN_IMPORT_CONFIDENCE
        ? "Tingkat keyakinan deteksi struktur terlalu rendah untuk import otomatis."
        : "Hasil pembacaan Excel tidak memenuhi aturan data surat jalan.",
      {
        diagnostics: parsedImport.diagnostics,
        issues: [...transformed.errors, ...validationIssues],
      },
    );
  }

  return validation.data;
}

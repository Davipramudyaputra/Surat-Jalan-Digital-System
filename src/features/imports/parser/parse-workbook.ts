import { findCandidateSheets } from "@/features/imports/parser/find-candidate-sheets";
import { inspectWorkbook } from "@/features/imports/parser/inspect-workbook";
import { parseWorksheet } from "@/features/imports/parser/parse-worksheet";
import { readWorkbook } from "@/features/imports/parser/read-workbook";
import type { ParsedImport } from "@/features/imports/types/import-types";

export function parseWorkbookBuffer(buffer: Uint8Array): ParsedImport {
  const workbook = readWorkbook(buffer);
  const inspection = inspectWorkbook(workbook);
  const selected = findCandidateSheets(inspection);

  return parseWorksheet(selected);
}

import * as XLSX from "xlsx";

import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";

export function readWorkbook(buffer: Uint8Array): XLSX.WorkBook {
  try {
    return XLSX.read(buffer, {
      bookFiles: false,
      bookVBA: false,
      cellFormula: true,
      cellNF: true,
      cellStyles: false,
      dense: false,
      type: "array",
    });
  } catch {
    throw new ImportPipelineError(
      "WORKBOOK_UNREADABLE",
      "File tidak dapat dibaca sebagai Excel.",
    );
  }
}

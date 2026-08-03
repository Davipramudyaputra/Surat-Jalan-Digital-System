import { SHEET_AMBIGUITY_MARGIN } from "@/features/imports/config/import-limits";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { detectHeaderRow } from "@/features/imports/parser/detect-header-row";
import type {
  HeaderCandidate,
  WorkbookInspection,
  WorksheetInspection,
} from "@/features/imports/types/import-types";

export type SelectedWorksheet = {
  header: HeaderCandidate;
  score: number;
  worksheet: WorksheetInspection;
};

function visibilityBonus(
  visibility: WorksheetInspection["visibility"],
): number {
  if (visibility === "visible") {
    return 15;
  }

  if (visibility === "hidden") {
    return 3;
  }

  return 0;
}

export function findCandidateSheets(
  inspection: WorkbookInspection,
): SelectedWorksheet {
  const candidates: SelectedWorksheet[] = inspection.sheets
    .filter((sheet) => sheet.headerCandidates.length > 0)
    .map((worksheet) => {
      const header = worksheet.headerCandidates[0];

      return {
        header,
        score: header.score + visibilityBonus(worksheet.visibility),
        worksheet,
      };
    })
    .sort((left, right) => right.score - left.score);
  const [best, second] = candidates;

  if (!best) {
    throw new ImportPipelineError(
      "SHEET_NOT_FOUND",
      "Sheet data utama tidak ditemukan.",
    );
  }

  if (second && best.score - second.score <= SHEET_AMBIGUITY_MARGIN) {
    throw new ImportPipelineError(
      "AMBIGUOUS_SHEET",
      "Struktur Excel ambigu dan belum dapat di-import otomatis.",
      {
        issues: [
          {
            code: "AMBIGUOUS_SHEET",
            message: `Sheet "${best.worksheet.sheetName}" dan "${second.worksheet.sheetName}" memiliki tingkat kecocokan yang hampir sama.`,
          },
        ],
      },
    );
  }

  return {
    ...best,
    header: detectHeaderRow(
      best.worksheet.headerCandidates,
      best.worksheet.sheetName,
    ),
  };
}

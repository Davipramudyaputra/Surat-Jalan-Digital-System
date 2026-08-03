import {
  BRANCH_HEADER_ALIASES,
  NUMBER_HEADER_ALIASES,
} from "@/features/imports/config/header-aliases";
import {
  HEADER_AMBIGUITY_MARGIN,
  MAX_HEADER_SCAN_ROWS,
} from "@/features/imports/config/import-limits";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { normalizeHeaderValue } from "@/features/imports/normalization/normalize-key";
import { detectColumns } from "@/features/imports/parser/detect-columns";
import type {
  HeaderCandidate,
  WorkbookCell,
} from "@/features/imports/types/import-types";

const numberAliases = new Set(
  NUMBER_HEADER_ALIASES.map((alias) => normalizeHeaderValue(alias)),
);
const branchAliases = new Set(
  BRANCH_HEADER_ALIASES.map((alias) => normalizeHeaderValue(alias)),
);

function findAliasColumn(
  row: WorkbookCell[],
  aliases: ReadonlySet<string>,
): number {
  return row.findIndex((cell) => aliases.has(normalizeHeaderValue(cell.value)));
}

function calculateHeaderScore(candidate: Omit<HeaderCandidate, "score">): number {
  const productScore = Math.min(candidate.productColumns.length * 3, 20);
  const dataScore = Math.min(candidate.dataRowCount, 20);
  const observed =
    candidate.quantityValueCount + candidate.quantityErrorCount;
  const consistency =
    observed === 0
      ? 0
      : Math.round((candidate.quantityValueCount / observed) * 10);

  return 50 + productScore + dataScore + consistency;
}

export function findHeaderCandidates(
  rows: WorkbookCell[][],
  sheetName?: string,
): HeaderCandidate[] {
  const candidates: HeaderCandidate[] = [];
  const scanLimit = Math.min(rows.length, MAX_HEADER_SCAN_ROWS);

  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const numberColumnIndex = findAliasColumn(row, numberAliases);
    const branchColumnIndex = findAliasColumn(row, branchAliases);

    if (numberColumnIndex < 0 || branchColumnIndex < 0) {
      continue;
    }

    const detected = detectColumns({
      branchColumnIndex,
      headerRowIndex: rowIndex,
      numberColumnIndex,
      rows,
      sheetName,
    });

    if (
      detected.productColumns.length === 0 ||
      detected.dataRowCount === 0
    ) {
      continue;
    }

    const candidateWithoutScore = {
      ambiguityErrors: detected.ambiguityErrors,
      branchColumnIndex,
      dataRowCount: detected.dataRowCount,
      headerRowIndex: rowIndex,
      numberColumnIndex,
      productColumns: detected.productColumns,
      quantityErrorCount: detected.quantityErrorCount,
      quantityValueCount: detected.quantityValueCount,
    };

    candidates.push({
      ...candidateWithoutScore,
      score: calculateHeaderScore(candidateWithoutScore),
    });
  }

  return candidates.sort((left, right) => right.score - left.score);
}

export function detectHeaderRow(
  candidates: HeaderCandidate[],
  sheetName: string,
): HeaderCandidate {
  const [best, second] = candidates;

  if (!best) {
    throw new ImportPipelineError(
      "HEADER_NOT_FOUND",
      "Header nomor, cabang, dan kolom produk tidak ditemukan.",
      {
        issues: [
          {
            code: "HEADER_NOT_FOUND",
            message: "Header nomor, cabang, dan kolom produk tidak ditemukan.",
            sheet: sheetName,
          },
        ],
      },
    );
  }

  if (second && best.score - second.score <= HEADER_AMBIGUITY_MARGIN) {
    throw new ImportPipelineError(
      "AMBIGUOUS_HEADER",
      "Struktur Excel ambigu karena lebih dari satu baris header memiliki tingkat kecocokan yang sama.",
      {
        issues: [
          {
            code: "AMBIGUOUS_HEADER",
            message:
              "Lebih dari satu baris header memiliki tingkat kecocokan yang hampir sama.",
            sheet: sheetName,
          },
        ],
      },
    );
  }

  if (best.ambiguityErrors.length > 0) {
    throw new ImportPipelineError(
      "AMBIGUOUS_PRODUCT_COLUMNS",
      "Struktur Excel ambigu karena kolom produk tidak dapat dibedakan secara aman.",
      {
        issues: best.ambiguityErrors,
      },
    );
  }

  return best;
}

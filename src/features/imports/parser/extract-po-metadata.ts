import { COMPANY_MAPPINGS, getCompanyName } from "@/features/imports/config/company-mappings";
import { ImportPipelineError } from "@/features/imports/errors/import-pipeline-error";
import { collapseWhitespace } from "@/features/imports/normalization/normalize-key";
import { normalizePoNumber } from "@/features/imports/normalization/normalize-po-number";
import type {
  ExtractedPurchaseOrderMetadata,
  HeaderCandidate,
  WorksheetInspection,
} from "@/features/imports/types/import-types";

const romanMonths: Readonly<Record<string, string>> = Object.freeze({
  I: "01",
  II: "02",
  III: "03",
  IV: "04",
  V: "05",
  VI: "06",
  VII: "07",
  VIII: "08",
  IX: "09",
  X: "10",
  XI: "11",
  XII: "12",
});

const namedMonths: Readonly<Record<string, string>> = Object.freeze({
  januari: "01",
  january: "01",
  februari: "02",
  february: "02",
  maret: "03",
  march: "03",
  april: "04",
  mei: "05",
  may: "05",
  juni: "06",
  june: "06",
  juli: "07",
  july: "07",
  agustus: "08",
  august: "08",
  september: "09",
  oktober: "10",
  october: "10",
  november: "11",
  desember: "12",
  december: "12",
});

function extractPeriod(text: string): string | null {
  const romanMatch = text.match(
    /\/(XII|XI|IX|VIII|VII|VI|IV|V|III|II|I)\/(20\d{2})\b/iu,
  );

  if (romanMatch) {
    return `${romanMatch[2]}-${romanMonths[romanMatch[1].toUpperCase()]}`;
  }

  const namedMatch = text.match(
    /\b(januari|january|februari|february|maret|march|april|mei|may|juni|june|juli|july|agustus|august|september|oktober|october|november|desember|december)\s+(20\d{2})\b/iu,
  );

  if (!namedMatch) {
    return null;
  }

  return `${namedMatch[2]}-${namedMonths[namedMatch[1].toLocaleLowerCase("id-ID")]}`;
}

function collectMetadataText(
  worksheet: WorksheetInspection,
  header: HeaderCandidate,
): string[] {
  const beforeHeader = worksheet.rows
    .slice(0, header.headerRowIndex)
    .flatMap((row) => row)
    .map((cell) => cell.value)
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

  return [...new Set([...beforeHeader, ...worksheet.metadataCandidates])];
}

function extractFromText(
  text: string,
): { companyCode: string; poNumber: string } | null {
  const normalizedText = collapseWhitespace(text);
  const directMatch = normalizedText.match(
    /\b(?:lampiran\s+)?po\b\s*[:#-]?\s*([a-z0-9]{2,10})\s+(.+)$/iu,
  );

  if (directMatch) {
    const candidateCode = directMatch[1].toUpperCase();

    if (!["NO", "NOMOR", "NUMBER"].includes(candidateCode)) {
      return {
        companyCode: candidateCode,
        poNumber: directMatch[2].trim(),
      };
    }
  }

  const knownCode = Object.keys(COMPANY_MAPPINGS).find((code) =>
    new RegExp(`\\b${code}\\b`, "iu").test(normalizedText),
  );
  const genericPoMatch = normalizedText.match(
    /\bpo\b(?:\s+(?:no|nomor|number))?\s*[:#-]?\s*(.+)$/iu,
  );

  if (!knownCode || !genericPoMatch) {
    return null;
  }

  const withoutLeadingCode = genericPoMatch[1]
    .replace(new RegExp(`^${knownCode}\\s+`, "iu"), "")
    .trim();

  return {
    companyCode: knownCode,
    poNumber: withoutLeadingCode,
  };
}

export function extractPurchaseOrderMetadata(
  worksheet: WorksheetInspection,
  header: HeaderCandidate,
): ExtractedPurchaseOrderMetadata {
  const candidates = collectMetadataText(worksheet, header);

  for (const candidate of candidates) {
    const extracted = extractFromText(candidate);

    if (!extracted || extracted.poNumber.length === 0) {
      continue;
    }

    const companyCode = extracted.companyCode.toUpperCase();
    const mappedCompanyName = getCompanyName(companyCode);
    const warnings = mappedCompanyName
      ? []
      : [
          {
            code: "COMPANY_MAPPING_NOT_FOUND",
            message: `Mapping nama perusahaan untuk kode ${companyCode} belum tersedia; kode digunakan sebagai nama sementara.`,
            sheet: worksheet.sheetName,
          },
        ];

    return {
      companyCode,
      companyName: mappedCompanyName ?? companyCode,
      normalizedPoNumber: normalizePoNumber(extracted.poNumber),
      period: extractPeriod(`${candidate} ${extracted.poNumber}`),
      poNumber: collapseWhitespace(extracted.poNumber),
      warnings,
    };
  }

  throw new ImportPipelineError(
    "PO_METADATA_NOT_FOUND",
    "Nomor PO tidak ditemukan.",
    {
      issues: [
        {
          code: "PO_METADATA_NOT_FOUND",
          message: "Nomor PO tidak ditemukan pada area metadata workbook.",
          sheet: worksheet.sheetName,
        },
      ],
    },
  );
}

import {
  EXCEL_MIME_TYPES,
  MAX_IMPORT_FILE_BYTES,
  SUPPORTED_EXCEL_EXTENSIONS,
} from "@/features/imports/config/import-limits";
import type { ImportIssue } from "@/features/imports/types/import-types";

export type ImportFileDescriptor = {
  name: string;
  size: number;
  type: string;
};

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot < 0 ? "" : fileName.slice(lastDot).toLocaleLowerCase("en-US");
}

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/u).at(-1) ?? "file-excel";
  const sanitized = baseName
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}._() -]/gu, "_")
    .replace(/^\.+/u, "")
    .slice(0, 180)
    .trim();

  return sanitized || "file-excel";
}

export function validateFileDescriptor(
  file: ImportFileDescriptor,
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const extension = getExtension(file.name);

  if (
    !SUPPORTED_EXCEL_EXTENSIONS.includes(
      extension as (typeof SUPPORTED_EXCEL_EXTENSIONS)[number],
    )
  ) {
    issues.push({
      code: "UNSUPPORTED_FILE_EXTENSION",
      message: "Format file harus .xls atau .xlsx.",
    });
  }

  if (file.size <= 0) {
    issues.push({
      code: "EMPTY_FILE",
      message: "File Excel kosong dan tidak dapat di-import.",
    });
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    issues.push({
      code: "FILE_TOO_LARGE",
      message: "Ukuran file melebihi batas 10 MB.",
    });
  }

  if (file.type && !EXCEL_MIME_TYPES.has(file.type)) {
    issues.push({
      code: "UNSUPPORTED_MIME_TYPE",
      message: "Tipe file tidak dikenali sebagai workbook Excel.",
    });
  }

  return issues;
}

export function validateWorkbookSignature(
  buffer: Uint8Array,
  fileName: string,
): ImportIssue[] {
  const extension = getExtension(fileName);
  const isOle =
    buffer.length >= 8 &&
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every(
      (byte, index) => buffer[index] === byte,
    );
  const isZip =
    buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  const signatureMatches =
    (extension === ".xls" && isOle) || (extension === ".xlsx" && isZip);

  return signatureMatches
    ? []
    : [
        {
          code: "INVALID_WORKBOOK_SIGNATURE",
          message: "Isi file tidak sesuai dengan format Excel yang dipilih.",
        },
      ];
}

/**
 * Filename sanitizer untuk output PDF.
 *
 * Menghasilkan nama file yang aman untuk sistem operasi Windows/macOS/Linux
 * dari nomor PO dan cabang. Bersifat pure dan dapat diuji.
 */

const FORBIDDEN_CHARS = /[/\\:*?"<>|]/g;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const MAX_LENGTH = 120;

/** Nama reserved Windows yang tidak boleh dipakai sebagai basename file. */
const WINDOWS_RESERVED = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

function normalizeSegment(value: string): string {
  return value
    .trim()
    .replace(FORBIDDEN_CHARS, "-")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/[-. ]+$/g, "")
    .trim();
}

/**
 * Menghasilkan nama file PDF aman.
 *
 * Format: `Surat-Jalan_<Nomor-PO>_<Cabang>.pdf`
 */
export function buildPdfFilename(poNumber: string, branchName: string): string {
  const poSegment = normalizeSegment(poNumber) || "PO";
  const branchSegment = normalizeSegment(branchName) || "Cabang";

  let base = `Surat-Jalan_${poSegment}_${branchSegment}`;

  // Batasi panjang (termasuk ".pdf").
  if (base.length > MAX_LENGTH - 4) {
    base = base.slice(0, MAX_LENGTH - 4);
    base = base.replace(/[. ]+$/g, "");
  }

  // Tangani nama reserved Windows.
  const upper = base.toLocaleUpperCase("en-US");
  const firstSegment = upper.split("_")[0] ?? "";
  if (WINDOWS_RESERVED.has(firstSegment)) {
    base = `_${base}`;
  }

  return `${base}.pdf`;
}

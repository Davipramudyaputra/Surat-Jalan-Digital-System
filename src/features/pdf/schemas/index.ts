import { z } from "zod";

/**
 * Validasi input request PDF individual.
 *
 * Hanya menerima nilai yang telah diketahui/divalidasi. Tidak menerima
 * raw CSS page size dari client.
 */

export const pdfPaperSizeSchema = z.enum([
  "HALF_FOLIO",
  "A4",
  "A5",
  "B3",
  "CUSTOM",
]);

export const pdfOrientationSchema = z.enum(["PORTRAIT", "LANDSCAPE"]);

/** Batas custom paper — sama dengan Phase 4 (CUSTOM_PAPER_LIMITS). */
export const PDF_CUSTOM_PAPER_LIMITS = {
  minDimensionMm: 148,
  maxDimensionMm: 1000,
  minContentDimensionMm: 128,
  minMarginMm: 0,
  maxMarginMm: 40,
} as const;

function finitePositiveNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

/**
 * Validasi dimensi custom. Mengembalikan daftar error dalam Bahasa Indonesia.
 */
export function validateCustomPaperDimensions(
  widthMm: unknown,
  heightMm: unknown,
  marginMm: unknown,
): string[] {
  const errors: string[] = [];
  const { minDimensionMm, maxDimensionMm, minContentDimensionMm, minMarginMm, maxMarginMm } =
    PDF_CUSTOM_PAPER_LIMITS;

  if (!finitePositiveNumber(widthMm)) {
    errors.push("Lebar custom wajib berupa angka positif.");
  } else if (widthMm < minDimensionMm) {
    errors.push(`Lebar custom minimal ${minDimensionMm} mm.`);
  } else if (widthMm > maxDimensionMm) {
    errors.push(`Lebar custom maksimal ${maxDimensionMm} mm.`);
  }

  if (!finitePositiveNumber(heightMm)) {
    errors.push("Tinggi custom wajib berupa angka positif.");
  } else if (heightMm < minDimensionMm) {
    errors.push(`Tinggi custom minimal ${minDimensionMm} mm.`);
  } else if (heightMm > maxDimensionMm) {
    errors.push(`Tinggi custom maksimal ${maxDimensionMm} mm.`);
  }

  if (
    typeof marginMm !== "number" ||
    !Number.isFinite(marginMm) ||
    marginMm < minMarginMm
  ) {
    errors.push(`Margin custom minimal ${minMarginMm} mm.`);
  } else if (marginMm > maxMarginMm) {
    errors.push(`Margin custom maksimal ${maxMarginMm} mm.`);
  }

  if (
    finitePositiveNumber(widthMm) &&
    finitePositiveNumber(heightMm) &&
    typeof marginMm === "number" &&
    Number.isFinite(marginMm)
  ) {
    if (
      widthMm - marginMm * 2 < minContentDimensionMm ||
      heightMm - marginMm * 2 < minContentDimensionMm
    ) {
      errors.push(
        "Ukuran dan margin custom menyisakan area konten yang terlalu kecil.",
      );
    }
  }

  return errors;
}

export const pdfDownloadQuerySchema = z.object({
  id: z.string().min(1),
  paper: pdfPaperSizeSchema.default("HALF_FOLIO"),
  orientation: pdfOrientationSchema.default("LANDSCAPE"),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  margin: z.coerce.number().optional(),
});

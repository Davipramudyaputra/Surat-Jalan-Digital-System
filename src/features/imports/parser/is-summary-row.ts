import { SUMMARY_ROW_MARKERS } from "@/features/imports/config/header-aliases";
import { normalizeHeaderValue } from "@/features/imports/normalization/normalize-key";

export function isSummaryRow(value: unknown): boolean {
  const normalized = normalizeHeaderValue(value);

  if (!normalized) {
    return false;
  }

  return SUMMARY_ROW_MARKERS.some(
    (marker) =>
      normalized === marker ||
      normalized.startsWith(`${marker} `) ||
      normalized.endsWith(` ${marker}`),
  );
}

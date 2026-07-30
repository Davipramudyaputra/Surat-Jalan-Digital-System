import { collapseWhitespace } from "@/features/imports/normalization/normalize-key";

export function normalizePoNumber(value: string): string {
  return collapseWhitespace(value)
    .toLocaleUpperCase("id-ID")
    .replace(/\s*\/\s*/gu, "/")
    .replace(/\s*-\s*/gu, "-");
}

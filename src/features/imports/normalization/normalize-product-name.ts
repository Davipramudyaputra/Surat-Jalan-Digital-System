import { normalizeLookupKey } from "@/features/imports/normalization/normalize-key";

export function normalizeProductName(value: string): string {
  return normalizeLookupKey(value);
}

import {
  PRODUCT_ACRONYMS,
  PRODUCT_DISPLAY_MAPPINGS,
} from "@/features/imports/config/product-display-mappings";
import { collapseWhitespace } from "@/features/imports/normalization/normalize-key";
import { normalizeProductName } from "@/features/imports/normalization/normalize-product-name";

function normalizeParenthesisSpacing(value: string): string {
  return value.replace(/\(\s+/gu, "(").replace(/\s+\)/gu, ")");
}

function applyConfiguredAcronyms(value: string): string {
  return value.replace(/\p{L}+/gu, (word) => {
    const uppercase = word.toLocaleUpperCase("id-ID");
    return PRODUCT_ACRONYMS.has(uppercase) ? uppercase : word;
  });
}

function toReadableTitleCase(value: string): string {
  return value.replace(/\p{L}+/gu, (word) => {
    const uppercase = word.toLocaleUpperCase("id-ID");

    if (PRODUCT_ACRONYMS.has(uppercase)) {
      return uppercase;
    }

    return `${word.charAt(0).toLocaleUpperCase("id-ID")}${word
      .slice(1)
      .toLocaleLowerCase("id-ID")}`;
  });
}

export function formatProductDisplayName(value: string): string {
  const cleaned = normalizeParenthesisSpacing(collapseWhitespace(value));
  const normalized = normalizeProductName(cleaned);
  const mapped = PRODUCT_DISPLAY_MAPPINGS[normalized];

  if (mapped) {
    return mapped;
  }

  const letters = cleaned.replace(/[^\p{L}]/gu, "");
  const isAllUppercase =
    letters.length > 0 &&
    letters === letters.toLocaleUpperCase("id-ID") &&
    letters !== letters.toLocaleLowerCase("id-ID");

  return isAllUppercase
    ? toReadableTitleCase(cleaned)
    : applyConfiguredAcronyms(cleaned);
}

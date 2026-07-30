export function collapseWhitespace(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function normalizeLookupKey(value: string): string {
  return collapseWhitespace(value)
    .toLocaleLowerCase("id-ID")
    .replace(/\s*([()[\]/-])\s*/gu, "$1");
}

export function normalizeHeaderValue(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return collapseWhitespace(String(value))
    .toLocaleLowerCase("id-ID")
    .replace(/[.:]/gu, "")
    .replace(/\s+/gu, " ");
}

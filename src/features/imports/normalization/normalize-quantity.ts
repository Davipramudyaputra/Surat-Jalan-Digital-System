import type {
  WorkbookCell,
  WorkbookCellValue,
} from "@/features/imports/types/import-types";

export type NormalizedQuantity =
  | {
      kind: "valid";
      value: string;
    }
  | {
      kind: "skip";
      reason: "empty" | "zero" | "dash";
    }
  | {
      code: "FORMULA_RESULT_MISSING" | "NEGATIVE_QUANTITY" | "INVALID_QUANTITY";
      kind: "error";
      message: string;
    };

function isWorkbookCell(
  value: WorkbookCellValue | WorkbookCell,
): value is WorkbookCell {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    "address" in value &&
    "value" in value
  );
}

function canonicalizeDecimal(value: string): string | null {
  const compact = value.replace(/\s+/gu, "");

  if (!/^[+]?\d+(?:[.,]\d+)*$/u.test(compact)) {
    return null;
  }

  const unsigned = compact.replace(/^\+/u, "");
  const hasDot = unsigned.includes(".");
  const hasComma = unsigned.includes(",");
  let canonical: string;

  if (hasDot && hasComma) {
    const decimalSeparator =
      unsigned.lastIndexOf(".") > unsigned.lastIndexOf(",")
        ? "."
        : ",";
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";
    const pieces = unsigned.split(decimalSeparator);

    if (pieces.length !== 2) {
      return null;
    }

    const integerPart = pieces[0].split(thousandsSeparator);
    const fractionPart = pieces[1];
    const validThousands =
      integerPart[0].length >= 1 &&
      integerPart[0].length <= 3 &&
      integerPart.slice(1).every((part) => part.length === 3);

    if (!validThousands || !/^\d+$/u.test(fractionPart)) {
      return null;
    }

    canonical = `${integerPart.join("")}.${fractionPart}`;
  } else if (hasDot || hasComma) {
    const separator = hasDot ? "." : ",";
    const escapedSeparator = separator === "." ? "\\." : ",";
    const thousandsPattern = new RegExp(
      `^\\d{1,3}(?:${escapedSeparator}\\d{3})+$`,
      "u",
    );

    canonical = thousandsPattern.test(unsigned)
      ? unsigned.split(separator).join("")
      : unsigned.replace(separator, ".");

    if ((canonical.match(/\./gu) ?? []).length > 1) {
      return null;
    }
  } else {
    canonical = unsigned;
  }

  if (!/^\d+(?:\.\d+)?$/u.test(canonical)) {
    return null;
  }

  const [integerPart, fractionPart] = canonical.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/u, "");
  const normalizedFraction = fractionPart?.replace(/0+$/u, "");

  return normalizedFraction
    ? `${normalizedInteger}.${normalizedFraction}`
    : normalizedInteger;
}

export function normalizeQuantity(
  input: WorkbookCellValue | WorkbookCell,
): NormalizedQuantity {
  const cell = isWorkbookCell(input) ? input : undefined;
  const value = cell ? cell.value : input;

  if (cell?.formula && (value === null || value === "")) {
    return {
      code: "FORMULA_RESULT_MISSING",
      kind: "error",
      message: "Formula Excel tidak memiliki hasil tersimpan yang dapat dibaca.",
    };
  }

  if (value === null || value === undefined) {
    return { kind: "skip", reason: "empty" };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return { kind: "skip", reason: "empty" };
    }

    if (/^[-–—]$/u.test(trimmed)) {
      return { kind: "skip", reason: "dash" };
    }

    if (trimmed.startsWith("-")) {
      return {
        code: "NEGATIVE_QUANTITY",
        kind: "error",
        message: "Kuantitas tidak boleh bernilai negatif.",
      };
    }

    const canonical = canonicalizeDecimal(trimmed);

    if (canonical === null) {
      return {
        code: "INVALID_QUANTITY",
        kind: "error",
        message: "Kuantitas harus berupa angka yang valid.",
      };
    }

    if (/^0(?:\.0+)?$/u.test(canonical)) {
      return { kind: "skip", reason: "zero" };
    }

    return { kind: "valid", value: canonical };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return {
        code: "INVALID_QUANTITY",
        kind: "error",
        message: "Kuantitas harus berupa angka yang valid.",
      };
    }

    if (value < 0) {
      return {
        code: "NEGATIVE_QUANTITY",
        kind: "error",
        message: "Kuantitas tidak boleh bernilai negatif.",
      };
    }

    if (value === 0) {
      return { kind: "skip", reason: "zero" };
    }

    return { kind: "valid", value: value.toString() };
  }

  return {
    code: "INVALID_QUANTITY",
    kind: "error",
    message: "Kuantitas harus berupa angka yang valid.",
  };
}

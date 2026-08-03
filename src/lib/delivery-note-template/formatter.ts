const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

function dateParts(value: Date | string): {
  day: number;
  month: number;
  year: number;
} | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return {
      day: value.getUTCDate(),
      month: value.getUTCMonth() + 1,
      year: value.getUTCFullYear(),
    };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/u.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + 1 !== month ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

export function formatBusinessDate(value: Date | string | null): string {
  if (!value) {
    return "";
  }

  const parts = dateParts(value);
  if (!parts) {
    return "";
  }

  return `${parts.day} ${INDONESIAN_MONTHS[parts.month - 1]} ${parts.year}`;
}

export function formatBandungDate(value: Date | string | null): string {
  const formatted = formatBusinessDate(value);
  return formatted ? `Bandung, ${formatted}` : "Bandung, ____________________";
}

export type IndonesiaPrintDateParts = {
  dayMonth: string;
  century: string;
  yearSuffix: string;
  label: string;
};

function printDateParts({
  day,
  month,
  year,
}: {
  day: number;
  month: number;
  year: number;
}): IndonesiaPrintDateParts {
  const dayMonth = `${day} ${INDONESIAN_MONTHS[month - 1]}`;
  const yearText = year.toString().padStart(4, "0");

  return {
    dayMonth,
    century: yearText.slice(0, -2),
    yearSuffix: yearText.slice(-2),
    label: `Bandung, ${dayMonth} ${yearText}`,
  };
}

export function getBusinessDatePrintParts(
  value: Date | string | null,
): IndonesiaPrintDateParts | null {
  if (!value) {
    return null;
  }

  const parts = dateParts(value);
  return parts ? printDateParts(parts) : null;
}

export function getIndonesiaPrintDateParts(
  value: Date,
): IndonesiaPrintDateParts {
  if (Number.isNaN(value.getTime())) {
    return {
      dayMonth: "",
      century: "20",
      yearSuffix: "",
      label: "Bandung, ____________________",
    };
  }

  const formattedParts = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).formatToParts(value);
  const partValue = (type: Intl.DateTimeFormatPartTypes) =>
    formattedParts.find((part) => part.type === type)?.value ?? "";
  return printDateParts({
    day: Number(partValue("day")),
    month: INDONESIAN_MONTHS.findIndex(
      (month) => month === partValue("month"),
    ) + 1,
    year: Number(partValue("year")),
  });
}

export function formatIndonesiaPrintDate(value: Date): string {
  return getIndonesiaPrintDateParts(value).label;
}

function normalizeDecimalText(value: string): string {
  if (!value || /^(?:NaN|Infinity|-Infinity)$/iu.test(value)) {
    return "";
  }

  if (/^-?\d+\.\d+$/u.test(value)) {
    return value.replace(/0+$/u, "").replace(/\.$/u, "");
  }

  return value;
}

export function formatQuantity(
  quantity: { toString(): string } | string | number,
  unit: string | null,
): string {
  const value = normalizeDecimalText(quantity.toString().trim());
  const normalizedUnit = unit?.trim() ?? "";

  if (!value) {
    return "";
  }

  return [value, normalizedUnit].filter(Boolean).join(" ");
}

export function formatAuditDateTime(value: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) {
    return "Belum pernah dicetak";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

export type PaperOrientation = "PORTRAIT" | "LANDSCAPE";

export type PaperSizeId = "HALF_FOLIO" | "A4" | "A5" | "B3" | "CUSTOM";

export type PaperProfileId =
  | "HALF_FOLIO_LANDSCAPE"
  | "A4_PORTRAIT"
  | "A4_LANDSCAPE"
  | "A5_PORTRAIT"
  | "A5_LANDSCAPE"
  | "B3_PORTRAIT"
  | "B3_LANDSCAPE"
  | "CUSTOM";

export type PaperProfile = {
  id: PaperProfileId;
  paperSize: PaperSizeId;
  label: string;
  widthMm: number;
  heightMm: number;
  defaultOrientation: PaperOrientation;
  orientation: PaperOrientation;
  pagePaddingMm: number;
  pagePaddingInlineMm: number;
  pagePaddingBottomMm: number;
  fontScale: number;
  logoScale: number;
  spacingScale: number;
  tableRowScale: number;
  footerScale: number;
  warning?: string;
};

export type CustomPaperInput = {
  widthMm: number | string;
  heightMm: number | string;
  marginMm: number | string;
  orientation: PaperOrientation;
};

export type PaperProfileResolution = {
  profile: PaperProfile;
  errors: string[];
  warnings: string[];
  usesFallback: boolean;
};

export const CUSTOM_PAPER_LIMITS = {
  minDimensionMm: 148,
  maxDimensionMm: 1_000,
  minContentDimensionMm: 128,
  minMarginMm: 0,
  maxMarginMm: 40,
} as const;

export const PAPER_SIZE_OPTIONS: ReadonlyArray<{
  id: PaperSizeId;
  label: string;
}> = [
  { id: "HALF_FOLIO", label: "Setengah Folio — 210 × 165 mm" },
  { id: "A4", label: "A4 — 210 × 297 mm" },
  { id: "A5", label: "A5 — 148 × 210 mm" },
  { id: "B3", label: "B3 ISO — 353 × 500 mm" },
  { id: "CUSTOM", label: "Custom" },
];

const A5_WARNING =
  "Ukuran A5 lebih ringkas. Periksa nama barang dan keterangan panjang sebelum mencetak.";

export const PAPER_PROFILES: Readonly<Record<PaperProfileId, PaperProfile>> = {
  HALF_FOLIO_LANDSCAPE: {
    id: "HALF_FOLIO_LANDSCAPE",
    paperSize: "HALF_FOLIO",
    label: "Setengah Folio — Landscape",
    widthMm: 210,
    heightMm: 165,
    defaultOrientation: "LANDSCAPE",
    orientation: "LANDSCAPE",
    pagePaddingMm: 7,
    pagePaddingInlineMm: 11,
    pagePaddingBottomMm: 6,
    fontScale: 1,
    logoScale: 1,
    spacingScale: 1,
    tableRowScale: 1,
    footerScale: 1,
  },
  A4_PORTRAIT: {
    id: "A4_PORTRAIT",
    paperSize: "A4",
    label: "A4 — Portrait",
    widthMm: 210,
    heightMm: 297,
    defaultOrientation: "PORTRAIT",
    orientation: "PORTRAIT",
    pagePaddingMm: 12,
    pagePaddingInlineMm: 12,
    pagePaddingBottomMm: 12,
    fontScale: 1.12,
    logoScale: 1.05,
    spacingScale: 1.55,
    tableRowScale: 1.7,
    footerScale: 1.5,
  },
  A4_LANDSCAPE: {
    id: "A4_LANDSCAPE",
    paperSize: "A4",
    label: "A4 — Landscape",
    widthMm: 297,
    heightMm: 210,
    defaultOrientation: "PORTRAIT",
    orientation: "LANDSCAPE",
    pagePaddingMm: 10,
    pagePaddingInlineMm: 14,
    pagePaddingBottomMm: 10,
    fontScale: 1.16,
    logoScale: 1.25,
    spacingScale: 1.2,
    tableRowScale: 1.22,
    footerScale: 1.18,
  },
  A5_PORTRAIT: {
    id: "A5_PORTRAIT",
    paperSize: "A5",
    label: "A5 — Portrait",
    widthMm: 148,
    heightMm: 210,
    defaultOrientation: "PORTRAIT",
    orientation: "PORTRAIT",
    pagePaddingMm: 7,
    pagePaddingInlineMm: 7,
    pagePaddingBottomMm: 7,
    fontScale: 0.92,
    logoScale: 0.72,
    spacingScale: 1.18,
    tableRowScale: 1.32,
    footerScale: 1.18,
    warning: A5_WARNING,
  },
  A5_LANDSCAPE: {
    id: "A5_LANDSCAPE",
    paperSize: "A5",
    label: "A5 — Landscape",
    widthMm: 210,
    heightMm: 148,
    defaultOrientation: "PORTRAIT",
    orientation: "LANDSCAPE",
    pagePaddingMm: 6,
    pagePaddingInlineMm: 9,
    pagePaddingBottomMm: 5,
    fontScale: 0.9,
    logoScale: 0.92,
    spacingScale: 0.86,
    tableRowScale: 0.88,
    footerScale: 0.85,
    warning: A5_WARNING,
  },
  B3_PORTRAIT: {
    id: "B3_PORTRAIT",
    paperSize: "B3",
    label: "B3 ISO — Portrait",
    widthMm: 353,
    heightMm: 500,
    defaultOrientation: "PORTRAIT",
    orientation: "PORTRAIT",
    pagePaddingMm: 22,
    pagePaddingInlineMm: 22,
    pagePaddingBottomMm: 22,
    fontScale: 1.35,
    logoScale: 1.5,
    spacingScale: 2.3,
    tableRowScale: 2.5,
    footerScale: 2.1,
  },
  B3_LANDSCAPE: {
    id: "B3_LANDSCAPE",
    paperSize: "B3",
    label: "B3 ISO — Landscape",
    widthMm: 500,
    heightMm: 353,
    defaultOrientation: "PORTRAIT",
    orientation: "LANDSCAPE",
    pagePaddingMm: 20,
    pagePaddingInlineMm: 24,
    pagePaddingBottomMm: 20,
    fontScale: 1.42,
    logoScale: 1.65,
    spacingScale: 2,
    tableRowScale: 2.1,
    footerScale: 1.9,
  },
  CUSTOM: {
    id: "CUSTOM",
    paperSize: "CUSTOM",
    label: "Custom — Landscape",
    widthMm: 210,
    heightMm: 165,
    defaultOrientation: "LANDSCAPE",
    orientation: "LANDSCAPE",
    pagePaddingMm: 7,
    pagePaddingInlineMm: 7,
    pagePaddingBottomMm: 7,
    fontScale: 1,
    logoScale: 1,
    spacingScale: 1,
    tableRowScale: 1,
    footerScale: 1,
  },
};

export const DEFAULT_PAPER_PROFILE = PAPER_PROFILES.HALF_FOLIO_LANDSCAPE;

const FIXED_PROFILE_IDS: Record<
  Exclude<PaperSizeId, "CUSTOM" | "HALF_FOLIO">,
  Record<PaperOrientation, PaperProfileId>
> = {
  A4: { PORTRAIT: "A4_PORTRAIT", LANDSCAPE: "A4_LANDSCAPE" },
  A5: { PORTRAIT: "A5_PORTRAIT", LANDSCAPE: "A5_LANDSCAPE" },
  B3: { PORTRAIT: "B3_PORTRAIT", LANDSCAPE: "B3_LANDSCAPE" },
};

function finiteNumber(value: number | string): number {
  if (typeof value === "string" && value.trim() === "") {
    return Number.NaN;
  }
  return Number(value);
}

function roundToken(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function orientedDimensions(
  widthMm: number,
  heightMm: number,
  orientation: PaperOrientation,
): { widthMm: number; heightMm: number } {
  return orientation === "PORTRAIT"
    ? { widthMm: Math.min(widthMm, heightMm), heightMm: Math.max(widthMm, heightMm) }
    : { widthMm: Math.max(widthMm, heightMm), heightMm: Math.min(widthMm, heightMm) };
}

export function validateCustomPaper(input: CustomPaperInput): string[] {
  const widthMm = finiteNumber(input.widthMm);
  const heightMm = finiteNumber(input.heightMm);
  const marginMm = finiteNumber(input.marginMm);
  const errors: string[] = [];

  if (!Number.isFinite(widthMm)) {
    errors.push("Lebar custom wajib berupa angka.");
  }
  if (!Number.isFinite(heightMm)) {
    errors.push("Tinggi custom wajib berupa angka.");
  }
  if (!Number.isFinite(marginMm)) {
    errors.push("Margin custom wajib berupa angka.");
  }

  if (Number.isFinite(widthMm) && widthMm <= 0) {
    errors.push("Lebar custom harus lebih besar dari 0 mm.");
  }
  if (Number.isFinite(heightMm) && heightMm <= 0) {
    errors.push("Tinggi custom harus lebih besar dari 0 mm.");
  }
  if (Number.isFinite(marginMm) && marginMm < CUSTOM_PAPER_LIMITS.minMarginMm) {
    errors.push("Margin custom tidak boleh negatif.");
  }

  if (
    Number.isFinite(widthMm) &&
    widthMm > 0 &&
    widthMm < CUSTOM_PAPER_LIMITS.minDimensionMm
  ) {
    errors.push(
      `Lebar custom minimal ${CUSTOM_PAPER_LIMITS.minDimensionMm} mm.`,
    );
  }
  if (
    Number.isFinite(heightMm) &&
    heightMm > 0 &&
    heightMm < CUSTOM_PAPER_LIMITS.minDimensionMm
  ) {
    errors.push(
      `Tinggi custom minimal ${CUSTOM_PAPER_LIMITS.minDimensionMm} mm.`,
    );
  }
  if (widthMm > CUSTOM_PAPER_LIMITS.maxDimensionMm) {
    errors.push(
      `Lebar custom maksimal ${CUSTOM_PAPER_LIMITS.maxDimensionMm} mm.`,
    );
  }
  if (heightMm > CUSTOM_PAPER_LIMITS.maxDimensionMm) {
    errors.push(
      `Tinggi custom maksimal ${CUSTOM_PAPER_LIMITS.maxDimensionMm} mm.`,
    );
  }
  if (marginMm > CUSTOM_PAPER_LIMITS.maxMarginMm) {
    errors.push(
      `Margin custom maksimal ${CUSTOM_PAPER_LIMITS.maxMarginMm} mm.`,
    );
  }

  if (
    errors.length === 0 &&
    (widthMm - marginMm * 2 < CUSTOM_PAPER_LIMITS.minContentDimensionMm ||
      heightMm - marginMm * 2 < CUSTOM_PAPER_LIMITS.minContentDimensionMm)
  ) {
    errors.push(
      "Ukuran dan margin custom menyisakan area konten yang terlalu kecil untuk Surat Jalan.",
    );
  }

  return errors;
}

function customProfile(input: CustomPaperInput): PaperProfile {
  const rawWidthMm = finiteNumber(input.widthMm);
  const rawHeightMm = finiteNumber(input.heightMm);
  const marginMm = finiteNumber(input.marginMm);
  const { widthMm, heightMm } = orientedDimensions(
    rawWidthMm,
    rawHeightMm,
    input.orientation,
  );
  const widthRatio = widthMm / DEFAULT_PAPER_PROFILE.widthMm;
  const heightRatio = heightMm / DEFAULT_PAPER_PROFILE.heightMm;
  const areaRatio =
    (widthMm * heightMm) /
    (DEFAULT_PAPER_PROFILE.widthMm * DEFAULT_PAPER_PROFILE.heightMm);

  return {
    ...PAPER_PROFILES.CUSTOM,
    label: `Custom ${widthMm} × ${heightMm} mm — ${input.orientation === "PORTRAIT" ? "Portrait" : "Landscape"}`,
    widthMm,
    heightMm,
    orientation: input.orientation,
    defaultOrientation: input.orientation,
    pagePaddingMm: marginMm,
    pagePaddingInlineMm: marginMm,
    pagePaddingBottomMm: marginMm,
    fontScale: roundToken(clamp(Math.sqrt(areaRatio), 0.88, 1.45)),
    logoScale: roundToken(clamp(widthRatio, 0.72, 1.65)),
    spacingScale: roundToken(clamp(heightRatio, 0.8, 2.5)),
    tableRowScale: roundToken(clamp(heightRatio, 0.8, 2.6)),
    footerScale: roundToken(clamp(heightRatio, 0.8, 2.3)),
  };
}

export function resolvePaperProfile(
  paperSize: PaperSizeId,
  orientation: PaperOrientation,
  customInput: CustomPaperInput,
): PaperProfileResolution {
  if (paperSize === "HALF_FOLIO") {
    return {
      profile: DEFAULT_PAPER_PROFILE,
      errors: [],
      warnings: [],
      usesFallback: false,
    };
  }

  if (paperSize === "CUSTOM") {
    const errors = validateCustomPaper(customInput);
    if (errors.length > 0) {
      return {
        profile: DEFAULT_PAPER_PROFILE,
        errors,
        warnings: [],
        usesFallback: true,
      };
    }

    return {
      profile: customProfile(customInput),
      errors: [],
      warnings: [],
      usesFallback: false,
    };
  }

  const profile = PAPER_PROFILES[FIXED_PROFILE_IDS[paperSize][orientation]];
  return {
    profile,
    errors: [],
    warnings: profile.warning ? [profile.warning] : [],
    usesFallback: false,
  };
}

export function getPaperCssVariables(
  profile: PaperProfile,
): Record<`--${string}`, string> {
  const widthScale = clamp(
    profile.widthMm / DEFAULT_PAPER_PROFILE.widthMm,
    0.7,
    1.65,
  );
  const mm = (value: number) => `${roundToken(value)}mm`;
  const font = (value: number) => mm(value * profile.fontScale);

  return {
    "--paper-width": `${profile.widthMm}mm`,
    "--paper-height": `${profile.heightMm}mm`,
    "--page-padding-top": `${profile.pagePaddingMm}mm`,
    "--page-padding-inline": `${profile.pagePaddingInlineMm}mm`,
    "--page-padding-bottom": `${profile.pagePaddingBottomMm}mm`,
    "--document-font-scale": profile.fontScale.toString(),
    "--logo-scale": profile.logoScale.toString(),
    "--spacing-scale": profile.spacingScale.toString(),
    "--table-row-scale": profile.tableRowScale.toString(),
    "--footer-scale": profile.footerScale.toString(),
    "--layout-width-scale": roundToken(widthScale).toString(),
    "--section-gap": `${roundToken(clamp(profile.spacingScale, 0.75, 2.2))}mm`,
    "--header-track": `${roundToken(29 * profile.spacingScale)}fr`,
    "--information-track": `${roundToken(18 * profile.spacingScale)}fr`,
    "--table-track": `${roundToken(78 * profile.tableRowScale)}fr`,
    "--footer-track": `${roundToken(24 * profile.footerScale)}fr`,
    "--font-2-5": font(2.5),
    "--font-2-75": font(2.75),
    "--font-3": font(3),
    "--font-3-2": font(3.2),
    "--font-3-25": font(3.25),
    "--font-3-3": font(3.3),
    "--font-3-35": font(3.35),
    "--font-3-4": font(3.4),
    "--font-3-5": font(3.5),
    "--font-3-7": font(3.7),
    "--font-4-4": font(4.4),
    "--logo-width": mm(92 * profile.logoScale),
    "--logo-max-height": mm(27 * profile.logoScale),
    "--header-gap": mm(9 * widthScale),
    "--date-main-field-min-width": mm(25 * widthScale),
    "--date-year-field-width": mm(13 * widthScale),
    "--date-field-height": mm(4.8 * profile.spacingScale),
    "--recipient-label-width": mm(22 * widthScale),
    "--branch-label-width": mm(23 * widthScale),
    "--branch-indent": mm(8 * widthScale),
    "--recipient-blank-height": mm(4.5 * profile.spacingScale),
    "--information-po-width": mm(62 * widthScale),
    "--information-gap": mm(4 * widthScale),
    "--table-cell-padding-block": mm(0.5 * profile.spacingScale),
    "--table-cell-padding-inline": mm(1.6 * widthScale),
    "--footer-gap": mm(3 * widthScale),
    "--rule-width": mm(
      clamp(0.35 * Math.sqrt(profile.fontScale), 0.3, 0.55),
    ),
  };
}

function safeMillimetres(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

export function buildPrintPageCss(profile: PaperProfile): string {
  return `@page { size: ${safeMillimetres(profile.widthMm)}mm ${safeMillimetres(profile.heightMm)}mm; margin: 0; }`;
}

const CSS_PIXELS_PER_MM = 96 / 25.4;

export function calculatePreviewScale(
  containerWidthPx: number,
  paperWidthMm: number,
  horizontalPaddingPx = 48,
): number {
  if (
    !Number.isFinite(containerWidthPx) ||
    !Number.isFinite(paperWidthMm) ||
    containerWidthPx <= 0 ||
    paperWidthMm <= 0
  ) {
    return 1;
  }

  const availableWidth = Math.max(1, containerWidthPx - horizontalPaddingPx);
  const physicalWidthPx = paperWidthMm * CSS_PIXELS_PER_MM;
  return roundToken(Math.min(1, availableWidth / physicalWidthPx));
}

export function paperMillimetresToPixels(value: number): number {
  return value * CSS_PIXELS_PER_MM;
}

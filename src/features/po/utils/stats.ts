export type POStats = {
  totalCount: number;
  totalItemCount: number;
  printedCount: number;
  notPrintedCount: number;
  printedPercentage: number;
  notPrintedPercentage: number;
  status: "Kosong" | "Belum Dimulai" | "Dalam Proses" | "Selesai";
};

export function calculatePOStats(
  totalCount: number,
  printedCount: number,
  totalItemCount = 0,
): POStats {
  const safeTotalCount = Math.max(0, totalCount);
  const safePrintedCount = Math.min(
    safeTotalCount,
    Math.max(0, printedCount),
  );
  const notPrintedCount = safeTotalCount - safePrintedCount;

  let printedPercentage = 0;
  let notPrintedPercentage = 0;

  if (safeTotalCount > 0) {
    printedPercentage = Math.round((safePrintedCount / safeTotalCount) * 1000) / 10;
    notPrintedPercentage = Math.round((notPrintedCount / safeTotalCount) * 1000) / 10;
    // ensure they don't exceed 100 and not below 0
    printedPercentage = Math.min(100, Math.max(0, printedPercentage));
    notPrintedPercentage = Math.min(100, Math.max(0, notPrintedPercentage));
  }

  let status: POStats["status"] = "Kosong";
  if (safeTotalCount > 0) {
    if (safePrintedCount === 0) {
      status = "Belum Dimulai";
    } else if (safePrintedCount === safeTotalCount) {
      status = "Selesai";
    } else {
      status = "Dalam Proses";
    }
  }

  return {
    totalCount: safeTotalCount,
    totalItemCount: Math.max(0, totalItemCount),
    printedCount: safePrintedCount,
    notPrintedCount,
    printedPercentage,
    notPrintedPercentage,
    status,
  };
}

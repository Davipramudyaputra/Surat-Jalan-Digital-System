type CurrentPrintAudit = {
  firstPrintedAt: Date | null;
  printCount: number;
};

export type NextPrintAudit = {
  firstPrintedAt: Date;
  lastPrintedAt: Date;
  printCount: number;
  printStatus: "PRINTED";
};

export function calculateNextPrintAudit(
  current: CurrentPrintAudit,
  serverTime: Date,
): NextPrintAudit {
  return {
    printStatus: "PRINTED",
    firstPrintedAt: current.firstPrintedAt ?? serverTime,
    lastPrintedAt: serverTime,
    printCount: current.printCount + 1,
  };
}

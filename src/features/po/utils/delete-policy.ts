type PurchaseOrderDeleteStats = {
  totalCount: number;
  printedCount: number;
  notPrintedCount: number;
};

export function canDeletePurchaseOrder({
  totalCount,
  printedCount,
  notPrintedCount,
}: PurchaseOrderDeleteStats): boolean {
  return (
    Number.isInteger(totalCount) &&
    Number.isInteger(printedCount) &&
    Number.isInteger(notPrintedCount) &&
    totalCount >= 0 &&
    printedCount >= 0 &&
    notPrintedCount >= 0 &&
    notPrintedCount === 0 &&
    printedCount === totalCount
  );
}

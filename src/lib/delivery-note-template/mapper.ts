import { formatQuantity } from "./formatter";
import type {
  DeliveryNoteDocumentData,
  DeliveryNoteTemplateSource,
} from "./types";

function text(value: string | null): string {
  return value?.trim() ?? "";
}

function dateKey(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }

  const match = /^(\d{4}-\d{2}-\d{2})(?:T.*)?$/u.exec(value.trim());
  return match?.[1] ?? null;
}

export function mapDeliveryNoteToDocument(
  source: DeliveryNoteTemplateSource,
): DeliveryNoteDocumentData {
  const sortedItems = [...source.items].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
  );

  return {
    id: source.id,
    purchaseOrderId: source.purchaseOrderId,
    uniqueCode: source.uniqueCode,
    documentNumber: text(source.documentNumber),
    documentDate: dateKey(source.documentDate),
    recipientCompanyName: source.recipientCompanyName.trim(),
    companyCode: source.purchaseOrder.companyCode.trim(),
    branchName: source.branchName.trim(),
    poNumber: source.purchaseOrder.poNumber.trim(),
    vehicleName: text(source.vehicleName),
    vehicleNumber: text(source.vehicleNumber),
    additionalPoNumber: text(source.additionalPoNumber),
    recipientName: text(source.recipientName),
    updatedAt: source.updatedAt,
    items: sortedItems.map((item) => ({
      id: item.id,
      quantity: formatQuantity(item.quantity, item.unit),
      productName: item.displayProductName.trim(),
      description: text(item.description),
      sortOrder: item.sortOrder,
    })),
  };
}

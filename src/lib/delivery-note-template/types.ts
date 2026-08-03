export type StringifiableQuantity = {
  toString(): string;
};

export type DeliveryNoteTemplateSource = {
  id: string;
  purchaseOrderId: string;
  uniqueCode: string;
  documentNumber: string | null;
  documentDate: Date | string | null;
  recipientCompanyName: string;
  branchName: string;
  vehicleName: string | null;
  vehicleNumber: string | null;
  additionalPoNumber: string | null;
  recipientName: string | null;
  updatedAt: Date;
  purchaseOrder: {
    companyCode: string;
    poNumber: string;
  };
  items: Array<{
    id: string;
    quantity: StringifiableQuantity;
    unit: string | null;
    displayProductName: string;
    originalProductName: string;
    description: string | null;
    sortOrder: number;
  }>;
};

export type DeliveryNoteDocumentItem = {
  id: string;
  quantity: string;
  productName: string;
  description: string;
  sortOrder: number;
};

export type DeliveryNoteDocumentData = {
  id: string;
  purchaseOrderId: string;
  uniqueCode: string;
  documentNumber: string;
  documentDate: string | null;
  recipientCompanyName: string;
  companyCode: string;
  branchName: string;
  poNumber: string;
  vehicleName: string;
  vehicleNumber: string;
  additionalPoNumber: string;
  recipientName: string;
  updatedAt: Date;
  items: DeliveryNoteDocumentItem[];
};

export type DeliveryNoteDocumentRow = {
  item: DeliveryNoteDocumentItem | null;
  visualRowSpan: number;
};

export type DeliveryNoteDocumentPage = {
  pageNumber: number;
  totalPages: number;
  rows: DeliveryNoteDocumentRow[];
};

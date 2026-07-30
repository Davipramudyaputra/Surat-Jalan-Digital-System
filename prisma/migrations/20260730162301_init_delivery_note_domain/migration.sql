-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'IMPORTED', 'DUPLICATE', 'FAILED');

-- CreateEnum
CREATE TYPE "PrintStatus" AS ENUM ('NOT_PRINTED', 'PRINTED');

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "importStatus" "ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "detectedSheetName" TEXT,
    "detectedHeaderRow" INTEGER,
    "detectionConfidence" INTEGER,
    "purchaseOrderCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryNoteCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "normalizedPoNumber" TEXT NOT NULL,
    "period" TEXT,
    "lastSourceUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "recipientCompanyName" TEXT NOT NULL,
    "originalBranchName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "normalizedBranchName" TEXT NOT NULL,
    "vehicleName" TEXT,
    "vehicleNumber" TEXT,
    "additionalPoNumber" TEXT,
    "recipientName" TEXT,
    "printStatus" "PrintStatus" NOT NULL DEFAULT 'NOT_PRINTED',
    "firstPrintedAt" TIMESTAMP(3),
    "lastPrintedAt" TIMESTAMP(3),
    "printCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNoteItem" (
    "id" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "originalProductName" TEXT NOT NULL,
    "displayProductName" TEXT NOT NULL,
    "normalizedProductName" TEXT NOT NULL,
    "sourceQuantity" DECIMAL(20,3) NOT NULL,
    "quantity" DECIMAL(20,3) NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Upload_fileHash_idx" ON "Upload"("fileHash");

-- CreateIndex
CREATE INDEX "Upload_importStatus_idx" ON "Upload"("importStatus");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyCode_idx" ON "PurchaseOrder"("companyCode");

-- CreateIndex
CREATE INDEX "PurchaseOrder_normalizedPoNumber_idx" ON "PurchaseOrder"("normalizedPoNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_lastSourceUploadId_idx" ON "PurchaseOrder"("lastSourceUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyCode_normalizedPoNumber_key" ON "PurchaseOrder"("companyCode", "normalizedPoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_uniqueCode_key" ON "DeliveryNote"("uniqueCode");

-- CreateIndex
CREATE INDEX "DeliveryNote_normalizedBranchName_idx" ON "DeliveryNote"("normalizedBranchName");

-- CreateIndex
CREATE INDEX "DeliveryNote_printStatus_idx" ON "DeliveryNote"("printStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_purchaseOrderId_normalizedBranchName_key" ON "DeliveryNote"("purchaseOrderId", "normalizedBranchName");

-- CreateIndex
CREATE INDEX "DeliveryNoteItem_deliveryNoteId_idx" ON "DeliveryNoteItem"("deliveryNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNoteItem_deliveryNoteId_normalizedProductName_key" ON "DeliveryNoteItem"("deliveryNoteId", "normalizedProductName");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_lastSourceUploadId_fkey" FOREIGN KEY ("lastSourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

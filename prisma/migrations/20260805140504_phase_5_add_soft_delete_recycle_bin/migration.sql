-- DropIndex
DROP INDEX "DeliveryNote_purchaseOrderId_normalizedBranchName_key";

-- DropIndex
DROP INDEX "DeliveryNote_uniqueCode_key";

-- DropIndex
DROP INDEX "PurchaseOrder_companyCode_normalizedPoNumber_key";

-- AlterTable
ALTER TABLE "DeliveryNote" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "trashBatchId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "trashBatchId" TEXT;

-- CreateIndex
CREATE INDEX "DeliveryNote_deletedAt_idx" ON "DeliveryNote"("deletedAt");

-- CreateIndex
CREATE INDEX "DeliveryNote_trashBatchId_idx" ON "DeliveryNote"("trashBatchId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_deletedAt_idx" ON "PurchaseOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_trashBatchId_idx" ON "PurchaseOrder"("trashBatchId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partial unique indexes: soft-deleted records must not block re-import of
-- active records with the same identity. Prisma does not declare partial
-- indexes declaratively, so we add them with controlled raw SQL.
CREATE UNIQUE INDEX "PurchaseOrder_companyCode_normalizedPoNumber_active_key"
ON "PurchaseOrder"("companyCode", "normalizedPoNumber")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "DeliveryNote_uniqueCode_active_key"
ON "DeliveryNote"("uniqueCode")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "DeliveryNote_purchaseOrderId_normalizedBranchName_active_key"
ON "DeliveryNote"("purchaseOrderId", "normalizedBranchName")
WHERE "deletedAt" IS NULL;

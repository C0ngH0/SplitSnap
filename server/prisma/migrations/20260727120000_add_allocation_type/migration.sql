-- AlterEnum
CREATE TYPE "AllocationType" AS ENUM ('INDIVIDUAL', 'SHARED');

-- AlterTable
ALTER TABLE "ItemAssignment"
ADD COLUMN "allocationType" "AllocationType" NOT NULL DEFAULT 'INDIVIDUAL';

-- DropIndex
DROP INDEX IF EXISTS "ItemAssignment_receiptItemId_participantId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ItemAssignment_receiptItemId_participantId_allocationType_key"
ON "ItemAssignment"("receiptItemId", "participantId", "allocationType");

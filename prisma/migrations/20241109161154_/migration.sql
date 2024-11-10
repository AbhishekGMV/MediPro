/*
  Warnings:

  - A unique constraint covering the columns `[availabilityId,dayOfWeek]` on the table `Slot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dayOfWeek` to the `Slot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Slot_availabilityId_startTime_key";

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "dayOfWeek" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Slot_availabilityId_dayOfWeek_key" ON "Slot"("availabilityId", "dayOfWeek");

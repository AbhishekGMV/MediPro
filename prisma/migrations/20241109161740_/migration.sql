/*
  Warnings:

  - A unique constraint covering the columns `[availabilityId,startTime]` on the table `Slot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Slot_availabilityId_dayOfWeek_key";

-- CreateIndex
CREATE UNIQUE INDEX "Slot_availabilityId_startTime_key" ON "Slot"("availabilityId", "startTime");

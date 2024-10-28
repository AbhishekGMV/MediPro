/*
  Warnings:

  - Changed the type of `dayOfWeek` on the `Availability` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" TEXT NOT NULL;

-- DropEnum
DROP TYPE "DayOfWeek";

-- CreateIndex
CREATE UNIQUE INDEX "Availability_doctorId_dayOfWeek_key" ON "Availability"("doctorId", "dayOfWeek");

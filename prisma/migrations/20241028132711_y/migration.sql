/*
  Warnings:

  - Added the required column `endTime` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekStart` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
ADD COLUMN     "weekStart" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Slot" ALTER COLUMN "endTime" SET DATA TYPE TEXT,
ALTER COLUMN "startTime" SET DATA TYPE TEXT;

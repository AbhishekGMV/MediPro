/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,dayOfWeek]` on the table `Availability` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dayOfWeek` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MODAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Availability_doctorId_dayOfWeek_key" ON "Availability"("doctorId", "dayOfWeek");

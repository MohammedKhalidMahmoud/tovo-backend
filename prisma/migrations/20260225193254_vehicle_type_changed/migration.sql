/*
  Warnings:

  - You are about to drop the column `baseFare` on the `vehicle_types` table. All the data in the column will be lost.
  - You are about to drop the column `perKmRate` on the `vehicle_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vehicle_types` DROP COLUMN `baseFare`,
    DROP COLUMN `perKmRate`;

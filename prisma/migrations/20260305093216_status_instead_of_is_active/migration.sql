/*
  Warnings:

  - You are about to drop the column `isActive` on the `regions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `regions` DROP COLUMN `isActive`,
    ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true;

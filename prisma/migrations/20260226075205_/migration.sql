/*
  Warnings:

  - You are about to drop the `captain_price_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `captain_price_plans` DROP FOREIGN KEY `captain_price_plans_captainId_fkey`;

-- DropForeignKey
ALTER TABLE `captain_price_plans` DROP FOREIGN KEY `captain_price_plans_planId_fkey`;

-- AlterTable
ALTER TABLE `captains` ADD COLUMN `planId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `captain_price_plans`;

-- AddForeignKey
ALTER TABLE `captains` ADD CONSTRAINT `captains_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `price_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

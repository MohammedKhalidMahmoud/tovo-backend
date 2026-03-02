-- Clear dev rows that have no planId so we can make the column required
DELETE FROM `fare_offers`;
DELETE FROM `ratings`;
DELETE FROM `trips`;

-- DropForeignKey for vehicleTypeId (if it still exists)
ALTER TABLE `trips` DROP FOREIGN KEY IF EXISTS `trips_vehicleTypeId_fkey`;

-- Drop the old vehicleTypeId column
ALTER TABLE `trips` DROP COLUMN IF EXISTS `vehicleTypeId`;

-- Add planId as required
ALTER TABLE `trips` ADD COLUMN `planId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `price_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

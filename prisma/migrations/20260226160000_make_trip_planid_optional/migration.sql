-- Drop FK constraint so we can modify the column
ALTER TABLE `trips` DROP FOREIGN KEY `trips_planId_fkey`;

-- Make planId nullable
ALTER TABLE `trips` MODIFY COLUMN `planId` VARCHAR(191) NULL;

-- Re-add FK as nullable (ON DELETE SET NULL so orphan rows are handled)
ALTER TABLE `trips` ADD CONSTRAINT `trips_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `price_plans`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

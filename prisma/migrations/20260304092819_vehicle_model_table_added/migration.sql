-- DropForeignKey
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_typeId_fkey`;

-- Make typeId nullable first so ON DELETE SET NULL is valid
ALTER TABLE `vehicles` MODIFY `typeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `vehicle_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

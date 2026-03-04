-- DropForeignKey
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_typeId_fkey`;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `vehicle_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

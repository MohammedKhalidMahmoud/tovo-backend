-- Migration: add serviceId to vehicle_types and captains
-- Links each vehicle type (and captain) to a service category so that
-- trip notifications are only sent to captains in the matching service.

-- Add serviceId to vehicle_types
ALTER TABLE `vehicle_types`
  ADD COLUMN `serviceId` VARCHAR(191) NULL,
  ADD CONSTRAINT `vehicle_types_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add serviceId to captains
ALTER TABLE `captains`
  ADD COLUMN `serviceId` VARCHAR(191) NULL,
  ADD CONSTRAINT `captains_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

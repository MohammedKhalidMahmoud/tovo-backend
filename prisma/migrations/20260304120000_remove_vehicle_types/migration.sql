-- Migration: remove vehicle_types table
-- VehicleModel is now the single source of truth for allowed vehicle registrations.
-- description, imageUrl, serviceId move from vehicle_types to vehicle_models.

-- 1. Add the new columns to vehicle_models
ALTER TABLE `vehicle_models`
  ADD COLUMN `description` VARCHAR(191) NULL,
  ADD COLUMN `imageUrl`    VARCHAR(191) NULL,
  ADD COLUMN `serviceId`   VARCHAR(191) NULL,
  ADD CONSTRAINT `vehicle_models_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Drop the typeId FK on vehicles (references vehicle_types)
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_typeId_fkey`;

-- 3. Drop the typeId column from vehicles
ALTER TABLE `vehicles` DROP COLUMN `typeId`;

-- 4. Drop FKs on vehicle_types so the table can be dropped
ALTER TABLE `vehicle_types`
  DROP FOREIGN KEY `vehicle_types_serviceId_fkey`,
  DROP FOREIGN KEY `vehicle_types_vehicleModelId_fkey`;

-- 5. Drop vehicle_types table
DROP TABLE `vehicle_types`;

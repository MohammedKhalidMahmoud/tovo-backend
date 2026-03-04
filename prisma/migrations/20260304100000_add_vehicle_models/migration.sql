-- Migration: add vehicle_models table and link it to vehicles and vehicle_types
-- VehicleModel = admin-managed whitelist of allowed car models.
-- VehicleType references VehicleModel (not the other way around).

-- 1. Create vehicle_models table (no FK to vehicle_types here)
CREATE TABLE `vehicle_models` (
  `id`        VARCHAR(191) NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `brand`     VARCHAR(191) NOT NULL,
  `isActive`  BOOLEAN      NOT NULL DEFAULT true,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL,

  UNIQUE INDEX `vehicle_models_name_key` (`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Add vehicleModelId to vehicle_types (VehicleType → VehicleModel)
ALTER TABLE `vehicle_types`
  ADD COLUMN `vehicleModelId` VARCHAR(191) NULL,
  ADD CONSTRAINT `vehicle_types_vehicleModelId_fkey`
    FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Add vehicleModelId to vehicles
ALTER TABLE `vehicles`
  ADD COLUMN `vehicleModelId` VARCHAR(191) NULL,
  ADD CONSTRAINT `vehicles_vehicleModelId_fkey`
    FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

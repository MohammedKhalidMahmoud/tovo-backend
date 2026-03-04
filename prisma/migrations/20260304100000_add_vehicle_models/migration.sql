-- Migration: add vehicle_models table and link it to vehicles
-- Admins manage the whitelist of allowed car models.
-- Captain registration must reference an active VehicleModel.

CREATE TABLE `vehicle_models` (
  `id`            VARCHAR(191)  NOT NULL,
  `name`          VARCHAR(191)  NOT NULL,
  `brand`         VARCHAR(191)  NOT NULL,
  `isActive`      BOOLEAN       NOT NULL DEFAULT true,
  `vehicleTypeId` VARCHAR(191)  NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL,

  UNIQUE INDEX `vehicle_models_name_key` (`name`),
  PRIMARY KEY (`id`),
  CONSTRAINT `vehicle_models_vehicleTypeId_fkey`
    FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicle_types`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Make typeId nullable (VehicleModel is now the primary identifier)
ALTER TABLE `vehicles` MODIFY `typeId` VARCHAR(191) NULL;

-- Add vehicleModelId column to vehicles
ALTER TABLE `vehicles`
  ADD COLUMN `vehicleModelId` VARCHAR(191) NULL,
  ADD CONSTRAINT `vehicles_vehicleModelId_fkey`
    FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

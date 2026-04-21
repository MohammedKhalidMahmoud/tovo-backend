-- CreateTable
CREATE TABLE `service_vehicle_models` (
    `serviceId` VARCHAR(191) NOT NULL,
    `vehicleModelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`serviceId`, `vehicleModelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_vehicle_models` ADD CONSTRAINT `service_vehicle_models_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_vehicle_models` ADD CONSTRAINT `service_vehicle_models_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

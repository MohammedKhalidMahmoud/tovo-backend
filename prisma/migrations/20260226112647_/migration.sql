-- CreateTable
CREATE TABLE `_PricePlanToVehicleType` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_PricePlanToVehicleType_AB_unique`(`A`, `B`),
    INDEX `_PricePlanToVehicleType_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_PricePlanToVehicleType` ADD CONSTRAINT `_PricePlanToVehicleType_A_fkey` FOREIGN KEY (`A`) REFERENCES `price_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PricePlanToVehicleType` ADD CONSTRAINT `_PricePlanToVehicleType_B_fkey` FOREIGN KEY (`B`) REFERENCES `vehicle_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

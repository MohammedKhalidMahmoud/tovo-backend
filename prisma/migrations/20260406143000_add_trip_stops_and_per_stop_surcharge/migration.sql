-- AlterTable
ALTER TABLE `services`
    ADD COLUMN `perStopSurcharge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `trip_stops` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `arrivedAt` DATETIME(3) NULL,

    INDEX `trip_stops_tripId_idx`(`tripId`),
    UNIQUE INDEX `trip_stops_tripId_order_key`(`tripId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trip_stops`
    ADD CONSTRAINT `trip_stops_tripId_fkey`
    FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

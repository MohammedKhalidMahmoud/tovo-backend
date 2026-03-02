CREATE TABLE `trip_declines` (
    `tripId`    VARCHAR(191) NOT NULL,
    `captainId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`tripId`, `captainId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_declines`
    ADD CONSTRAINT `trip_declines_tripId_fkey`
    FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

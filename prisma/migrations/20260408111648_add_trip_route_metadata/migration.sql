-- AlterTable
ALTER TABLE `trips` ADD COLUMN `routeDistanceMeters` INTEGER NULL,
    ADD COLUMN `routeDurationSeconds` INTEGER NULL,
    ADD COLUMN `routeEncodedPolyline` TEXT NULL;

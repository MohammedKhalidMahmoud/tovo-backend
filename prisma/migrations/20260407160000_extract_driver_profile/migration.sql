-- Extract driver-only fields from users into driver_profiles (1:1 with users)

CREATE TABLE `driver_profiles` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `drivingLicense` VARCHAR(191) NULL,
  `licenseExpiryDate` DATETIME(3) NULL,
  `isOnline` BOOLEAN NOT NULL DEFAULT false,
  `rating` DOUBLE NOT NULL DEFAULT 0,
  `totalTrips` INTEGER NOT NULL DEFAULT 0,
  `serviceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `driver_profiles_userId_key`(`userId`),
  INDEX `driver_profiles_serviceId_fkey`(`serviceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `driver_profiles`
  ADD CONSTRAINT `driver_profiles_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `driver_profiles`
  ADD CONSTRAINT `driver_profiles_serviceId_fkey`
  FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `driver_profiles` (
  `id`,
  `userId`,
  `drivingLicense`,
  `licenseExpiryDate`,
  `isOnline`,
  `rating`,
  `totalTrips`,
  `serviceId`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  `id`,
  `drivingLicense`,
  `licenseExpiryDate`,
  `isOnline`,
  `rating`,
  `totalTrips`,
  `serviceId`,
  `createdAt`,
  `updatedAt`
FROM `users`
WHERE `role` = 'driver';

ALTER TABLE `users` DROP FOREIGN KEY `users_serviceId_fkey`;

ALTER TABLE `users`
  DROP COLUMN `drivingLicense`,
  DROP COLUMN `licenseExpiryDate`,
  DROP COLUMN `isOnline`,
  DROP COLUMN `rating`,
  DROP COLUMN `totalTrips`,
  DROP COLUMN `serviceId`;

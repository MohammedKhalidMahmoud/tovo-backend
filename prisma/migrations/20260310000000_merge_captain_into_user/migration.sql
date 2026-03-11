-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Merge captains table into users table
-- Drivers are now users with role = 'driver'
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Add driver-only columns to users (nullable) ───────────────────────
ALTER TABLE `users`
  ADD COLUMN `drivingLicense`    VARCHAR(191) NULL,
  ADD COLUMN `licenseExpiryDate` DATETIME(3)  NULL,
  ADD COLUMN `isOnline`          BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN `rating`            DOUBLE       NOT NULL DEFAULT 0,
  ADD COLUMN `totalTrips`        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN `serviceId`         VARCHAR(191) NULL;

-- ── Step 2: Expand role enum to include new values alongside old ones ──────────
ALTER TABLE `users`
  MODIFY `role` ENUM('user', 'captain', 'admin', 'customer', 'driver') NOT NULL DEFAULT 'customer';

-- ── Step 3: Rename existing 'user' role to 'customer' ─────────────────────────
UPDATE `users` SET `role` = 'customer' WHERE `role` = 'user';

-- ── Step 4: Copy captains into users with role = 'driver' ─────────────────────
INSERT INTO `users` (
  `id`, `name`, `email`, `phone`, `passwordHash`, `avatarUrl`,
  `role`, `isVerified`, `language`, `notificationsEnabled`,
  `drivingLicense`, `licenseExpiryDate`, `isOnline`, `rating`, `totalTrips`, `serviceId`,
  `createdAt`, `updatedAt`
)
SELECT
  `id`, `name`, `email`, `phone`, `passwordHash`, `avatarUrl`,
  'driver', `isVerified`, `language`, `notificationsEnabled`,
  `drivingLicense`, `licenseExpiryDate`, `isOnline`, `rating`, `totalTrips`, `serviceId`,
  `createdAt`, `updatedAt`
FROM `captains`;

-- ── Step 5: Finalize role enum (drop old values) ──────────────────────────────
ALTER TABLE `users`
  MODIFY `role` ENUM('customer', 'driver', 'admin') NOT NULL DEFAULT 'customer';

-- ── Step 6: Add serviceId FK to users ─────────────────────────────────────────
ALTER TABLE `users`
  ADD CONSTRAINT `users_serviceId_fkey`
  FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIPS: captainId → driverId (FK references users now)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `trips` DROP FOREIGN KEY `trips_captainId_fkey`;
ALTER TABLE `trips` ADD COLUMN `driverId` VARCHAR(191) NULL;
UPDATE `trips` SET `driverId` = `captainId`;
ALTER TABLE `trips` DROP COLUMN `captainId`;
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_driverId_fkey`
  FOREIGN KEY (`driverId`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- VEHICLES: captainId → userId (FK references users now)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_captainId_fkey`;
ALTER TABLE `vehicles` DROP INDEX `vehicles_captainId_key`;
ALTER TABLE `vehicles` ADD COLUMN `userId` VARCHAR(191) NULL;
UPDATE `vehicles` SET `userId` = `captainId`;
ALTER TABLE `vehicles` DROP COLUMN `captainId`;
ALTER TABLE `vehicles` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `vehicles` ADD UNIQUE INDEX `vehicles_userId_key`(`userId`);
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- WALLETS: drop captainId, populate and enforce userId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `wallets` DROP FOREIGN KEY `wallets_captainId_fkey`;
ALTER TABLE `wallets` DROP FOREIGN KEY `wallets_userId_fkey`;
UPDATE `wallets` SET `userId` = `captainId` WHERE `captainId` IS NOT NULL AND `userId` IS NULL;
ALTER TABLE `wallets` DROP INDEX `wallets_captainId_key`;
ALTER TABLE `wallets` DROP COLUMN `captainId`;
ALTER TABLE `wallets` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- RATINGS: captainId → driverId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `ratings` DROP FOREIGN KEY `ratings_captainId_fkey`;
ALTER TABLE `ratings` ADD COLUMN `driverId` VARCHAR(191) NULL;
UPDATE `ratings` SET `driverId` = `captainId`;
ALTER TABLE `ratings` DROP COLUMN `captainId`;
ALTER TABLE `ratings` MODIFY `driverId` VARCHAR(191) NOT NULL;
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_driverId_fkey`
  FOREIGN KEY (`driverId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- DEVICE TOKENS: populate userId from captainId, drop captainId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `device_tokens` DROP FOREIGN KEY `device_tokens_captainId_fkey`;
UPDATE `device_tokens` SET `userId` = `captainId` WHERE `captainId` IS NOT NULL AND `userId` IS NULL;
DELETE FROM `device_tokens` WHERE `userId` IS NULL;
ALTER TABLE `device_tokens` DROP COLUMN `captainId`;
ALTER TABLE `device_tokens` DROP FOREIGN KEY `device_tokens_userId_fkey`;
ALTER TABLE `device_tokens` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `device_tokens`
  ADD CONSTRAINT `device_tokens_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- INSURANCE CARDS: captainId → userId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `insurance_cards` DROP FOREIGN KEY `insurance_cards_captainId_fkey`;
ALTER TABLE `insurance_cards` ADD COLUMN `userId` VARCHAR(191) NULL;
UPDATE `insurance_cards` SET `userId` = `captainId`;
ALTER TABLE `insurance_cards` DROP COLUMN `captainId`;
ALTER TABLE `insurance_cards` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `insurance_cards`
  ADD CONSTRAINT `insurance_cards_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- OTPS: populate userId from captainId, drop captainId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `otps` DROP FOREIGN KEY `otps_captainId_fkey`;
UPDATE `otps` SET `userId` = `captainId` WHERE `captainId` IS NOT NULL AND `userId` IS NULL;
ALTER TABLE `otps` DROP COLUMN `captainId`;

-- ══════════════════════════════════════════════════════════════════════════════
-- REFRESH TOKENS: populate userId from captainId, drop captainId
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_captainId_fkey`;
UPDATE `refresh_tokens` SET `userId` = `captainId` WHERE `captainId` IS NOT NULL AND `userId` IS NULL;
ALTER TABLE `refresh_tokens` DROP COLUMN `captainId`;

-- ══════════════════════════════════════════════════════════════════════════════
-- SUPPORT TICKETS: drop captainId (tickets belong to users only)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `support_tickets` DROP FOREIGN KEY `support_tickets_captainId_fkey`;
ALTER TABLE `support_tickets` DROP COLUMN `captainId`;

-- ══════════════════════════════════════════════════════════════════════════════
-- SOS ALERTS: drop captainId FK and column (userId already references users)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `sos_alerts` DROP FOREIGN KEY `sos_alerts_captainId_fkey`;
ALTER TABLE `sos_alerts` DROP COLUMN `captainId`;

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIP DECLINES: captainId → driverId
-- Must drop FK on tripId before touching PRIMARY KEY, then restore it.
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE `trip_declines` DROP FOREIGN KEY `trip_declines_tripId_fkey`;
ALTER TABLE `trip_declines` DROP PRIMARY KEY;
ALTER TABLE `trip_declines` ADD COLUMN `driverId` VARCHAR(191) NOT NULL DEFAULT '';
UPDATE `trip_declines` SET `driverId` = `captainId`;
ALTER TABLE `trip_declines` DROP COLUMN `captainId`;
ALTER TABLE `trip_declines` ADD PRIMARY KEY (`tripId`, `driverId`);
ALTER TABLE `trip_declines`
  ADD CONSTRAINT `trip_declines_tripId_fkey`
  FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- Drop the captains table (all data migrated above)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE `captains`;
ALTER TABLE `trips`
  ADD COLUMN `shareToken` VARCHAR(191) NULL,
  ADD COLUMN `shareTokenExpiresAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `trips_shareToken_key` ON `trips`(`shareToken`);

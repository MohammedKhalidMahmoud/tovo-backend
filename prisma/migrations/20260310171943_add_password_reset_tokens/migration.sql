/*
  Warnings:

  - Made the column `userId` on table `support_tickets` required. This step will fail if there are existing NULL values in that column.
  - Made the column `serviceId` on table `vehicle_models` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `device_tokens` DROP FOREIGN KEY `device_tokens_userId_fkey`;

-- DropForeignKey
ALTER TABLE `support_tickets` DROP FOREIGN KEY `support_tickets_userId_fkey`;

-- DropForeignKey
ALTER TABLE `vehicle_models` DROP FOREIGN KEY `vehicle_models_serviceId_fkey`;

-- AlterTable
ALTER TABLE `support_tickets` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `trip_declines` ALTER COLUMN `driverId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `vehicle_models` MODIFY `serviceId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

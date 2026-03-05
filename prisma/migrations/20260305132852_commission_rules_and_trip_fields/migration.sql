-- AlterTable
ALTER TABLE `trips` ADD COLUMN `commission` DECIMAL(10, 2) NULL,
    ADD COLUMN `driverEarnings` DECIMAL(10, 2) NULL,
    ADD COLUMN `paymentType` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `commission_rules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('fixed_amount', 'percentage', 'tiered_fixed', 'tiered_percentage') NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `config` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

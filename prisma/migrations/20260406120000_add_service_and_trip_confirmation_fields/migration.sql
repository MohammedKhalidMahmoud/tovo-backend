-- AlterTable
ALTER TABLE `services`
    ADD COLUMN `requiresSenderCode` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `requiresReceiverCode` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `maxWeightKg` DOUBLE NULL,
    ADD COLUMN `fixedSurcharge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `trips`
    ADD COLUMN `senderConfirmationCode` VARCHAR(191) NULL,
    ADD COLUMN `receiverConfirmationCode` VARCHAR(191) NULL;

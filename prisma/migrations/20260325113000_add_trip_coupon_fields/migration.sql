-- AlterTable
ALTER TABLE `trips`
    ADD COLUMN `couponId` VARCHAR(191) NULL,
    ADD COLUMN `couponCode` VARCHAR(191) NULL,
    ADD COLUMN `fareBeforeDiscount` DECIMAL(10, 2) NULL,
    ADD COLUMN `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateIndex
CREATE INDEX `trips_couponId_idx` ON `trips`(`couponId`);

-- AddForeignKey
ALTER TABLE `trips`
    ADD CONSTRAINT `trips_couponId_fkey`
    FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

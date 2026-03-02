/*
  Warnings:

  - You are about to drop the column `discountPct` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `maxUses` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `usedCount` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `coupons` table. All the data in the column will be lost.
  - Added the required column `discount` to the `coupons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `coupons` DROP COLUMN `discountPct`,
    DROP COLUMN `isActive`,
    DROP COLUMN `maxUses`,
    DROP COLUMN `usedCount`,
    DROP COLUMN `validUntil`,
    ADD COLUMN `coupon_type` VARCHAR(191) NOT NULL DEFAULT 'all',
    ADD COLUMN `discount` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `discount_type` ENUM('percentage', 'amount') NOT NULL DEFAULT 'percentage',
    ADD COLUMN `expiry_date` DATETIME(3) NULL,
    ADD COLUMN `max_discount` DECIMAL(10, 2) NULL,
    ADD COLUMN `min_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `usage_limit` INTEGER NULL,
    ADD COLUMN `usage_limit_per_rider` INTEGER NULL,
    ADD COLUMN `used_count` INTEGER NOT NULL DEFAULT 0;

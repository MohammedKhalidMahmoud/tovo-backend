/*
  Warnings:

  - The primary key for the `system_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `system_settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `system_settings` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `system_settings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `system_settings` DROP PRIMARY KEY,
    DROP COLUMN `description`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `system_settings_key_key` ON `system_settings`(`key`);

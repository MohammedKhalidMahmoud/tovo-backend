/*
  Warnings:

  - You are about to drop the column `name` on the `vehicle_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[model]` on the table `vehicle_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `model` to the `vehicle_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `vehicle_types_name_key` ON `vehicle_types`;

-- AlterTable
ALTER TABLE `vehicle_types` DROP COLUMN `name`,
    ADD COLUMN `model` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `vehicle_types_model_key` ON `vehicle_types`(`model`);

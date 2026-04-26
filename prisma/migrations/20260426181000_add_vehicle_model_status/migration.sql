-- AlterTable
ALTER TABLE `vehicle_models` ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true;

-- Backfill status from the existing isActive flag so current records keep the same availability state.
UPDATE `vehicle_models` SET `status` = `isActive`;

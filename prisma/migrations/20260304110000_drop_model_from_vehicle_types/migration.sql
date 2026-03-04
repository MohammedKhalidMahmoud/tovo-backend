-- VehicleType.model is replaced by VehicleType.vehicleModelId → VehicleModel.name
-- Drop the unique index first, then the column

DROP INDEX `vehicle_types_model_key` ON `vehicle_types`;

ALTER TABLE `vehicle_types` DROP COLUMN `model`;

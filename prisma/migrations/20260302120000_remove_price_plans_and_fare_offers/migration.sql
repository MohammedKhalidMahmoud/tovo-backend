-- Migration: Remove subscription price plans and fare offers
-- Business model changed to commission-based pricing

-- Drop junction table between price_plans and vehicle_types
DROP TABLE IF EXISTS `_PricePlanToVehicleType`;

-- Remove planId FK and column from captains
ALTER TABLE `captains` DROP FOREIGN KEY IF EXISTS `captains_planId_fkey`;
ALTER TABLE `captains` DROP COLUMN IF EXISTS `planId`;

-- Remove planId FK and column from trips
ALTER TABLE `trips` DROP FOREIGN KEY IF EXISTS `trips_planId_fkey`;
ALTER TABLE `trips` DROP COLUMN IF EXISTS `planId`;

-- Drop fare_offers table (feature removed)
DROP TABLE IF EXISTS `fare_offers`;

-- Drop price_plans table
DROP TABLE IF EXISTS `price_plans`;

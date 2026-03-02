-- Location is now tracked in-memory (locationStore) — these columns are no longer needed.
ALTER TABLE `captains` DROP COLUMN `currentLat`;
ALTER TABLE `captains` DROP COLUMN `currentLng`;
ALTER TABLE `captains` DROP COLUMN `heading`;

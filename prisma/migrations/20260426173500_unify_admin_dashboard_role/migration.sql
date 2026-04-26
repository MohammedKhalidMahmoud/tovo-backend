-- AlterTable
ALTER TABLE `admin_users` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing superadmin accounts as dashboard administrators before dropping the legacy role column.
UPDATE `admin_users`
SET `isAdmin` = true
WHERE LOWER(`role`) IN ('superadmin', 'super_admin');

-- AlterTable
ALTER TABLE `admin_users` DROP COLUMN `role`;

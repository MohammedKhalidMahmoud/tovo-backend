-- Make phone optional (allow NULL)
ALTER TABLE `users` MODIFY COLUMN `phone` VARCHAR(191) NULL;

-- Add googleId and facebookId fields
ALTER TABLE `users`
  ADD COLUMN `googleId` VARCHAR(191) NULL,
  ADD COLUMN `facebookId` VARCHAR(191) NULL;

-- Add unique constraints
CREATE UNIQUE INDEX `users_googleId_key` ON `users`(`googleId`);
CREATE UNIQUE INDEX `users_facebookId_key` ON `users`(`facebookId`);

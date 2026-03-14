-- AddColumn appleId to users
ALTER TABLE `users` ADD COLUMN `appleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_appleId_key` ON `users`(`appleId`);

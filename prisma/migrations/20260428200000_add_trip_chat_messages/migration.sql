CREATE TABLE `trip_chat_messages` (
  `id` VARCHAR(191) NOT NULL,
  `tripId` VARCHAR(191) NOT NULL,
  `senderId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `trip_chat_messages_tripId_createdAt_idx` ON `trip_chat_messages`(`tripId`, `createdAt`);
CREATE INDEX `trip_chat_messages_senderId_fkey` ON `trip_chat_messages`(`senderId`);

ALTER TABLE `trip_chat_messages`
  ADD CONSTRAINT `trip_chat_messages_tripId_fkey`
  FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `trip_chat_messages`
  ADD CONSTRAINT `trip_chat_messages_senderId_fkey`
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

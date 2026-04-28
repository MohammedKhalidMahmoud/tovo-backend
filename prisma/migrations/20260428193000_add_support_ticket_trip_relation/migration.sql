ALTER TABLE `support_tickets` ADD COLUMN `tripId` VARCHAR(191) NULL;

CREATE INDEX `support_tickets_tripId_fkey` ON `support_tickets`(`tripId`);

ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_tripId_fkey`
  FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

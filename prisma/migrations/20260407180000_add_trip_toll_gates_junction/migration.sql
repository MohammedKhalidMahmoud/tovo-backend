CREATE TABLE `trip_toll_gates` (
  `tripId` VARCHAR(191) NOT NULL,
  `tollGateId` VARCHAR(191) NOT NULL,
  `fee` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `trip_toll_gates_tollGateId_fkey`(`tollGateId`),
  PRIMARY KEY (`tripId`, `tollGateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_toll_gates`
  ADD CONSTRAINT `trip_toll_gates_tripId_fkey`
  FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `trip_toll_gates`
  ADD CONSTRAINT `trip_toll_gates_tollGateId_fkey`
  FOREIGN KEY (`tollGateId`) REFERENCES `toll_gates`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

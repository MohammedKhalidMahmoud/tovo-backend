/*
  Warnings:

  - You are about to drop the `sos_alerts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `sos_alerts` DROP FOREIGN KEY `sos_alerts_userId_fkey`;

-- DropTable
DROP TABLE `sos_alerts`;

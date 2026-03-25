ALTER TABLE `commission_rules` DROP FOREIGN KEY `commission_rules_serviceId_fkey`;

ALTER TABLE `commission_rules`
  DROP COLUMN `serviceId`;

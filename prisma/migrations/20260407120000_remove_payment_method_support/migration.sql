UPDATE `trips`
SET `paymentType` = 'cash'
WHERE `paymentType` IS NULL OR `paymentType` <> 'cash';

UPDATE `commission_logs`
SET `paymentType` = 'cash'
WHERE `paymentType` <> 'cash';

ALTER TABLE `trips` DROP FOREIGN KEY `trips_paymentMethodId_fkey`;
ALTER TABLE `trips` DROP COLUMN `paymentMethodId`;

DROP TABLE `payment_methods`;

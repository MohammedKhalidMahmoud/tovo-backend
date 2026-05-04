ALTER TABLE `services` ADD COLUMN `instructions` JSON NULL;

UPDATE `services` AS `s`
SET `instructions` = COALESCE(
  (
    SELECT JSON_ARRAYAGG(`ordered_instructions`.`description`)
    FROM (
      SELECT
        `si`.`serviceId`,
        `i`.`description`
      FROM `service_instructions` AS `si`
      INNER JOIN `instructions` AS `i` ON `i`.`id` = `si`.`instructionId`
      WHERE `i`.`isActive` = true
      ORDER BY `i`.`order` ASC, `i`.`createdAt` ASC
    ) AS `ordered_instructions`
    WHERE `ordered_instructions`.`serviceId` = `s`.`id`
  ),
  JSON_ARRAY()
);

ALTER TABLE `services` MODIFY `instructions` JSON NOT NULL;

DROP TABLE `service_instructions`;
DROP TABLE `instructions`;

-- DropForeignKey
ALTER TABLE `accounting_settings` DROP FOREIGN KEY `AccountingSettings_companyId_fkey`;

-- AlterTable
ALTER TABLE `accounting_settings` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `accounting_settings` ADD CONSTRAINT `accounting_settings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `accounting_settings_companyId_key` ON `accounting_settings`(`companyId`);
DROP INDEX `AccountingSettings_companyId_key` ON `accounting_settings`;

-- Add accounting settings table for general parameters
CREATE TABLE `accounting_settings` (
  `id` varchar(191) NOT NULL,
  `companyId` varchar(191) NOT NULL,
  `accountingType` varchar(191) NOT NULL DEFAULT 'CAUSACION',
  `allowCash` boolean NOT NULL DEFAULT true,
  `baseCurrency` varchar(191) NOT NULL DEFAULT 'COP',
  `multiCurrencyEnabled` boolean NOT NULL DEFAULT false,
  `secondaryCurrency` varchar(191),
  `decimals` int NOT NULL DEFAULT 2,
  `roundingMode` varchar(191) NOT NULL DEFAULT 'AUTO',
  `defaultNature` varchar(191) NOT NULL DEFAULT 'DEBIT',
  `enableRoundingAdjustments` boolean NOT NULL DEFAULT true,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `AccountingSettings_companyId_key`(`companyId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AccountingSettings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

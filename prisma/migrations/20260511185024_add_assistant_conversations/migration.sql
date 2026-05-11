-- DropIndex
DROP INDEX `execution_logs_timestamp_idx` ON `execution_logs`;

-- DropIndex
DROP INDEX `task_executions_createdAt_idx` ON `task_executions`;

-- CreateTable
CREATE TABLE `assistant_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'New conversation',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assistant_conversations_userId_idx`(`userId`),
    INDEX `assistant_conversations_updatedAt_idx`(`updatedAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assistant_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT') NOT NULL,
    `content` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assistant_messages_conversationId_idx`(`conversationId`),
    INDEX `assistant_messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `execution_logs_timestamp_idx` ON `execution_logs`(`timestamp` DESC);

-- CreateIndex
CREATE INDEX `task_executions_createdAt_idx` ON `task_executions`(`createdAt` DESC);

-- AddForeignKey
ALTER TABLE `assistant_conversations` ADD CONSTRAINT `assistant_conversations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assistant_messages` ADD CONSTRAINT `assistant_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `assistant_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

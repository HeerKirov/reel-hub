-- CreateEnum
CREATE TYPE "ShoppingType" AS ENUM ('MAIN', 'DLC', 'IN_APP_PURCHASE', 'SUBSCRIPTION', 'OTHER');

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "currency" VARCHAR(8) NOT NULL DEFAULT 'CNY';

-- CreateTable
CREATE TABLE "PurchaseSummary" (
    "id" SERIAL NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "projectId" TEXT NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "projectId" TEXT NOT NULL,
    "purchaseType" "ShoppingType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "purchaseTime" TIMESTAMP(3) NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistic" (
    "id" SERIAL NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "type" VARCHAR(256) NOT NULL,
    "key" VARCHAR(256),
    "content" JSONB NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseSummary_ownerId_projectId_key" ON "PurchaseSummary"("ownerId", "projectId");

-- CreateIndex
CREATE INDEX "Purchase_ownerId_projectId_purchaseTime_idx" ON "Purchase"("ownerId", "projectId", "purchaseTime");

-- CreateIndex
CREATE UNIQUE INDEX "Statistic_ownerId_type_key_key" ON "Statistic"("ownerId", "type", "key");

-- AddForeignKey
ALTER TABLE "PurchaseSummary" ADD CONSTRAINT "PurchaseSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

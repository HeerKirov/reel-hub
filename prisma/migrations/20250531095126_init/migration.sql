-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('ANIME', 'GAME', 'MOVIE', 'NOVEL', 'MANGA');

-- CreateEnum
CREATE TYPE "OriginalType" AS ENUM ('ORIGINAL', 'GAME', 'NOVEL', 'MANGA', 'OTHER');

-- CreateEnum
CREATE TYPE "BoardcastType" AS ENUM ('TV_AND_WEB', 'OVA_AND_OAD', 'MOVIE', 'OTHER');

-- CreateEnum
CREATE TYPE "OnlineType" AS ENUM ('SINGLE_PLAYER', 'MULTI_PLAYER', 'ONLINE_GAME');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED');

-- CreateEnum
CREATE TYPE "FollowType" AS ENUM ('FOLLOW', 'CATCH_UP', 'REWATCH');

-- CreateEnum
CREATE TYPE "ShoppingType" AS ENUM ('MAIN', 'DLC', 'IN_APP_PURCHASE', 'SUBSCRIPTION', 'OTHER');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "subtitles" TEXT[],
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "type" "ProjectType" NOT NULL,
    "publishTime" DATE,
    "ratingS" INTEGER,
    "ratingV" INTEGER,
    "region" TEXT,
    "relations" JSONB NOT NULL,
    "relationsTopology" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,
    "updator" VARCHAR(24) NOT NULL,
    "originalType" "OriginalType",
    "boardcastType" "BoardcastType",
    "episodeDuration" INTEGER,
    "episodeTotalNum" INTEGER,
    "episodePublishedNum" INTEGER,
    "episodePublishedRecords" JSONB,
    "episodePublishPlan" JSONB,
    "platform" VARCHAR(64)[],
    "onlineType" "OnlineType",

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "otherNames" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStaffRelation" (
    "projectId" TEXT NOT NULL,
    "staffId" INTEGER NOT NULL,
    "staffType" VARCHAR(256) NOT NULL,

    CONSTRAINT "ProjectStaffRelation_pkey" PRIMARY KEY ("projectId","staffId","staffType")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL,
    "type" "ProjectType" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,
    "updator" VARCHAR(24) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTagRelation" (
    "projectId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ProjectTagRelation_pkey" PRIMARY KEY ("projectId","tagId")
);

-- CreateTable
CREATE TABLE "Bought" (
    "id" SERIAL NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "projectId" TEXT NOT NULL,
    "buyType" "ShoppingType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "buyTime" TIMESTAMP(3) NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bought_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "projectId" TEXT NOT NULL,
    "specialAttention" BOOLEAN NOT NULL,
    "status" "RecordStatus" NOT NULL,
    "progressCount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "lastActivityTime" TIMESTAMP(3),
    "lastActivityEvent" JSONB NOT NULL DEFAULT '{}',
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordProgress" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "status" "RecordStatus" NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,
    "episodeWatchedNum" INTEGER,
    "episodeWatchedRecords" JSONB,
    "followType" "FollowType",
    "platform" VARCHAR(64)[],

    CONSTRAINT "RecordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "ownerId" VARCHAR(24) NOT NULL,
    "projectId" TEXT NOT NULL,
    "score" INTEGER,
    "title" TEXT,
    "article" TEXT,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Project_type_publishTime_idx" ON "Project"("type", "publishTime");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_name_key" ON "Staff"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_type_name_key" ON "Tag"("type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Bought_ownerId_projectId_key" ON "Bought"("ownerId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Record_ownerId_projectId_key" ON "Record"("ownerId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_ownerId_projectId_key" ON "Comment"("ownerId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Statistic_ownerId_type_key_key" ON "Statistic"("ownerId", "type", "key");

-- AddForeignKey
ALTER TABLE "ProjectStaffRelation" ADD CONSTRAINT "ProjectStaffRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStaffRelation" ADD CONSTRAINT "ProjectStaffRelation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bought" ADD CONSTRAINT "Bought_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProgress" ADD CONSTRAINT "RecordProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProgress" ADD CONSTRAINT "RecordProgress_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

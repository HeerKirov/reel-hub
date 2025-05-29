-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('Anime', 'Game', 'Movie', 'Novel', 'Manga');

-- CreateEnum
CREATE TYPE "OriginalType" AS ENUM ('Original', 'Game', 'Novel', 'Manga', 'Other');

-- CreateEnum
CREATE TYPE "BoardcastType" AS ENUM ('TvAndWeb', 'OvaAndOad', 'Movie', 'Other');

-- CreateEnum
CREATE TYPE "OnlineType" AS ENUM ('SinglePlayer', 'MultiPlayer', 'OnlineGame');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('Watching', 'Completed', 'OnHold', 'Dropped');

-- CreateEnum
CREATE TYPE "FollowType" AS ENUM ('Follow', 'CatchUp', 'Rewatch');

-- CreateEnum
CREATE TYPE "ShoppingType" AS ENUM ('Main', 'DLC', 'InAppPurchase', 'Subscription', 'Other');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "subtitles" TEXT[],
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "type" "ProjectType" NOT NULL,
    "publish_time" DATE NOT NULL,
    "rating_s" INTEGER,
    "rating_v" INTEGER,
    "region" TEXT,
    "relations" JSONB NOT NULL,
    "relations_topology" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,
    "updator" VARCHAR(24) NOT NULL,
    "original_type" "OriginalType",
    "boardcast_type" "BoardcastType",
    "episode_duration" INTEGER,
    "episode_total_num" INTEGER,
    "episode_published_num" INTEGER,
    "episode_published_records" JSONB,
    "episode_publish_plan" JSONB,
    "platform" VARCHAR(64)[],
    "online_type" "OnlineType",

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "other_names" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStaffRelation" (
    "project_id" TEXT NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "staff_type" VARCHAR(256) NOT NULL,

    CONSTRAINT "ProjectStaffRelation_pkey" PRIMARY KEY ("project_id","staff_id","staff_type")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL,
    "type" "ProjectType" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,
    "creator" VARCHAR(24) NOT NULL,
    "updator" VARCHAR(24) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTagRelation" (
    "project_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectTagRelation_pkey" PRIMARY KEY ("project_id","tag_id")
);

-- CreateTable
CREATE TABLE "Bought" (
    "id" SERIAL NOT NULL,
    "owner_id" VARCHAR(24) NOT NULL,
    "project_id" TEXT NOT NULL,
    "buy_type" "ShoppingType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "buy_time" TIMESTAMP(3) NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bought_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "owner_id" VARCHAR(24) NOT NULL,
    "project_id" TEXT NOT NULL,
    "special_attention" BOOLEAN NOT NULL,
    "status" "RecordStatus" NOT NULL,
    "progress_count" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "last_activity_time" TIMESTAMP(3),
    "last_activity_event" JSONB NOT NULL DEFAULT '{}',
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordProgress" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "record_id" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "status" "RecordStatus" NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,
    "episode_watched_num" INTEGER,
    "episode_watched_records" JSONB,
    "follow_type" "FollowType",
    "platform" VARCHAR(64)[],

    CONSTRAINT "RecordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "owner_id" VARCHAR(24) NOT NULL,
    "project_id" TEXT NOT NULL,
    "score" INTEGER,
    "title" TEXT,
    "article" TEXT,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistic" (
    "id" SERIAL NOT NULL,
    "owner_id" VARCHAR(24) NOT NULL,
    "type" VARCHAR(256) NOT NULL,
    "key" VARCHAR(256),
    "content" JSONB NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_name_key" ON "Staff"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_type_name_key" ON "Tag"("type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Bought_owner_id_project_id_key" ON "Bought"("owner_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Record_owner_id_project_id_key" ON "Record"("owner_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_owner_id_project_id_key" ON "Comment"("owner_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Statistic_owner_id_type_key_key" ON "Statistic"("owner_id", "type", "key");

-- AddForeignKey
ALTER TABLE "ProjectStaffRelation" ADD CONSTRAINT "ProjectStaffRelation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStaffRelation" ADD CONSTRAINT "ProjectStaffRelation_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bought" ADD CONSTRAINT "Bought_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProgress" ADD CONSTRAINT "RecordProgress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProgress" ADD CONSTRAINT "RecordProgress_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "Record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

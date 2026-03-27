-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" VARCHAR(24) NOT NULL,
    "timezone" VARCHAR(64),
    "autoTimezone" BOOLEAN NOT NULL DEFAULT true,
    "nightTimeTable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('restaurant', 'video', 'event', 'generic');

-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('meet', 'vote', 'share');

-- CreateEnum
CREATE TYPE "OgJobStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('yes', 'no');

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(22) NOT NULL,
    "original_url" TEXT,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "link_type" "LinkType" NOT NULL,
    "intent_type" "IntentType" NOT NULL DEFAULT 'meet',
    "primary_action_label" TEXT NOT NULL,
    "og_job_id" TEXT,
    "creator_user_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "response_type" "ResponseType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "og_jobs" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "OgJobStatus" NOT NULL DEFAULT 'processing',
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "link_type" "LinkType" NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "og_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spaces_token_key" ON "spaces"("token");

-- CreateIndex
CREATE INDEX "responses_space_id_idx" ON "responses"("space_id");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_og_job_id_fkey" FOREIGN KEY ("og_job_id") REFERENCES "og_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum
BEGIN;
CREATE TYPE "LinkType_new" AS ENUM ('google_maps', 'youtube', 'instagram', 'tiktok', 'spotify', 'x_twitter', 'event', 'generic');
ALTER TABLE "spaces" ALTER COLUMN "link_type" TYPE "LinkType_new" USING ("link_type"::text::"LinkType_new");
ALTER TABLE "og_jobs" ALTER COLUMN "link_type" TYPE "LinkType_new" USING ("link_type"::text::"LinkType_new");
ALTER TYPE "LinkType" RENAME TO "LinkType_old";
ALTER TYPE "LinkType_new" RENAME TO "LinkType";
DROP TYPE "public"."LinkType_old";
COMMIT;

-- AlterTable
ALTER TABLE "og_jobs" ADD COLUMN     "extras" JSONB;

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "extras" JSONB;

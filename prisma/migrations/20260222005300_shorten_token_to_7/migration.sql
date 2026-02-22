-- Truncate existing tokens to 7 characters before narrowing the column
UPDATE "spaces" SET "token" = LEFT("token", 7) WHERE LENGTH("token") > 7;

-- AlterTable
ALTER TABLE "spaces" ALTER COLUMN "token" SET DATA TYPE VARCHAR(7);

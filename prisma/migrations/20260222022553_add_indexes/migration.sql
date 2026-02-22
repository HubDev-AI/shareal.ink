-- DropIndex
DROP INDEX "responses_space_id_idx";

-- CreateIndex
CREATE INDEX "og_jobs_status_created_at_idx" ON "og_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "responses_space_id_response_type_idx" ON "responses"("space_id", "response_type");

-- CreateIndex
CREATE INDEX "spaces_og_job_id_idx" ON "spaces"("og_job_id");

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "last_visited_at" TIMESTAMP(3),
ADD COLUMN     "total_visits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "unique_visits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_project_id_date_idx" ON "analytics"("project_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_project_id_date_key" ON "analytics"("project_id", "date");

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

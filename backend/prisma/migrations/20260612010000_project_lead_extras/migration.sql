-- AlterTable: add timeline + subcategories to project_leads
ALTER TABLE "project_leads" ADD COLUMN "timeline" TEXT;
ALTER TABLE "project_leads" ADD COLUMN "subcategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable: reference files uploaded with a project lead (order form)
CREATE TABLE "project_lead_files" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT,
    "url" TEXT NOT NULL,
    "mimetype" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_lead_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_lead_files_leadId_idx" ON "project_lead_files"("leadId");

-- AddForeignKey
ALTER TABLE "project_lead_files" ADD CONSTRAINT "project_lead_files_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "project_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

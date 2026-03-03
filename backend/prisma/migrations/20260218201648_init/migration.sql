-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('EXCEL', 'JIRA_API');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "epicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "squadName" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "beginDate" TIMESTAMP(3) NOT NULL,
    "jiraBacklogFilterId" TEXT NOT NULL,
    "jiraThroughputFilterId" TEXT NOT NULL,
    "statusConfig" JSONB NOT NULL DEFAULT '{"concluded":["Concluído","Concluded","Done","Pendente de publicação","Pendente publicação","Pending Publication","Pending Publication PRD"],"inProgress":["Em Andamento","In Progress","Pendente teste","Pending Test","TEST PENDING","Em Teste","TEST","Acompanhamento","Liberado para Homologação","AGUARDANDO CODEREVIEW","Aguardando MR"]}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_issues" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "issueType" TEXT,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3),
    "resolutionDate" TIMESTAMP(3),
    "assignee" TEXT,
    "snapshotId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jira_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "SourceType" NOT NULL,
    "sourceMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekEndingDate" TIMESTAMP(3) NOT NULL,
    "totalScope" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL,
    "remainingCount" INTEGER NOT NULL,
    "weeklyThroughput" INTEGER NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parameters" JSONB NOT NULL,
    "throughputDistribution" JSONB NOT NULL,
    "resultsDistribution" JSONB NOT NULL,
    "p50Date" TIMESTAMP(3) NOT NULL,
    "p85Date" TIMESTAMP(3) NOT NULL,
    "p95Date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_epicId_key" ON "projects"("epicId");

-- CreateIndex
CREATE INDEX "jira_issues_projectId_status_idx" ON "jira_issues"("projectId", "status");

-- CreateIndex
CREATE INDEX "jira_issues_resolutionDate_idx" ON "jira_issues"("resolutionDate");

-- CreateIndex
CREATE INDEX "weekly_metrics_weekEndingDate_idx" ON "weekly_metrics"("weekEndingDate");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_metrics_projectId_weekEndingDate_key" ON "weekly_metrics"("projectId", "weekEndingDate");

-- AddForeignKey
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_issues" ADD CONSTRAINT "jira_issues_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_metrics" ADD CONSTRAINT "weekly_metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_runs" ADD CONSTRAINT "simulation_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

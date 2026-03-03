/*
  Warnings:

  - You are about to drop the `jira_issues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulation_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weekly_metrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "jira_issues" DROP CONSTRAINT "jira_issues_projectId_fkey";

-- DropForeignKey
ALTER TABLE "jira_issues" DROP CONSTRAINT "jira_issues_snapshotId_fkey";

-- DropForeignKey
ALTER TABLE "simulation_runs" DROP CONSTRAINT "simulation_runs_projectId_fkey";

-- DropForeignKey
ALTER TABLE "weekly_metrics" DROP CONSTRAINT "weekly_metrics_projectId_fkey";

-- DropTable
DROP TABLE "jira_issues";

-- DropTable
DROP TABLE "simulation_runs";

-- DropTable
DROP TABLE "weekly_metrics";

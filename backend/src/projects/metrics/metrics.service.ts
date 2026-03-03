import { Injectable } from '@nestjs/common';
import { JiraIssueData } from '../../jira/jira-client.service';
import {
    addWeeks,
    nextMonday,
    isMonday,
    isBefore,
} from 'date-fns';

export interface WeeklyMetricRow {
    weekStart: Date;
    totalScope: number;
    completedCount: number;
    remainingCount: number;
    weeklyThroughput: number;
    baselineValue: number;
}

@Injectable()
export class MetricsService {

    /**
     * Get the next Monday on or after a given date.
     */
    private toMonday(date: Date): Date {
        if (isMonday(date)) return date;
        return nextMonday(date);
    }

    /**
     * Get all week-start Mondays from beginDate to endDate.
     */
    getWeekBoundaries(beginDate: Date, endDate: Date): Date[] {
        const firstMonday = this.toMonday(beginDate);
        const weeks: Date[] = [];
        let current = new Date(firstMonday);

        while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
            weeks.push(new Date(current));
            current = addWeeks(current, 1);
        }

        return weeks;
    }

    /**
     * Compute weekly metrics purely from an in-memory issue list.
     * No database access — returns a plain array.
     */
    computeWeeklyMetricsFromIssues(
        throughputIssues: JiraIssueData[],
        backlogIssues: JiraIssueData[],
        beginDate: Date,
    ): WeeklyMetricRow[] {
        const today = new Date();
        const weeks = this.getWeekBoundaries(beginDate, today);
        const rows: WeeklyMetricRow[] = [];

        for (const weekStart of weeks) {
            const weekEnd = addWeeks(weekStart, 1); // exclusive upper bound

            // Completed counts from the BACKLOG up to the START of this week
            const completedBacklogItems = backlogIssues.filter(
                (i) => i.resolutionDate && isBefore(i.resolutionDate, weekStart),
            );

            // Total scope is always the full backlog size
            const totalScope = backlogIssues.length;

            // Remaining items is total backlog - completed by that week
            const remainingCount = Math.max(0, totalScope - completedBacklogItems.length);

            const weeklyThroughput = throughputIssues.filter(
                (i) =>
                    i.resolutionDate &&
                    !isBefore(i.resolutionDate, weekStart) &&
                    isBefore(i.resolutionDate, weekEnd),
            ).length;

            rows.push({
                weekStart,
                totalScope,
                completedCount: completedBacklogItems.length,
                remainingCount: remainingCount,
                weeklyThroughput,
                baselineValue: 0, // filled in by BaselineService
            });
        }

        return rows;
    }

    /**
     * Extract throughput distribution (weekly throughput values).
     */
    getThroughputDistribution(metrics: WeeklyMetricRow[]): number[] {
        return metrics.map((m) => m.weeklyThroughput);
    }

    /**
     * Get average weekly throughput from in-memory metrics.
     */
    getAverageWeeklyThroughput(metrics: WeeklyMetricRow[]): number {
        if (metrics.length === 0) return 0;
        const sum = metrics.reduce((acc, m) => acc + m.weeklyThroughput, 0);
        return sum / metrics.length;
    }

    /**
     * Get current week (latest) throughput from in-memory metrics.
     */
    getCurrentWeekThroughput(metrics: WeeklyMetricRow[]): number {
        if (metrics.length === 0) return 0;
        return metrics[metrics.length - 1].weeklyThroughput;
    }

    /**
     * Get current remaining count directly from issues.
     */
    getRemainingCount(issues: JiraIssueData[]): number {
        return issues.filter((i) => !i.resolutionDate).length;
    }
}

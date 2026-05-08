import { Injectable } from '@nestjs/common';
import { JiraIssueData } from '../../jira/jira-client.service';
import { addWeeks, addDays, startOfWeek, isBefore } from 'date-fns';

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
   * Get the start of the week (Saturday) for a given date.
   */
  private toSaturday(date: Date): Date {
    return startOfWeek(date, { weekStartsOn: 6 });
  }

  /**
   * Get all week-start Saturdays from beginDate to endDate.
   */
  getWeekBoundaries(beginDate: Date, endDate: Date): Date[] {
    const firstSaturday = this.toSaturday(beginDate);
    const weeks: Date[] = [];
    let current = new Date(firstSaturday);

    while (
      isBefore(current, endDate) ||
      current.getTime() === endDate.getTime()
    ) {
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
    // No Jira data at all — return empty array
    if (backlogIssues.length === 0 && throughputIssues.length === 0) {
      return [];
    }

    const today = new Date();

    // 1. Find earliest throughput resolution date
    let earliestDate = beginDate;
    for (const issue of throughputIssues) {
      if (
        issue.resolutionDate &&
        isBefore(issue.resolutionDate, earliestDate)
      ) {
        earliestDate = issue.resolutionDate;
      }
    }

    // 2. If effectiveStart is in the future use today so we always generate at least one week
    const effectiveStart = earliestDate > today ? today : earliestDate;
    const weeks = this.getWeekBoundaries(effectiveStart, today);
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
      const remainingCount = Math.max(
        0,
        totalScope - completedBacklogItems.length,
      );

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

  /**
   * Return the next Saturday strictly after the given date.
   * If the date is already a Saturday, return the following Saturday (7 days later).
   */
  getNextSaturdayAfter(date: Date): Date {
    const day = date.getDay();
    return addDays(date, day === 6 ? 7 : 6 - day);
  }
}

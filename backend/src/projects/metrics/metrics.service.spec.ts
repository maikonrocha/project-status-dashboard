import { MetricsService, WeeklyMetricRow } from './metrics.service';
import { JiraIssueData } from '../../jira/jira-client.service';

// Use new Date(year, month-1, day) (local midnight) so date-fns startOfWeek results
// match the expected values regardless of the host timezone.
// All dates below are Saturdays in local time.
const SAT_2025_01_04 = new Date(2025, 0, 4);  // Saturday, Jan  4 2025
const SAT_2025_01_11 = new Date(2025, 0, 11); // Saturday, Jan 11 2025
const SAT_2025_01_18 = new Date(2025, 0, 18); // Saturday, Jan 18 2025
const SAT_2025_01_25 = new Date(2025, 0, 25); // Saturday, Jan 25 2025

function makeIssue(overrides: Partial<JiraIssueData> = {}): JiraIssueData {
  return {
    key: 'TST-1',
    summary: 'Test issue',
    status: 'Done',
    issueType: 'Story',
    assignee: null,
    createdDate: new Date(2025, 0, 1),
    resolutionDate: null,
    ...overrides,
  };
}

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  // ─── getWeekBoundaries ────────────────────────────────────────────────────

  describe('getWeekBoundaries', () => {
    it('returns a single Saturday when begin and end are the same Saturday', () => {
      const result = service.getWeekBoundaries(SAT_2025_01_04, SAT_2025_01_04);
      expect(result).toHaveLength(1);
      expect(result[0].getTime()).toBe(SAT_2025_01_04.getTime());
    });

    it('returns two Saturdays when range spans exactly one week', () => {
      const result = service.getWeekBoundaries(SAT_2025_01_04, SAT_2025_01_11);
      expect(result).toHaveLength(2);
      expect(result[0].getTime()).toBe(SAT_2025_01_04.getTime());
      expect(result[1].getTime()).toBe(SAT_2025_01_11.getTime());
    });

    it('returns four Saturdays when range spans three weeks', () => {
      const result = service.getWeekBoundaries(SAT_2025_01_04, SAT_2025_01_25);
      expect(result).toHaveLength(4);
      expect(result[0].getTime()).toBe(SAT_2025_01_04.getTime());
      expect(result[3].getTime()).toBe(SAT_2025_01_25.getTime());
    });

    it('snaps a non-Saturday beginDate back to the preceding Saturday', () => {
      // Jan 6 2025 is Monday → preceding Saturday is Jan 4
      const monday = new Date(2025, 0, 6);
      const result = service.getWeekBoundaries(monday, SAT_2025_01_11);
      expect(result[0].getTime()).toBe(SAT_2025_01_04.getTime());
    });

    it('each consecutive element is exactly 7 days apart', () => {
      const result = service.getWeekBoundaries(SAT_2025_01_04, SAT_2025_01_25);
      for (let i = 1; i < result.length; i++) {
        const diffMs = result[i].getTime() - result[i - 1].getTime();
        expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
      }
    });
  });

  // ─── computeWeeklyMetricsFromIssues ──────────────────────────────────────

  describe('computeWeeklyMetricsFromIssues', () => {
    it('returns empty array when both lists are empty', () => {
      const result = service.computeWeeklyMetricsFromIssues([], [], SAT_2025_01_04);
      expect(result).toEqual([]);
    });

    it('totalScope always equals the full backlog size', () => {
      const backlog = [
        makeIssue({ key: 'TST-1', resolutionDate: null }),
        makeIssue({ key: 'TST-2', resolutionDate: null }),
        makeIssue({ key: 'TST-3', resolutionDate: new Date(2025, 0, 7) }),
      ];
      const throughput = [
        makeIssue({ key: 'TST-3', resolutionDate: new Date(2025, 0, 7) }),
      ];

      const rows = service.computeWeeklyMetricsFromIssues(throughput, backlog, SAT_2025_01_04);
      for (const row of rows) {
        expect(row.totalScope).toBe(3);
      }
    });

    it('weeklyThroughput counts issues resolved in [weekStart, weekStart+1w)', () => {
      // Wednesday Jan 8 is inside the week that starts Sat Jan 4
      const resolutionInWeek1a = new Date(2025, 0, 6, 12); // Mon Jan 6
      const resolutionInWeek1b = new Date(2025, 0, 8, 12); // Wed Jan 8
      // Wednesday Jan 15 is inside the week that starts Sat Jan 11
      const resolutionInWeek2 = new Date(2025, 0, 13, 12); // Mon Jan 13

      const throughput = [
        makeIssue({ key: 'T-1', resolutionDate: resolutionInWeek1a }),
        makeIssue({ key: 'T-2', resolutionDate: resolutionInWeek1b }),
        makeIssue({ key: 'T-3', resolutionDate: resolutionInWeek2 }),
      ];
      const backlog = [...throughput];

      const rows = service.computeWeeklyMetricsFromIssues(throughput, backlog, SAT_2025_01_04);

      const week1Row = rows.find((r) => r.weekStart.getTime() === SAT_2025_01_04.getTime());
      const week2Row = rows.find((r) => r.weekStart.getTime() === SAT_2025_01_11.getTime());

      expect(week1Row).toBeDefined();
      expect(week2Row).toBeDefined();
      expect(week1Row!.weeklyThroughput).toBe(2);
      expect(week2Row!.weeklyThroughput).toBe(1);
    });

    it('remainingCount decreases as backlog items are resolved over weeks', () => {
      const resolved1 = new Date(2025, 0, 6);  // inside week of Jan-04
      const resolved2 = new Date(2025, 0, 13); // inside week of Jan-11

      const backlog = [
        makeIssue({ key: 'B-1', resolutionDate: resolved1 }),
        makeIssue({ key: 'B-2', resolutionDate: resolved2 }),
        makeIssue({ key: 'B-3', resolutionDate: null }),
      ];
      const throughput = [
        makeIssue({ key: 'B-1', resolutionDate: resolved1 }),
        makeIssue({ key: 'B-2', resolutionDate: resolved2 }),
      ];

      const rows = service.computeWeeklyMetricsFromIssues(throughput, backlog, SAT_2025_01_04);

      // At week Jan-04: no backlog item resolved before Jan-04 → remaining = 3
      const week1 = rows.find((r) => r.weekStart.getTime() === SAT_2025_01_04.getTime());
      expect(week1).toBeDefined();
      expect(week1!.remainingCount).toBe(3);

      // At week Jan-11: B-1 resolved before Jan-11 → remaining = 2
      const week2 = rows.find((r) => r.weekStart.getTime() === SAT_2025_01_11.getTime());
      expect(week2).toBeDefined();
      expect(week2!.remainingCount).toBe(2);

      // At week Jan-18: B-1 and B-2 resolved before Jan-18 → remaining = 1
      const week3 = rows.find((r) => r.weekStart.getTime() === SAT_2025_01_18.getTime());
      expect(week3).toBeDefined();
      expect(week3!.remainingCount).toBe(1);
    });

    it('remainingCount never goes below zero', () => {
      const backlog = [makeIssue({ resolutionDate: new Date(2024, 0, 1) })];
      const throughput = [makeIssue({ resolutionDate: new Date(2024, 0, 1) })];

      const rows = service.computeWeeklyMetricsFromIssues(throughput, backlog, SAT_2025_01_04);
      for (const row of rows) {
        expect(row.remainingCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('baselineValue is always 0 (filled by BaselineService)', () => {
      const backlog = [makeIssue({ resolutionDate: null })];
      const throughput: JiraIssueData[] = [];

      const rows = service.computeWeeklyMetricsFromIssues(throughput, backlog, SAT_2025_01_04);
      for (const row of rows) {
        expect(row.baselineValue).toBe(0);
      }
    });

    it('generates at least one row for non-empty issue lists', () => {
      const backlog = [makeIssue({ resolutionDate: null })];
      const rows = service.computeWeeklyMetricsFromIssues([], backlog, SAT_2025_01_04);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('uses today as effectiveStart when beginDate is in the future (line 69 true branch)', () => {
      // beginDate far in the future → earliestDate stays = beginDate > today
      // → effectiveStart = today, so we still get at least one row (this week)
      const futureBegin = new Date(2099, 0, 4); // Saturday far in the future
      const backlog = [makeIssue({ resolutionDate: null })];

      const rows = service.computeWeeklyMetricsFromIssues([], backlog, futureBegin);

      // Must produce at least one row (today's week)
      expect(rows.length).toBeGreaterThan(0);
      // totalScope is still the full backlog size
      expect(rows[0].totalScope).toBe(1);
    });
  });

  // ─── getThroughputDistribution ────────────────────────────────────────────

  describe('getThroughputDistribution', () => {
    it('extracts weeklyThroughput from each row', () => {
      const rows: WeeklyMetricRow[] = [
        { weekStart: SAT_2025_01_04, totalScope: 10, completedCount: 2, remainingCount: 8, weeklyThroughput: 2, baselineValue: 0 },
        { weekStart: SAT_2025_01_11, totalScope: 10, completedCount: 5, remainingCount: 5, weeklyThroughput: 3, baselineValue: 0 },
        { weekStart: SAT_2025_01_18, totalScope: 10, completedCount: 6, remainingCount: 4, weeklyThroughput: 1, baselineValue: 0 },
      ];
      expect(service.getThroughputDistribution(rows)).toEqual([2, 3, 1]);
    });

    it('returns empty array for empty input', () => {
      expect(service.getThroughputDistribution([])).toEqual([]);
    });
  });

  // ─── getAverageWeeklyThroughput ───────────────────────────────────────────

  describe('getAverageWeeklyThroughput', () => {
    it('returns 0 for empty metrics', () => {
      expect(service.getAverageWeeklyThroughput([])).toBe(0);
    });

    it('computes the arithmetic mean of weeklyThroughput values', () => {
      const rows: WeeklyMetricRow[] = [
        { weekStart: SAT_2025_01_04, totalScope: 10, completedCount: 2, remainingCount: 8, weeklyThroughput: 4, baselineValue: 0 },
        { weekStart: SAT_2025_01_11, totalScope: 10, completedCount: 6, remainingCount: 4, weeklyThroughput: 6, baselineValue: 0 },
      ];
      expect(service.getAverageWeeklyThroughput(rows)).toBe(5);
    });

    it('returns the single value when there is one row', () => {
      const rows: WeeklyMetricRow[] = [
        { weekStart: SAT_2025_01_04, totalScope: 5, completedCount: 3, remainingCount: 2, weeklyThroughput: 3, baselineValue: 0 },
      ];
      expect(service.getAverageWeeklyThroughput(rows)).toBe(3);
    });
  });

  // ─── getCurrentWeekThroughput ─────────────────────────────────────────────

  describe('getCurrentWeekThroughput', () => {
    it('returns 0 for empty metrics', () => {
      expect(service.getCurrentWeekThroughput([])).toBe(0);
    });

    it('returns the last row weeklyThroughput', () => {
      const rows: WeeklyMetricRow[] = [
        { weekStart: SAT_2025_01_04, totalScope: 10, completedCount: 2, remainingCount: 8, weeklyThroughput: 2, baselineValue: 0 },
        { weekStart: SAT_2025_01_11, totalScope: 10, completedCount: 5, remainingCount: 5, weeklyThroughput: 7, baselineValue: 0 },
      ];
      expect(service.getCurrentWeekThroughput(rows)).toBe(7);
    });
  });

  // ─── getRemainingCount ────────────────────────────────────────────────────

  describe('getRemainingCount', () => {
    it('returns 0 when all issues are resolved', () => {
      const issues = [
        makeIssue({ key: 'A', resolutionDate: new Date(2025, 0, 5) }),
        makeIssue({ key: 'B', resolutionDate: new Date(2025, 0, 6) }),
      ];
      expect(service.getRemainingCount(issues)).toBe(0);
    });

    it('counts only issues without a resolutionDate', () => {
      const issues = [
        makeIssue({ key: 'A', resolutionDate: new Date(2025, 0, 5) }),
        makeIssue({ key: 'B', resolutionDate: null }),
        makeIssue({ key: 'C', resolutionDate: null }),
      ];
      expect(service.getRemainingCount(issues)).toBe(2);
    });

    it('returns full count when no issues are resolved', () => {
      const issues = [
        makeIssue({ key: 'A', resolutionDate: null }),
        makeIssue({ key: 'B', resolutionDate: null }),
        makeIssue({ key: 'C', resolutionDate: null }),
      ];
      expect(service.getRemainingCount(issues)).toBe(3);
    });

    it('returns 0 for empty list', () => {
      expect(service.getRemainingCount([])).toBe(0);
    });
  });
});
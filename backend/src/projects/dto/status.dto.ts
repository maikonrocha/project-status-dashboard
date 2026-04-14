export interface StatusDashboardDto {
  project: {
    id: string;
    name: string;
    epicId: string;
    squadName: string;
    beginDate: Date;
    teamSize: number;
  };

  kpis: {
    totalTasks: number;
    completed: number;
    remaining: number;
    completionPercentage: number;
    avgWeeklyThroughput: number;
    currentWeekThroughput: number;
    predictedFinish: Date | null;
  };

  chartData: {
    burndown: Array<{ week: Date; remaining: number }>;
    baseline: Array<{ week: Date; value: number }>;
    confidenceBand: Array<{ week: Date; p50: number; p85: number }>;
  };

  tables: {
    remainingTasks: Array<{
      key: string;
      summary: string;
      status: string;
      assignee: string | null;
      createdDate: Date | null;
    }>;

    recentCompleted: Array<{
      key: string;
      summary: string;
      resolutionDate: Date;
    }>;

    weeklyThroughput: Array<{
      weekEnding: Date;
      throughput: number;
      cumulative: number;
      remaining: number;
    }>;
  };
}

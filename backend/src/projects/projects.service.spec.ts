import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics/metrics.service';
import { MonteCarloService } from './monte-carlo/monte-carlo.service';
import { BaselineService } from './baseline/baseline.service';
import { JiraClientService } from '../jira/jira-client.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COMPANY_ID = 'company-uuid';
const PROJECT_ID = 'project-uuid';

const PROJECT = {
  id: PROJECT_ID,
  name: 'Test Project',
  epicId: 'TST-1',
  squadName: 'Squad A',
  teamSize: 5,
  beginDate: new Date(2025, 0, 4),
  jiraBacklogFilterId: '10001',
  jiraThroughputFilterId: '10002',
  statusConfig: { concluded: ['Done'], inProgress: ['In Progress'] },
  companyId: COMPANY_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeIssue(resolutionDate: Date | null = null) {
  return {
    key: 'TST-1',
    summary: 'Summary',
    status: resolutionDate ? 'Done' : 'In Progress',
    issueType: 'Story',
    assignee: null,
    createdDate: new Date(2025, 0, 1),
    resolutionDate,
  };
}

// ─── Mock factories ───────────────────────────────────────────────────────────

function makePrisma(): jest.Mocked<PrismaService> {
  return {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

function makeMetrics(): jest.Mocked<MetricsService> {
  return {
    computeWeeklyMetricsFromIssues: jest.fn().mockReturnValue([]),
    getThroughputDistribution: jest.fn().mockReturnValue([3, 3, 3]),
    getRemainingCount: jest.fn().mockReturnValue(5),
    getAverageWeeklyThroughput: jest.fn().mockReturnValue(3),
    getCurrentWeekThroughput: jest.fn().mockReturnValue(3),
  } as unknown as jest.Mocked<MetricsService>;
}

function makeMonteCarlo(): jest.Mocked<MonteCarloService> {
  return {
    runSimulation: jest.fn().mockReturnValue({
      p50Date: new Date(2025, 5, 1),
      p85Date: new Date(2025, 6, 1),
      p95Date: new Date(2025, 7, 1),
      distribution: [],
    }),
  } as unknown as jest.Mocked<MonteCarloService>;
}

function makeBaseline(): jest.Mocked<BaselineService> {
  return {
    computeBaseline: jest.fn().mockReturnValue([
      { week: new Date(2025, 0, 4), value: 10 },
      { week: new Date(2025, 0, 11), value: 5 },
      { week: new Date(2025, 0, 18), value: 0 },
    ]),
  } as unknown as jest.Mocked<BaselineService>;
}

function makeJira(): jest.Mocked<JiraClientService> {
  return {
    fetchIssuesByFilter: jest.fn(),
  } as unknown as jest.Mocked<JiraClientService>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: jest.Mocked<PrismaService>;
  let metrics: jest.Mocked<MetricsService>;
  let monteCarlo: jest.Mocked<MonteCarloService>;
  let baseline: jest.Mocked<BaselineService>;
  let jira: jest.Mocked<JiraClientService>;

  beforeEach(() => {
    prisma = makePrisma();
    metrics = makeMetrics();
    monteCarlo = makeMonteCarlo();
    baseline = makeBaseline();
    jira = makeJira();
    service = new ProjectsService(prisma, metrics, monteCarlo, baseline, jira);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates project with provided statusConfig', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValueOnce(PROJECT);
      const dto = {
        epicId: 'TST-1',
        name: 'Test Project',
        squadName: 'Squad A',
        teamSize: 5,
        beginDate: new Date(2025, 0, 4),
        jiraBacklogFilterId: '10001',
        jiraThroughputFilterId: '10002',
        statusConfig: { concluded: ['Done'], inProgress: ['In Progress'] },
      };

      const result = await service.create(dto, COMPANY_ID);

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ companyId: COMPANY_ID }) }),
      );
      expect(result).toBe(PROJECT);
    });

    it('applies default statusConfig when none is provided', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValueOnce(PROJECT);
      const dto = {
        epicId: 'TST-1',
        name: 'Test Project',
        squadName: 'Squad A',
        teamSize: 5,
        beginDate: new Date(2025, 0, 4),
        jiraBacklogFilterId: '10001',
        jiraThroughputFilterId: '10002',
      };

      await service.create(dto, COMPANY_ID);

      const createCall = (prisma.project.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.statusConfig).toHaveProperty('concluded');
      expect(createCall.data.statusConfig).toHaveProperty('inProgress');
      expect(createCall.data.statusConfig.concluded).toContain('Done');
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns projects ordered by createdAt desc for the company', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValueOnce([PROJECT]);

      const result = await service.findAll(COMPANY_ID);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: COMPANY_ID } }),
      );
      expect(result).toEqual([PROJECT]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the project when it exists and belongs to the company', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);

      const result = await service.findOne(PROJECT_ID, COMPANY_ID);
      expect(result).toBe(PROJECT);
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent', COMPANY_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project belongs to a different company', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);

      await expect(service.findOne(PROJECT_ID, 'other-company')).rejects.toThrow(NotFoundException);
    });

    it('returns project without company check when companyId is omitted', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);

      const result = await service.findOne(PROJECT_ID);
      expect(result).toBe(PROJECT);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('finds project then updates it', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);
      (prisma.project.update as jest.Mock).mockResolvedValueOnce({ ...PROJECT, name: 'Updated' });

      const result = await service.update(PROJECT_ID, { name: 'Updated' }, COMPANY_ID);

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PROJECT_ID } }),
      );
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.update('bad-id', { name: 'X' }, COMPANY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('finds then deletes the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);
      (prisma.project.delete as jest.Mock).mockResolvedValueOnce(PROJECT);

      const result = await service.remove(PROJECT_ID, COMPANY_ID);

      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: PROJECT_ID } });
      expect(result).toBe(PROJECT);
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.remove('bad-id', COMPANY_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getStatus ────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    beforeEach(() => {
      // Project exists
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(PROJECT);
      // Jira returns some issues
      const resolved = makeIssue(new Date(2025, 0, 8));
      const open = makeIssue(null);
      (jira.fetchIssuesByFilter as jest.Mock)
        .mockResolvedValueOnce([resolved, open]) // backlog
        .mockResolvedValueOnce([resolved]);       // throughput
    });

    it('returns a StatusDashboardDto with correct project metadata', async () => {
      const result = await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(result.project.id).toBe(PROJECT_ID);
      expect(result.project.name).toBe(PROJECT.name);
    });

    it('calls fetchIssuesByFilter for both backlog and throughput filters', async () => {
      await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(jira.fetchIssuesByFilter).toHaveBeenCalledWith(PROJECT.jiraBacklogFilterId);
      expect(jira.fetchIssuesByFilter).toHaveBeenCalledWith(PROJECT.jiraThroughputFilterId);
    });

    it('calls computeWeeklyMetricsFromIssues with fetched issues', async () => {
      await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(metrics.computeWeeklyMetricsFromIssues).toHaveBeenCalled();
    });

    it('calls runSimulation when throughput distribution and remaining tasks are non-zero', async () => {
      metrics.getRemainingCount.mockReturnValue(5);
      metrics.getThroughputDistribution.mockReturnValue([3, 3, 3]);

      await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(monteCarlo.runSimulation).toHaveBeenCalled();
    });

    it('skips Monte Carlo simulation when remainingTasks is 0', async () => {
      metrics.getRemainingCount.mockReturnValue(0);

      await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(monteCarlo.runSimulation).not.toHaveBeenCalled();
    });

    it('skips Monte Carlo simulation when throughputDistribution is empty', async () => {
      metrics.getThroughputDistribution.mockReturnValue([]);

      await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(monteCarlo.runSimulation).not.toHaveBeenCalled();
    });

    it('includes kpis with completionPercentage', async () => {
      const result = await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(result.kpis).toHaveProperty('completionPercentage');
      expect(result.kpis.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(result.kpis.completionPercentage).toBeLessThanOrEqual(100);
    });

    it('throws BadGatewayException when Jira call fails', async () => {
      // Reset and override: the first call throws, regardless of beforeEach queue
      (jira.fetchIssuesByFilter as jest.Mock).mockReset().mockRejectedValue(new Error('Jira down'));

      await expect(service.getStatus(PROJECT_ID, COMPANY_ID)).rejects.toThrow(BadGatewayException);
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getStatus('bad-id', COMPANY_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns empty tables when backlog is empty', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(PROJECT);
      // Reset to clear the beforeEach queue and return empty arrays for both filters
      (jira.fetchIssuesByFilter as jest.Mock).mockReset().mockResolvedValue([]);
      metrics.getRemainingCount.mockReturnValue(0);
      metrics.getThroughputDistribution.mockReturnValue([]);

      const result = await service.getStatus(PROJECT_ID, COMPANY_ID);

      expect(result.tables.remainingTasks).toEqual([]);
      expect(result.tables.recentCompleted).toEqual([]);
    });

    it('populates burndown and weeklyThroughput when metrics has rows (lines 170-171, 214-216)', async () => {
      // Return a real WeeklyMetricRow so the for-loop body and map callback execute
      const weekRow = {
        weekStart: new Date(2025, 0, 11), // Saturday Jan 11 — after PROJECT.beginDate (Jan 4)
        totalScope: 3,
        completedCount: 1,
        remainingCount: 2,
        weeklyThroughput: 1,
        baselineValue: 0,
      };
      metrics.computeWeeklyMetricsFromIssues.mockReturnValue([weekRow]);
      metrics.getThroughputDistribution.mockReturnValue([1]);
      metrics.getRemainingCount.mockReturnValue(2);

      const result = await service.getStatus(PROJECT_ID, COMPANY_ID);

      // burndown should include the begin point plus the metrics week (line 170-171)
      expect(result.chartData.burndown.length).toBeGreaterThan(1);

      // weeklyThroughput table should have one entry built from the metrics row (lines 214-216)
      expect(result.tables.weeklyThroughput).toHaveLength(1);
      expect(result.tables.weeklyThroughput[0].throughput).toBe(1);
    });

    it('sorts recentCompleted by most-recent first when multiple items are resolved (line 205)', async () => {
      // Two resolved items — sort comparator must be called
      const older = makeIssue(new Date(2025, 0, 5));
      const newer = makeIssue(new Date(2025, 0, 10));
      older['key'] = 'TST-OLD';
      newer['key'] = 'TST-NEW';

      (jira.fetchIssuesByFilter as jest.Mock).mockReset()
        .mockResolvedValueOnce([older, newer])  // backlog
        .mockResolvedValueOnce([older, newer]); // throughput

      const result = await service.getStatus(PROJECT_ID, COMPANY_ID);

      // Newest resolution date should come first
      expect(result.tables.recentCompleted[0].resolutionDate.getTime())
        .toBeGreaterThanOrEqual(result.tables.recentCompleted[1].resolutionDate.getTime());
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { type PrismaService } from '../prisma/prisma.service';
import { type MetricsService } from './metrics/metrics.service';
import { type MonteCarloService } from './monte-carlo/monte-carlo.service';
import { type BaselineService } from './baseline/baseline.service';
import { type JiraClientService } from '../jira/jira-client.service';

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
    getNextSaturdayAfter: jest.fn((d: Date) => d),
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
        expect.objectContaining({
          data: expect.objectContaining({ companyId: COMPANY_ID }),
        }),
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

      await expect(service.findOne('nonexistent', COMPANY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when project belongs to a different company', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);

      await expect(
        service.findOne(PROJECT_ID, 'other-company'),
      ).rejects.toThrow(NotFoundException);
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
      (prisma.project.update as jest.Mock).mockResolvedValueOnce({
        ...PROJECT,
        name: 'Updated',
      });

      const result = await service.update(
        PROJECT_ID,
        { name: 'Updated' },
        COMPANY_ID,
      );

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PROJECT_ID } }),
      );
      expect(result.name).toBe('Updated');
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.update('bad-id', { name: 'X' }, COMPANY_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('finds then deletes the project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(PROJECT);
      (prisma.project.delete as jest.Mock).mockResolvedValueOnce(PROJECT);

      const result = await service.remove(PROJECT_ID, COMPANY_ID);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
      });
      expect(result).toBe(PROJECT);
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.remove('bad-id', COMPANY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

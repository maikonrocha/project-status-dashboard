import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { StatusDashboardDto } from './dto/status.dto';
import { MetricsService } from './metrics/metrics.service';
import { MonteCarloService } from './monte-carlo/monte-carlo.service';
import { BaselineService } from './baseline/baseline.service';
import { JiraClientService } from '../jira/jira-client.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private monteCarloService: MonteCarloService,
    private baselineService: BaselineService,
    private jiraClient: JiraClientService,
  ) {}

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto, companyId: string) {
    return await this.prisma.project.create({
      data: {
        ...createProjectDto,
        companyId,
        statusConfig: (createProjectDto.statusConfig as
          | Prisma.InputJsonValue
          | undefined) || {
          concluded: [
            'Concluído',
            'Concluded',
            'Done',
            'Pendente de publicação',
            'Pendente publicação',
            'Pending Publication',
            'Pending Publication PRD',
          ],
          inProgress: [
            'Em Andamento',
            'In Progress',
            'Pendente teste',
            'Pending Test',
            'TEST PENDING',
            'Em Teste',
            'TEST',
            'Acompanhamento',
            'Liberado para Homologação',
            'AGUARDANDO CODEREVIEW',
            'Aguardando MR',
          ],
        },
      },
    });
  }

  async findAll(companyId: string) {
    return await this.prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (companyId && project.companyId !== companyId) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    companyId: string,
  ) {
    await this.findOne(id, companyId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        statusConfig: updateProjectDto.statusConfig as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.project.delete({ where: { id } });
  }

  /**
   * Get status dashboard data for a project.
   * All data is fetched live from Jira and computed in-memory on every call.
   */
  async getStatus(
    projectId: string,
    companyId?: string,
  ): Promise<StatusDashboardDto> {
    const project = await this.findOne(projectId, companyId);

    // 1. Fetch live issues from Jira
    let backlogIssues;
    let throughputIssues;
    try {
      backlogIssues = await this.jiraClient.fetchIssuesByFilter(
        project.jiraBacklogFilterId,
      );
      throughputIssues = await this.jiraClient.fetchIssuesByFilter(
        project.jiraThroughputFilterId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch Jira data for project ${project.name}: ${message}`,
      );
      throw new BadGatewayException(
        `Failed to fetch data from Jira: ${message}`,
      );
    }

    // 3. Compute weekly metrics in-memory from throughput history and backlog snapshot
    const metrics = this.metricsService.computeWeeklyMetricsFromIssues(
      throughputIssues,
      backlogIssues,
      project.beginDate,
    );

    // 4. Get throughput distribution for Monte Carlo
    const throughputDistribution =
      this.metricsService.getThroughputDistribution(metrics);

    // 5. Count remaining tasks from backlog
    const remainingTasks = this.metricsService.getRemainingCount(backlogIssues);

    // 6. Run Monte Carlo simulation fresh
    let simulationResults: Awaited<
      ReturnType<MonteCarloService['runSimulation']>
    > | null = null;
    if (throughputDistribution.length > 0 && remainingTasks > 0) {
      simulationResults = this.monteCarloService.runSimulation({
        remainingTasks,
        startDate: new Date(),
        throughputDistribution,
        numSimulations: 10000,
      });
    }

    // 7. Compute baseline in-memory (using P95 as target finish date)
    const totalScope = backlogIssues.length;

    let baselineSeries: ReturnType<BaselineService['computeBaseline']> = [];
    if (simulationResults) {
      baselineSeries = this.baselineService.computeBaseline(
        totalScope,
        project.beginDate,
        simulationResults.p95Date,
      );
    }

    // 8. Build KPIs
    const completed = backlogIssues.filter((i) => i.resolutionDate).length;
    const total = backlogIssues.length;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
    const avgWeeklyThroughput =
      this.metricsService.getAverageWeeklyThroughput(metrics);
    const currentWeekThroughput =
      this.metricsService.getCurrentWeekThroughput(metrics);

    // 9. Build chart data
    const burndown: { week: Date; remaining: number }[] = [];

    // Add absolute begin point
    const initialCompleted = backlogIssues.filter(
      (i) => i.resolutionDate && i.resolutionDate < project.beginDate,
    ).length;
    burndown.push({
      week: project.beginDate,
      remaining: Math.max(0, backlogIssues.length - initialCompleted),
    });

    // Add regular metrics points after the begin date
    for (const m of metrics) {
      if (m.weekStart.getTime() > project.beginDate.getTime()) {
        burndown.push({
          week: m.weekStart,
          remaining: m.remainingCount,
        });
      }
    }

    const baseline = baselineSeries.map((b) => ({
      week: b.week,
      value: b.value,
    }));

    const confidenceBand = simulationResults
      ? baselineSeries.map((b) => ({
          week: b.week,
          p50: b.value, // Placeholder since P50/P85 are removed
          p85: b.value,
        }))
      : [];

    // 10. Build tables
    const remainingTasksList = backlogIssues
      .filter((i) => !i.resolutionDate)
      .map((i) => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        assignee: i.assignee,
        createdDate: i.createdDate,
      }))
      .slice(0, 50);

    const recentCompleted = backlogIssues
      .filter(
        (i): i is typeof i & { resolutionDate: Date } =>
          i.resolutionDate != null,
      )
      .sort((a, b) => b.resolutionDate.getTime() - a.resolutionDate.getTime())
      .map((i) => ({
        key: i.key,
        summary: i.summary,
        resolutionDate: i.resolutionDate,
      }))
      .slice(0, 20);

    const weeklyThroughput = metrics.map((m) => {
      const friday = new Date(m.weekStart);
      friday.setDate(friday.getDate() + 6); // End of week (Friday)
      return {
        weekEnding: friday,
        throughput: m.weeklyThroughput,
        cumulative: m.completedCount,
        remaining: m.remainingCount,
      };
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        epicId: project.epicId,
        squadName: project.squadName,
        beginDate: project.beginDate,
        teamSize: project.teamSize,
      },
      kpis: {
        totalTasks: total,
        completed,
        remaining: remainingTasks,
        completionPercentage,
        avgWeeklyThroughput,
        currentWeekThroughput,
        predictedFinish: simulationResults?.p95Date ?? null,
      },
      chartData: { burndown, baseline, confidenceBand },
      tables: {
        remainingTasks: remainingTasksList,
        recentCompleted,
        weeklyThroughput,
      },
    };
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Project, StatusDashboard } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

// ECharts uses canvas APIs not available in happy-dom — stub the component
vi.mock('echarts-for-react', () => ({
  default: ({ option }: { option?: Record<string, unknown> }) => (
    <div
      data-testid="echarts"
      data-title={(option?.title as Record<string, unknown>)?.text as string}
      data-xaxis-max={String(
        (option?.xAxis as Record<string, unknown>)?.max ?? '',
      )}
    />
  ),
}));

import { useRouter } from 'next/navigation';
import { StatusDashboardClient } from './StatusDashboardClient';

const mockUseRouter = vi.mocked(useRouter);

const makeProject = (id: string, name: string): Project => ({
  id,
  name,
  epicId: `EPIC-${id}`,
  squadName: 'Squad Alpha',
  teamSize: 6,
  beginDate: '2025-01-06T00:00:00.000Z',
  jiraBacklogFilterId: '100',
  jiraThroughputFilterId: '200',
  statusConfig: {},
  companyId: 'c1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

const makeDashboard = (
  overrides: Partial<StatusDashboard> = {},
): StatusDashboard => ({
  project: {
    id: '1',
    name: 'Alpha Project',
    epicId: 'EPIC-1',
    squadName: 'Squad Alpha',
    teamSize: 6,
    beginDate: '2025-01-06T00:00:00.000Z',
  },
  kpis: {
    totalTasks: 100,
    completed: 60,
    remaining: 40,
    completionPercentage: 60,
    avgWeeklyThroughput: 8.5,
    currentWeekThroughput: 10,
    predictedFinish: '2025-06-30T00:00:00.000Z',
  },
  chartData: {
    burndown: [
      { week: '2025-01-06T00:00:00.000Z', remaining: 100 },
      { week: '2025-01-13T00:00:00.000Z', remaining: 90 },
    ],
    baseline: [
      { week: '2025-01-06T00:00:00.000Z', value: 100 },
      { week: '2025-06-30T00:00:00.000Z', value: 0 },
    ],
    confidenceBand: [],
  },
  tables: {
    remainingTasks: [
      {
        key: 'EPIC-10',
        summary: 'Fix login bug',
        status: 'Em Andamento',
        assignee: null,
        createdDate: null,
      },
      {
        key: 'EPIC-11',
        summary: 'Add dark mode',
        status: 'In Progress',
        assignee: null,
        createdDate: null,
      },
    ],
    recentCompleted: [],
    weeklyThroughput: [
      {
        weekEnding: '2025-01-12T00:00:00.000Z',
        throughput: 8,
        cumulative: 8,
        remaining: 92,
      },
      {
        weekEnding: '2025-01-19T00:00:00.000Z',
        throughput: 10,
        cumulative: 18,
        remaining: 82,
      },
    ],
  },
  ...overrides,
});

const projects = [
  makeProject('1', 'Alpha Project'),
  makeProject('2', 'Beta Project'),
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: vi.fn() } as unknown as ReturnType<
    typeof useRouter
  >);
});

describe('StatusDashboardClient', () => {
  it('renders the project name as heading', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Alpha Project' }),
    ).toBeInTheDocument();
  });

  it('renders the epic ID', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    // The paragraph text is "Epic: EPIC-1"
    expect(screen.getByText('Epic: EPIC-1')).toBeInTheDocument();
  });

  it('renders KPI: Total Tasks', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Total de Tarefas')).toBeInTheDocument();
  });

  it('renders KPI: Completed with percentage', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('renders KPI: Remaining label and value', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    // "Restantes" appears in the KPI label; "Restante" in the table header
    expect(screen.getAllByText('Restantes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('40').length).toBeGreaterThanOrEqual(1);
  });

  it('renders KPI: Avg Throughput with current week subtitle', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText(/Esta semana: 10/)).toBeInTheDocument();
  });

  it('renders KPI: Started date formatted', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('Iniciado')).toBeInTheDocument();
    expect(screen.getByText('06/01/2025')).toBeInTheDocument();
  });

  it('renders KPI: Finish Review date', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('Revisão de Término')).toBeInTheDocument();
    expect(screen.getByText('30/06/2025')).toBeInTheDocument();
  });

  it('renders burndown chart when data is present', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    const charts = screen.getAllByTestId('echarts');
    const burndown = charts.find(
      (c) => c.getAttribute('data-title') === 'Burndown com Baseline',
    );
    expect(burndown).toBeInTheDocument();
  });

  it('renders throughput chart when data is present', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    const charts = screen.getAllByTestId('echarts');
    const throughput = charts.find(
      (c) => c.getAttribute('data-title') === 'Throughput Semanal',
    );
    expect(throughput).toBeInTheDocument();
  });

  it('shows "No burndown data available" when burndown is empty', () => {
    const data = makeDashboard({
      chartData: { burndown: [], baseline: [], confidenceBand: [] },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    expect(
      screen.getByText('Nenhum dado de burndown disponível'),
    ).toBeInTheDocument();
  });

  it('shows "No throughput data available" when weekly throughput is empty', () => {
    const data = makeDashboard({
      tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    expect(
      screen.getByText('Nenhum dado de throughput disponível'),
    ).toBeInTheDocument();
  });

  it('renders remaining tasks in the table', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('EPIC-10')).toBeInTheDocument();
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    expect(screen.getByText('EPIC-11')).toBeInTheDocument();
  });

  it('shows "No remaining tasks" when list is empty', () => {
    const data = makeDashboard({
      tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    expect(screen.getByText('Nenhuma tarefa restante')).toBeInTheDocument();
  });

  it('renders weekly throughput rows in reverse order', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    // Most recent week (Jan 19) should appear before Jan 12 in reversed table
    expect(screen.getByText('19/01/2025')).toBeInTheDocument();
    expect(screen.getByText('12/01/2025')).toBeInTheDocument();
  });

  it('shows "No throughput data yet" in table when empty', () => {
    const data = makeDashboard({
      tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    expect(
      screen.getByText('Nenhum dado de throughput ainda'),
    ).toBeInTheDocument();
  });

  it('renders project selector with all projects as options', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    const select = document.getElementById(
      'project-selector',
    ) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(2);
  });

  it('navigates to selected project on selector change', () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );

    const select = document.getElementById('project-selector')!;
    fireEvent.change(select, { target: { value: '2' } });

    expect(mockPush).toHaveBeenCalledWith('/projects/2/status');
  });

  it('shows squad name and team size in sub-nav', () => {
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );
    expect(screen.getByText('Squad Alpha')).toBeInTheDocument();
    expect(screen.getByText(/Equipe: 6/)).toBeInTheDocument();
  });

  it('"All Projects" button navigates to /', () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);
    render(
      <StatusDashboardClient
        projectId="1"
        data={makeDashboard()}
        projects={projects}
      />,
    );

    fireEvent.click(screen.getByText('Todos os Projetos'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('renders "-" for predictedFinish when null', () => {
    const data = makeDashboard({
      kpis: { ...makeDashboard().kpis, predictedFinish: null },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    expect(screen.getByText('Revisão de Término')).toBeInTheDocument();
    // formatDate(null) returns '-'
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  it('chartMax snaps to next Saturday when predictedFinish is a non-Saturday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // 2026-01-01, before predictedFinish
    // Use local midnight to avoid UTC timezone shift (CLAUDE.md rule)
    // 2026-06-03 is a Wednesday locally
    const data = makeDashboard({
      kpis: {
        ...makeDashboard().kpis,
        predictedFinish: new Date(2026, 5, 3).toISOString(),
      },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    const burndownChart = screen
      .getAllByTestId('echarts')
      .find((c) => c.getAttribute('data-title') === 'Burndown com Baseline')!;
    const maxTs = Number(burndownChart.getAttribute('data-xaxis-max'));
    const maxDate = new Date(maxTs);
    // Next Saturday after Wednesday 2026-06-03 is 2026-06-06
    expect(maxDate.getDay()).toBe(6);
    expect(maxDate.getFullYear()).toBe(2026);
    expect(maxDate.getMonth()).toBe(5); // June (0-indexed)
    expect(maxDate.getDate()).toBe(6);
    vi.useRealTimers();
  });

  it('chartMax uses the user-reported bug case: predictedFinish May 15 (Friday) → May 16 (Saturday)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    const data = makeDashboard({
      kpis: {
        ...makeDashboard().kpis,
        predictedFinish: new Date(2026, 4, 15).toISOString(),
      },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    const chart = screen
      .getAllByTestId('echarts')
      .find((c) => c.getAttribute('data-title') === 'Burndown com Baseline')!;
    const maxDate = new Date(Number(chart.getAttribute('data-xaxis-max')));
    expect(maxDate.getDay()).toBe(6);
    expect(maxDate.getMonth()).toBe(4);
    expect(maxDate.getDate()).toBe(16);
    vi.useRealTimers();
  });

  it('chartMax advances to the NEXT Saturday when predictedFinish is already a Saturday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // 2026-01-01, before predictedFinish
    // Use local midnight to avoid UTC timezone shift (CLAUDE.md rule)
    // 2026-06-06 is a Saturday locally
    const data = makeDashboard({
      kpis: {
        ...makeDashboard().kpis,
        predictedFinish: new Date(2026, 5, 6).toISOString(),
      },
    });
    render(
      <StatusDashboardClient projectId="1" data={data} projects={projects} />,
    );
    const burndownChart = screen
      .getAllByTestId('echarts')
      .find((c) => c.getAttribute('data-title') === 'Burndown com Baseline')!;
    const maxTs = Number(burndownChart.getAttribute('data-xaxis-max'));
    const maxDate = new Date(maxTs);
    // Must be the FOLLOWING Saturday: 2026-06-13
    expect(maxDate.getDay()).toBe(6);
    expect(maxDate.getFullYear()).toBe(2026);
    expect(maxDate.getMonth()).toBe(5); // June (0-indexed)
    expect(maxDate.getDate()).toBe(13);
    vi.useRealTimers();
  });
});

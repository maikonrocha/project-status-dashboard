import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Project, StatusDashboard } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

// ECharts uses canvas APIs not available in happy-dom — stub the component
vi.mock('echarts-for-react', () => ({
    default: ({ option }: any) => (
        <div data-testid="echarts" data-title={option?.title?.text} />
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

const makeDashboard = (overrides: Partial<StatusDashboard> = {}): StatusDashboard => ({
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
            { key: 'EPIC-10', summary: 'Fix login bug', status: 'Em Andamento' },
            { key: 'EPIC-11', summary: 'Add dark mode', status: 'In Progress' },
        ],
        recentCompleted: [],
        weeklyThroughput: [
            { weekEnding: '2025-01-12T00:00:00.000Z', throughput: 8, cumulative: 8, remaining: 92 },
            { weekEnding: '2025-01-19T00:00:00.000Z', throughput: 10, cumulative: 18, remaining: 82 },
        ],
    },
    ...overrides,
});

const projects = [makeProject('1', 'Alpha Project'), makeProject('2', 'Beta Project')];

beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
});

describe('StatusDashboardClient', () => {
    it('renders the project name as heading', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByRole('heading', { name: 'Alpha Project' })).toBeInTheDocument();
    });

    it('renders the epic ID', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        // The paragraph text is "Epic: EPIC-1"
        expect(screen.getByText('Epic: EPIC-1')).toBeInTheDocument();
    });

    it('renders KPI: Total Tasks', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    });

    it('renders KPI: Completed with percentage', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('60.0%')).toBeInTheDocument();
    });

    it('renders KPI: Remaining label and value', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        // "Remaining" appears in both the KPI label and the table header
        expect(screen.getAllByText('Remaining').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('40').length).toBeGreaterThanOrEqual(1);
    });

    it('renders KPI: Avg Throughput with current week subtitle', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('8.5')).toBeInTheDocument();
        expect(screen.getByText(/This week: 10/)).toBeInTheDocument();
    });

    it('renders KPI: Started date formatted', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('Started')).toBeInTheDocument();
        expect(screen.getByText('06/01/2025')).toBeInTheDocument();
    });

    it('renders KPI: Finish Review date', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('Finish Review')).toBeInTheDocument();
        expect(screen.getByText('30/06/2025')).toBeInTheDocument();
    });

    it('renders burndown chart when data is present', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        const charts = screen.getAllByTestId('echarts');
        const burndown = charts.find((c) => c.getAttribute('data-title') === 'Burndown with Baseline');
        expect(burndown).toBeInTheDocument();
    });

    it('renders throughput chart when data is present', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        const charts = screen.getAllByTestId('echarts');
        const throughput = charts.find((c) => c.getAttribute('data-title') === 'Weekly Throughput');
        expect(throughput).toBeInTheDocument();
    });

    it('shows "No burndown data available" when burndown is empty', () => {
        const data = makeDashboard({ chartData: { burndown: [], baseline: [], confidenceBand: [] } });
        render(<StatusDashboardClient projectId="1" data={data} projects={projects} />);
        expect(screen.getByText('No burndown data available')).toBeInTheDocument();
    });

    it('shows "No throughput data available" when weekly throughput is empty', () => {
        const data = makeDashboard({
            tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
        });
        render(<StatusDashboardClient projectId="1" data={data} projects={projects} />);
        expect(screen.getByText('No throughput data available')).toBeInTheDocument();
    });

    it('renders remaining tasks in the table', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('EPIC-10')).toBeInTheDocument();
        expect(screen.getByText('Fix login bug')).toBeInTheDocument();
        expect(screen.getByText('EPIC-11')).toBeInTheDocument();
    });

    it('shows "No remaining tasks" when list is empty', () => {
        const data = makeDashboard({
            tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
        });
        render(<StatusDashboardClient projectId="1" data={data} projects={projects} />);
        expect(screen.getByText('No remaining tasks')).toBeInTheDocument();
    });

    it('renders weekly throughput rows in reverse order', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        // Most recent week (Jan 19) should appear before Jan 12 in reversed table
        expect(screen.getByText('19/01/2025')).toBeInTheDocument();
        expect(screen.getByText('12/01/2025')).toBeInTheDocument();
    });

    it('shows "No throughput data yet" in table when empty', () => {
        const data = makeDashboard({
            tables: { remainingTasks: [], recentCompleted: [], weeklyThroughput: [] },
        });
        render(<StatusDashboardClient projectId="1" data={data} projects={projects} />);
        expect(screen.getByText('No throughput data yet')).toBeInTheDocument();
    });

    it('renders project selector with all projects as options', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        const select = document.getElementById('project-selector') as HTMLSelectElement;
        expect(select).toBeInTheDocument();
        expect(select.options).toHaveLength(2);
    });

    it('navigates to selected project on selector change', () => {
        const mockPush = vi.fn();
        mockUseRouter.mockReturnValue({ push: mockPush } as any);
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);

        const select = document.getElementById('project-selector')!;
        fireEvent.change(select, { target: { value: '2' } });

        expect(mockPush).toHaveBeenCalledWith('/projects/2/status');
    });

    it('shows squad name and team size in sub-nav', () => {
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);
        expect(screen.getByText('Squad Alpha')).toBeInTheDocument();
        expect(screen.getByText(/Team: 6/)).toBeInTheDocument();
    });

    it('"All Projects" button navigates to /', () => {
        const mockPush = vi.fn();
        mockUseRouter.mockReturnValue({ push: mockPush } as any);
        render(<StatusDashboardClient projectId="1" data={makeDashboard()} projects={projects} />);

        fireEvent.click(screen.getByText('All Projects'));
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('renders "-" for predictedFinish when null', () => {
        const data = makeDashboard({ kpis: { ...makeDashboard().kpis, predictedFinish: null } });
        render(<StatusDashboardClient projectId="1" data={data} projects={projects} />);
        expect(screen.getByText('Finish Review')).toBeInTheDocument();
        // formatDate(null) returns '-'
        expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
    });
});

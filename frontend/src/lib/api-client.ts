import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

export interface Project {
    id: string;
    epicId: string;
    name: string;
    squadName: string;
    teamSize: number;
    beginDate: string;
    jiraBacklogFilterId: string;
    jiraThroughputFilterId: string;
    statusConfig: any;
    createdAt: string;
    updatedAt: string;
}

export interface StatusDashboard {
    project: {
        id: string;
        name: string;
        epicId: string;
        squadName: string;
        beginDate: string;
        teamSize: number;
    };
    kpis: {
        totalTasks: number;
        completed: number;
        remaining: number;
        completionPercentage: number;
        avgWeeklyThroughput: number;
        currentWeekThroughput: number;
        predictedFinish: string | null;
    };
    chartData: {
        burndown: Array<{ week: string; remaining: number }>;
        baseline: Array<{ week: string; value: number }>;
        confidenceBand: Array<{ week: string; p50: number; p85: number }>;
    };
    tables: {
        remainingTasks: Array<{
            key: string;
            summary: string;
            status: string;
            assignee: string | null;
            createdDate: string | null;
        }>;
        recentCompleted: Array<{
            key: string;
            summary: string;
            resolutionDate: string;
        }>;
        weeklyThroughput: Array<{
            weekEnding: string;
            throughput: number;
            cumulative: number;
            remaining: number;
        }>;
    };
}

export const projectsApi = {
    getAll: () => api.get<Project[]>('/projects'),
    getOne: (id: string) => api.get<Project>(`/projects/${id}`),
    create: (data: Partial<Project>) => api.post<Project>('/projects', data),
    update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    getStatus: (id: string) => api.get<StatusDashboard>(`/projects/${id}/status`),
};

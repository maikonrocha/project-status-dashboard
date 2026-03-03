export class CreateProjectDto {
    epicId: string;
    name: string;
    squadName: string;
    teamSize: number;
    beginDate: Date;
    jiraBacklogFilterId: string;
    jiraThroughputFilterId: string;
    statusConfig?: {
        concluded: string[];
        inProgress: string[];
    };
}

export class UpdateProjectDto {
    name?: string;
    squadName?: string;
    teamSize?: number;
    beginDate?: Date;
    jiraBacklogFilterId?: string;
    jiraThroughputFilterId?: string;
    statusConfig?: {
        concluded: string[];
        inProgress: string[];
    };
}

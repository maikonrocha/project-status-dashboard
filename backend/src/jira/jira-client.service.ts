import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Parsed issue returned by the Jira client.
 * All dates are already converted from ISO strings to Date objects.
 */
export interface JiraIssueData {
    key: string;
    summary: string;
    status: string;
    issueType: string;
    assignee: string | null;
    createdDate: Date;
    resolutionDate: Date | null;
}

@Injectable()
export class JiraClientService {
    private readonly logger = new Logger(JiraClientService.name);
    private readonly client: AxiosInstance;
    private readonly baseUrl: string;

    constructor(private config: ConfigService) {
        const site = (config.get<string>('JIRA_CLOUD_INSTANCE_URL') || '').replace(/\/+$/, '');
        const email = config.get<string>('JIRA_EMAIL') || '';
        const token = config.get<string>('JIRA_API_TOKEN') || '';

        if (!site || !email || !token) {
            this.logger.warn(
                'Jira credentials not fully configured. Set JIRA_CLOUD_INSTANCE_URL, JIRA_EMAIL, JIRA_API_TOKEN.',
            );
        }

        this.baseUrl = site;

        this.client = axios.create({
            baseURL: site,
            auth: { username: email, password: token },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Fetch all issues matching a saved Jira filter, handling pagination automatically.
     *
     * Uses POST /rest/api/3/search/jql with cursor-based pagination via `nextPageToken`.
     * Note: the old `startAt` field is NOT supported by this endpoint — sending it causes 400.
     */
    async fetchIssuesByFilter(filterId: string): Promise<JiraIssueData[]> {
        const allIssues: JiraIssueData[] = [];
        const maxResults = 100;
        let nextPageToken: string | undefined = undefined;

        this.logger.log(`Fetching issues for filter ${filterId} from ${this.baseUrl}`);

        do {
            const payload: Record<string, unknown> = {
                jql: `filter = ${filterId}`,
                fields: [
                    'summary',
                    'status',
                    'assignee',
                    'issuetype',
                    'created',
                    'resolutiondate',
                ],
                maxResults,
            };

            // Only include nextPageToken when paginating (not on the first request)
            if (nextPageToken) {
                payload.nextPageToken = nextPageToken;
            }

            const { data } = await this.client.post('/rest/api/3/search/jql', payload);

            const issues: any[] = data.issues || [];
            for (const issue of issues) {
                allIssues.push(this.mapIssue(issue));
            }

            this.logger.log(
                `  Page (token=${nextPageToken ?? 'first'}): ${issues.length} issues (total so far: ${allIssues.length})`,
            );

            // Cursor-based pagination: use nextPageToken from response
            nextPageToken = data.nextPageToken ?? undefined;

        } while (nextPageToken);

        this.logger.log(`>>>>>> Fetched ${allIssues.length} total issues for filter ${filterId}`);
        this.logger.log(`>>>>>> Issues list: ${JSON.stringify(allIssues, null, 2)}`);
        return allIssues;
    }

    /**
     * Map a raw Jira API issue object into our clean interface.
     */
    private mapIssue(raw: any): JiraIssueData {
        const fields = raw.fields || {};
        return {
            key: raw.key,
            summary: fields.summary || '',
            status: fields.status?.name || 'Unknown',
            issueType: fields.issuetype?.name || 'Task',
            assignee: fields.assignee?.displayName || null,
            createdDate: new Date(fields.created),
            resolutionDate: fields.resolutiondate
                ? new Date(fields.resolutiondate)
                : null,
        };
    }
}

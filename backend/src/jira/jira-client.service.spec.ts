import { ConfigService } from '@nestjs/config';
import { JiraClientService } from './jira-client.service';

// ─── Axios mock ───────────────────────────────────────────────────────────────
// We intercept axios.create so the service uses our fake AxiosInstance.
const mockPost = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({ post: mockPost })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfigService(overrides: Record<string, string> = {}): ConfigService {
  const cfg: Record<string, string> = {
    JIRA_CLOUD_INSTANCE_URL: 'https://test.atlassian.net',
    JIRA_EMAIL: 'user@test.com',
    JIRA_API_TOKEN: 'token-abc',
    ...overrides,
  };
  return { get: (key: string) => cfg[key] } as unknown as ConfigService;
}

function makeRawIssue(overrides: Record<string, unknown> = {}) {
  return {
    key: 'TST-1',
    fields: {
      summary: 'Test summary',
      status: { name: 'Done' },
      issuetype: { name: 'Story' },
      assignee: { displayName: 'John Doe' },
      created: '2025-01-01T10:00:00.000Z',
      resolutiondate: '2025-01-10T10:00:00.000Z',
      ...overrides,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JiraClientService', () => {
  let service: JiraClientService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JiraClientService(makeConfigService());
  });

  // ─── Single-page fetch ───────────────────────────────────────────────────

  describe('fetchIssuesByFilter — single page', () => {
    it('returns mapped issues from a single page response', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          issues: [makeRawIssue()],
          // no nextPageToken → only one page
        },
      });

      const result = await service.fetchIssuesByFilter('10001');

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('TST-1');
      expect(result[0].summary).toBe('Test summary');
      expect(result[0].status).toBe('Done');
      expect(result[0].issueType).toBe('Story');
      expect(result[0].assignee).toBe('John Doe');
      expect(result[0].createdDate).toBeInstanceOf(Date);
      expect(result[0].resolutionDate).toBeInstanceOf(Date);
    });

    it('returns empty array when response has no issues', async () => {
      mockPost.mockResolvedValueOnce({ data: { issues: [] } });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result).toEqual([]);
    });

    it('sends filter ID in the JQL payload', async () => {
      mockPost.mockResolvedValueOnce({ data: { issues: [] } });

      await service.fetchIssuesByFilter('99999');

      expect(mockPost).toHaveBeenCalledWith(
        '/rest/api/3/search/jql',
        expect.objectContaining({ jql: 'filter = 99999' }),
      );
    });

    it('does NOT include nextPageToken on the first request', async () => {
      mockPost.mockResolvedValueOnce({ data: { issues: [] } });

      await service.fetchIssuesByFilter('10001');

      const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('nextPageToken');
    });
  });

  // ─── Pagination ──────────────────────────────────────────────────────────

  describe('fetchIssuesByFilter — pagination', () => {
    it('fetches all pages and aggregates issues', async () => {
      mockPost
        .mockResolvedValueOnce({
          data: {
            issues: [makeRawIssue({ key: 'TST-1' }), makeRawIssue({ key: 'TST-2' })],
            nextPageToken: 'cursor-page-2',
          },
        })
        .mockResolvedValueOnce({
          data: {
            issues: [makeRawIssue({ key: 'TST-3' })],
            // no nextPageToken → last page
          },
        });

      const result = await service.fetchIssuesByFilter('10001');

      expect(result).toHaveLength(3);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('sends nextPageToken on subsequent requests', async () => {
      mockPost
        .mockResolvedValueOnce({
          data: { issues: [], nextPageToken: 'page-token-x' },
        })
        .mockResolvedValueOnce({
          data: { issues: [] },
        });

      await service.fetchIssuesByFilter('10001');

      const secondCallPayload = mockPost.mock.calls[1][1] as Record<string, unknown>;
      expect(secondCallPayload.nextPageToken).toBe('page-token-x');
    });
  });

  // ─── Field mapping ────────────────────────────────────────────────────────

  describe('fetchIssuesByFilter — field mapping', () => {
    it('maps null assignee when assignee field is absent', async () => {
      mockPost.mockResolvedValueOnce({
        data: { issues: [makeRawIssue({ assignee: null })] },
      });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result[0].assignee).toBeNull();
    });

    it('maps null resolutionDate when resolutiondate field is absent', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          issues: [makeRawIssue({ resolutiondate: null })],
        },
      });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result[0].resolutionDate).toBeNull();
    });

    it('falls back to "Unknown" status when status field is missing', async () => {
      const raw = makeRawIssue();
      (raw.fields as any).status = undefined;
      mockPost.mockResolvedValueOnce({ data: { issues: [raw] } });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result[0].status).toBe('Unknown');
    });

    it('falls back to "Task" issueType when issuetype field is missing', async () => {
      const raw = makeRawIssue();
      (raw.fields as any).issuetype = undefined;
      mockPost.mockResolvedValueOnce({ data: { issues: [raw] } });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result[0].issueType).toBe('Task');
    });

    it('falls back to empty string summary when summary is missing', async () => {
      const raw = makeRawIssue();
      (raw.fields as any).summary = undefined;
      mockPost.mockResolvedValueOnce({ data: { issues: [raw] } });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result[0].summary).toBe('');
    });

    it('returns empty array when response omits the issues field entirely (line 91: data.issues || [])', async () => {
      // data has no `issues` key — the `|| []` fallback at line 91 must execute
      mockPost.mockResolvedValueOnce({ data: {} });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result).toEqual([]);
    });

    it('maps issue with missing fields property using empty-object fallback (line 113: raw.fields || {})', async () => {
      // Raw issue has no `fields` property — the `|| {}` at line 113 must execute
      const rawNoFields = { key: 'TST-99' }; // no fields
      mockPost.mockResolvedValueOnce({ data: { issues: [rawNoFields] } });

      const result = await service.fetchIssuesByFilter('10001');
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('TST-99');
      expect(result[0].summary).toBe('');
      expect(result[0].status).toBe('Unknown');
      expect(result[0].issueType).toBe('Task');
      expect(result[0].assignee).toBeNull();
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  describe('fetchIssuesByFilter — error handling', () => {
    it('throws when Jira response contains errorMessages', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          errorMessages: ['Filter 10001 does not exist'],
          issues: [],
        },
      });

      await expect(service.fetchIssuesByFilter('10001')).rejects.toThrow(
        /Jira error for filter 10001/,
      );
    });

    it('propagates network errors from axios', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.fetchIssuesByFilter('10001')).rejects.toThrow('Network timeout');
    });
  });

  // ─── Constructor warnings ────────────────────────────────────────────────

  describe('constructor — missing credentials', () => {
    it('constructs without throwing even when credentials are missing', () => {
      const emptyCfg = makeConfigService({
        JIRA_CLOUD_INSTANCE_URL: '',
        JIRA_EMAIL: '',
        JIRA_API_TOKEN: '',
      });

      expect(() => new JiraClientService(emptyCfg)).not.toThrow();
    });
  });
});

/**
 * 収集 CLI 統合テスト
 * モック GithubClient を使用し、実際の gh CLI を呼ばずに収集フローを検証する
 */
import { describe, expect, it } from 'vitest';
import type { GithubClient } from '../../src/github/client.js';

const SKIP = process.env['SKIP_INTEGRATION'] === 'true';

/** モック GithubClient：固定レスポンスを返す */
function createMockClient(): GithubClient {
    return {
        async executeGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
            void query;
            void variables;
            return {
                search: {
                    nodes: [],
                    pageInfo: { hasNextPage: false, endCursor: null },
                },
            } as unknown as T;
        },
        async executeGraphQLPaged<TResponse, TNode>(params: {
            query: string;
            variables: Record<string, unknown>;
            extractNodes: (response: TResponse) => TNode[];
            extractPageInfo: (response: TResponse) => { hasNextPage: boolean; endCursor: string | null };
        }): Promise<TNode[]> {
            const response = {
                organization: {
                    projectV2: {
                        id: 'PVT_kwDOAA',
                        title: 'Issue Project',
                        items: {
                            pageInfo: { hasNextPage: false, endCursor: null },
                            nodes: [
                                {
                                    id: 'PVTI_1',
                                    updatedAt: '2026-05-15T09:00:00Z',
                                    content: {
                                        number: 101,
                                        title: 'Done issue',
                                        assignees: {
                                            nodes: [{ login: 'user1' }],
                                        },
                                    },
                                    fieldValues: {
                                        nodes: [
                                            {
                                                __typename: 'ProjectV2ItemFieldSingleSelectValue',
                                                name: 'Done',
                                                field: { name: 'Status' },
                                            },
                                            {
                                                __typename: 'ProjectV2ItemFieldNumberValue',
                                                number: 5,
                                                field: { name: 'Estimate' },
                                            },
                                            {
                                                __typename: 'ProjectV2ItemFieldDateValue',
                                                date: '2026-05-15',
                                                field: { name: 'Done Date' },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
                user: null,
            } as TResponse;

            void params.query;
            void params.variables;
            void params.extractPageInfo(response);
            return params.extractNodes(response);
        },
    };
}

describe.skipIf(SKIP)('collect 統合テスト', () => {
    it('モッククライアントで collectActivity が正常終了する', async () => {
        const { collectActivity } = await import('../../src/domain/collectActivity.js');
        const mockClient = createMockClient();

        const result = await collectActivity({
            client: mockClient,
            request: {
                period: { from: '2026-05-01', to: '2026-05-31' },
                repositories: [{ owner: 'example', name: 'repo-a' }],
                logins: ['user1'],
            },
        });

        expect(result.dataset.datasetVersion).toBe('1.1.0');
        expect(result.dataset.contributors).toHaveLength(1);
        expect(result.dataset.contributors[0]!.login).toBe('user1');
    });

    it('Project 指定時に issueMetrics を集計できる', async () => {
        const { collectActivity } = await import('../../src/domain/collectActivity.js');
        const mockClient = createMockClient();

        const result = await collectActivity({
            client: mockClient,
            request: {
                period: { from: '2026-05-01', to: '2026-05-31' },
                repositories: [{ owner: 'example', name: 'repo-a' }],
                logins: ['user1'],
                project: {
                    owner: 'example-org',
                    number: 12,
                },
            },
        });

        expect(result.dataset.issueMetrics).toEqual({
            projectId: 'example-org#12',
            period: { from: '2026-05-01', to: '2026-05-31' },
            contributors: [
                {
                    login: 'user1',
                    doneCount: 1,
                    estimateTotal: 5,
                    estimateMissingCount: 0,
                    doneIssueNumbers: [101],
                },
            ],
            unassigned: {
                login: 'unassigned',
                doneCount: 0,
                estimateTotal: 0,
                estimateMissingCount: 0,
                doneIssueNumbers: [],
            },
        });
    });
});

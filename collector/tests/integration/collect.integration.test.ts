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
            // PR 検索クエリへのレスポンス
            return {
                search: {
                    nodes: [],
                    pageInfo: { hasNextPage: false, endCursor: null },
                },
            } as unknown as T;
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

        expect(result.dataset.datasetVersion).toBe('1.0.0');
        expect(result.dataset.contributors).toHaveLength(1);
        expect(result.dataset.contributors[0]!.login).toBe('user1');
    });
});

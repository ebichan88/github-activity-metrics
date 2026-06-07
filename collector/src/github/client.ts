import { execSync } from 'node:child_process';

/**
 * gh CLI 実行境界のインターフェース
 * テスト時にモック実装を注入可能にするため、インターフェースとして定義する
 */
export interface GithubClient {
    executeGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T>;
}

/** GraphQL レスポンスの型 */
interface GraphQLResponse<T> {
    data: T;
    errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

/**
 * gh CLI を使用した本番用 GithubClient 実装
 * `gh api graphql --input -` でクエリを実行する
 */
export class CliGithubClient implements GithubClient {
    async executeGraphQL<T>(
        query: string,
        variables: Record<string, unknown>
    ): Promise<T> {
        const input = JSON.stringify({ query, variables });

        let output: string;
        try {
            output = execSync('gh api graphql --input -', {
                input,
                encoding: 'utf-8',
                // 大量データ取得時に備えて上限を拡大
                maxBuffer: 50 * 1024 * 1024,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`gh CLI 実行エラー: ${msg}`);
        }

        const parsed = JSON.parse(output) as GraphQLResponse<T>;

        if (parsed.errors && parsed.errors.length > 0) {
            const messages = parsed.errors.map((e) => e.message).join(', ');
            throw new Error(`GraphQL エラー: ${messages}`);
        }

        return parsed.data;
    }
}

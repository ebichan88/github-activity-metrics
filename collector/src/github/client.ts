import { execSync } from 'node:child_process';

/**
 * gh CLI 実行境界のインターフェース
 * テスト時にモック実装を注入可能にするため、インターフェースとして定義する
 */
export interface GithubClient {
    executeGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T>;
    executeGraphQLPaged<TResponse, TNode>(params: {
        query: string;
        variables: Record<string, unknown>;
        extractNodes: (response: TResponse) => TNode[];
        extractPageInfo: (response: TResponse) => { hasNextPage: boolean; endCursor: string | null };
    }): Promise<TNode[]>;
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
            // スコープ不足エラーを検知して分かりやすい案内を出す
            if (msg.includes('required scopes') || msg.includes('read:project')) {
                throw new Error(
                    'gh CLI のトークンに read:project スコープが不足しています。\n' +
                    '次のコマンドでスコープを追加してください:\n' +
                    '  gh auth refresh --scopes read:project'
                );
            }
            // GraphQL 部分エラー（org/user の片方が null など）の場合、
            // execSync は非ゼロ終了するが stdout に有効な data が含まれる。
            // stdout が取れた場合はパースを試みてデータを優先する。
            const execError = err as { stdout?: string };
            if (execError.stdout) {
                output = execError.stdout;
            } else {
                throw new Error(`gh CLI 実行エラー: ${msg}`);
            }
        }

        const parsed = JSON.parse(output) as GraphQLResponse<T>;

        // data が存在する場合は部分エラーでも継続（org/user の片方が null になるケース）
        if (!parsed.data && parsed.errors && parsed.errors.length > 0) {
            const messages = parsed.errors.map((e) => e.message).join(', ');
            throw new Error(`GraphQL エラー: ${messages}`);
        }

        return parsed.data;
    }

    async executeGraphQLPaged<TResponse, TNode>(params: {
        query: string;
        variables: Record<string, unknown>;
        extractNodes: (response: TResponse) => TNode[];
        extractPageInfo: (response: TResponse) => { hasNextPage: boolean; endCursor: string | null };
    }): Promise<TNode[]> {
        const allNodes: TNode[] = [];
        let cursor: string | null = null;

        do {
            const response = await this.executeGraphQL<TResponse>(params.query, {
                ...params.variables,
                after: cursor,
            });

            allNodes.push(...params.extractNodes(response));

            const pageInfo = params.extractPageInfo(response);
            cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
        } while (cursor !== null);

        return allNodes;
    }
}

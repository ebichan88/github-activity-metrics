import type { GithubClient } from '../github/client.js';
import {
    buildPrAuthorSearchQuery,
    buildPrReviewerSearchQuery,
    GET_COMMITS_QUERY,
    SEARCH_PULL_REQUESTS_QUERY,
    SEARCH_REVIEWED_PRS_QUERY,
} from '../github/queries.js';
import { aggregate, type RawCommit, type RawPr } from './aggregate.js';
import type { CollectRequest } from './collectRequest.js';
import type { Dataset, Warning } from './schema.js';
import {
    createGraphqlErrorWarning,
    createRepoAccessWarning,
    createWarning,
    WarningCode,
} from './warning.js';

// -----------------------------------------------------------------
// GraphQL レスポンス型定義
// -----------------------------------------------------------------

interface PrSearchResult {
    search: {
        nodes: Array<{
            number?: number;
            state?: string;
            createdAt?: string;
            mergedAt?: string | null;
            closedAt?: string | null;
            body?: string | null;
            additions?: number;
            deletions?: number;
            repository?: {
                owner: { login: string };
                name: string;
                visibility?: string;
            };
            reviews?: {
                nodes: Array<{
                    author: { login: string } | null;
                    comments: { totalCount: number };
                }>;
            };
        }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
}

interface CommitHistoryResult {
    repository: {
        defaultBranchRef: {
            target: {
                history?: {
                    nodes: Array<{
                        oid: string;
                        committedDate: string;
                        additions: number;
                        deletions: number;
                        author: { user: { login: string } | null } | null;
                    }>;
                    pageInfo: { hasNextPage: boolean; endCursor: string | null };
                };
            };
        } | null;
    } | null;
}

// -----------------------------------------------------------------
// collectActivity ユースケース
// -----------------------------------------------------------------

export interface CollectActivityInput {
    client: GithubClient;
    request: CollectRequest;
}

export interface CollectActivityOutput {
    dataset: Dataset;
}

/**
 * GitHub データを収集し Dataset を返す収集ユースケース
 * 外部 I/O は GithubClient に委譲することでテスト可能にする
 */
export async function collectActivity(
    input: CollectActivityInput
): Promise<CollectActivityOutput> {
    const { client, request } = input;
    const { period, repositories, logins } = request;

    const warnings: Warning[] = [];
    const rawPrs: RawPr[] = [];
    const rawCommits: RawCommit[] = [];
    // login -> reviewedPrCount, reviewCommentCount
    const reviewMap = new Map<
        string,
        { reviewedPrCount: number; reviewCommentCount: number }
    >();

    for (const login of logins) {
        reviewMap.set(login, { reviewedPrCount: 0, reviewCommentCount: 0 });
    }

    // --- PR 収集（担当者 × リポジトリ）---
    for (const repo of repositories) {
        const repoFullName = `${repo.owner}/${repo.name}`;

        for (const login of logins) {
            try {
                const prs = await fetchAllPrs(client, {
                    login,
                    repoFullName,
                    from: period.from,
                    to: period.to,
                });
                rawPrs.push(...prs);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('access')) {
                    warnings.push(createRepoAccessWarning(repoFullName));
                } else {
                    warnings.push(
                        createGraphqlErrorWarning(`${repoFullName} の PR 取得中にエラーが発生しました: ${msg}`, {
                            repository: repoFullName,
                            contributor: login,
                        })
                    );
                }
            }
        }

        // --- コミット収集（リポジトリ単位）---
        try {
            const commits = await fetchAllCommits(client, {
                owner: repo.owner,
                repo: repo.name,
                since: `${period.from}T00:00:00Z`,
                until: `${period.to}T23:59:59Z`,
            });
            // 対象 login のコミットのみ追加
            for (const c of commits) {
                if (logins.includes(c.login)) {
                    rawCommits.push({ ...c, repoFullName });
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            warnings.push(
                createWarning(WarningCode.PARTIAL_DATA, `${repoFullName} のコミット取得でエラーが発生しました: ${msg}`, {
                    repository: repoFullName,
                })
            );
        }
    }

    // --- レビュー収集（担当者 × リポジトリ）---
    for (const repo of repositories) {
        const repoFullName = `${repo.owner}/${repo.name}`;

        for (const login of logins) {
            try {
                const reviewedPrs = await fetchReviewedPrs(client, {
                    login,
                    repoFullName,
                    from: period.from,
                    to: period.to,
                });

                const entry = reviewMap.get(login)!;
                for (const pr of reviewedPrs) {
                    entry.reviewedPrCount += 1;
                    entry.reviewCommentCount += pr.commentCount;
                }
            } catch {
                // レビュー取得失敗は warning を追加するが集計は継続
                warnings.push(
                    createWarning(
                        WarningCode.PARTIAL_DATA,
                        `${repoFullName} の ${login} のレビューデータ取得に失敗しました`,
                        { repository: repoFullName, contributor: login }
                    )
                );
            }
        }
    }

    // --- 集計 ---
    const contributors = aggregate({ rawPrs, rawCommits, logins });

    // レビュー指標を注入
    for (const contributor of contributors) {
        const review = reviewMap.get(contributor.login);
        if (review) {
            contributor.reviews = review;
            // レビュー指標が変わったので派生指標を再計算
            const { createdCount } = contributor.prs;
            const { reviewedPrCount, reviewCommentCount } = review;
            contributor.derived.reviewRate =
                createdCount === 0 ? null : reviewedPrCount / createdCount;
            contributor.derived.averageReviewComments =
                reviewedPrCount === 0 ? null : reviewCommentCount / reviewedPrCount;
        }
    }

    const dataset: Dataset = {
        datasetVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        period,
        repositories: repositories.map((r) => ({ owner: r.owner, name: r.name })),
        contributors,
        warnings,
    };

    return { dataset };
}

// -----------------------------------------------------------------
// 内部ヘルパー（ページング）
// -----------------------------------------------------------------

async function fetchAllPrs(
    client: GithubClient,
    params: { login: string; repoFullName: string; from: string; to: string }
): Promise<RawPr[]> {
    const results: RawPr[] = [];
    let cursor: string | null = null;

    do {
        const searchQuery = buildPrAuthorSearchQuery(params);
        const data: PrSearchResult = await client.executeGraphQL<PrSearchResult>(
            SEARCH_PULL_REQUESTS_QUERY,
            { searchQuery, cursor }
        );

        for (const node of data.search.nodes) {
            if (node.number === undefined) continue;
            results.push({
                login: params.login,
                number: node.number,
                state: (node.state ?? 'CLOSED') as 'OPEN' | 'CLOSED' | 'MERGED',
                createdAt: node.createdAt ?? '',
                mergedAt: node.mergedAt ?? null,
                closedAt: node.closedAt ?? null,
                body: node.body ?? null,
                additions: node.additions ?? 0,
                deletions: node.deletions ?? 0,
                repoFullName: params.repoFullName,
            });
        }

        cursor = data.search.pageInfo.hasNextPage ? data.search.pageInfo.endCursor : null;
    } while (cursor !== null);

    return results;
}

interface ReviewedPrEntry {
    number: number;
    commentCount: number;
}

async function fetchReviewedPrs(
    client: GithubClient,
    params: { login: string; repoFullName: string; from: string; to: string }
): Promise<ReviewedPrEntry[]> {
    const results: ReviewedPrEntry[] = [];
    let cursor: string | null = null;

    do {
        const searchQuery = buildPrReviewerSearchQuery(params);
        const data: PrSearchResult = await client.executeGraphQL<PrSearchResult>(
            SEARCH_REVIEWED_PRS_QUERY,
            { searchQuery, cursor }
        );

        for (const node of data.search.nodes) {
            if (node.number === undefined) continue;
            type ReviewNode = NonNullable<typeof node.reviews>['nodes'][number];
            const commentCount =
                node.reviews?.nodes
                    .filter((r: ReviewNode) => r.author?.login === params.login)
                    .reduce((sum: number, r: ReviewNode) => sum + r.comments.totalCount, 0) ?? 0;
            results.push({ number: node.number, commentCount });
        }

        cursor = data.search.pageInfo.hasNextPage ? data.search.pageInfo.endCursor : null;
    } while (cursor !== null);

    return results;
}

interface RawCommitEntry {
    login: string;
    oid: string;
    committedDate: string;
    additions: number;
    deletions: number;
}

async function fetchAllCommits(
    client: GithubClient,
    params: { owner: string; repo: string; since: string; until: string }
): Promise<RawCommitEntry[]> {
    const results: RawCommitEntry[] = [];
    let cursor: string | null = null;

    do {
        const data: CommitHistoryResult = await client.executeGraphQL<CommitHistoryResult>(
            GET_COMMITS_QUERY,
            { ...params, cursor }
        );

        const history: CommitHistoryResult['repository'] extends null | undefined ? never :
            NonNullable<CommitHistoryResult['repository']>['defaultBranchRef'] extends null | undefined ? never :
            NonNullable<NonNullable<CommitHistoryResult['repository']>['defaultBranchRef']>['target']['history'] =
            data.repository?.defaultBranchRef?.target?.history;

        if (!history) break;

        for (const node of history.nodes) {
            const login = node.author?.user?.login;
            if (!login) continue;
            results.push({
                login,
                oid: node.oid,
                committedDate: node.committedDate,
                additions: node.additions,
                deletions: node.deletions,
            });
        }

        cursor = history.pageInfo.hasNextPage ? history.pageInfo.endCursor : null;
    } while (cursor !== null);

    return results;
}

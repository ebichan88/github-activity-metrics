import { extractRelatedIssues } from './extractRelatedIssues.js';
import type { ContributorMetrics } from './schema.js';

/** aggregate の入力となる生 PR データ */
export interface RawPr {
    login: string;
    number: number;
    state: 'OPEN' | 'CLOSED' | 'MERGED';
    createdAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    body: string | null;
    additions: number;
    deletions: number;
    repoFullName: string;
}

/** aggregate の入力となる生コミットデータ */
export interface RawCommit {
    login: string;
    oid: string;
    committedDate: string;
    additions: number;
    deletions: number;
    repoFullName: string;
}

/** aggregate の入力型 */
export interface AggregateInput {
    rawPrs: RawPr[];
    rawCommits: RawCommit[];
    /** 集計対象の login 一覧（0件の担当者もエントリが作られる） */
    logins: string[];
}

/**
 * 生データから担当者単位の ContributorMetrics を計算する pure 関数
 */
export function aggregate(input: AggregateInput): ContributorMetrics[] {
    const { rawPrs, rawCommits, logins } = input;

    return logins.map((login) => {
        const myPrs = rawPrs.filter((pr) => pr.login === login);
        const myCommits = rawCommits.filter((c) => c.login === login);

        // PR 指標
        const createdCount = myPrs.length;
        const mergedCount = myPrs.filter((pr) => pr.state === 'MERGED').length;
        const closedCount = myPrs.filter(
            (pr) => pr.state === 'CLOSED'
        ).length;

        const relatedIssues = myPrs.flatMap((pr) =>
            extractRelatedIssues({
                prNumber: pr.number,
                repository: pr.repoFullName,
                body: pr.body,
            })
        );

        const createdPrNumbers = myPrs.map((pr) => pr.number);
        const mergedPrNumbers = myPrs
            .filter((pr) => pr.state === 'MERGED')
            .map((pr) => pr.number);

        // コミット指標（コミット履歴から計上）
        const commitCount = myCommits.length;
        const additions = myCommits.reduce((sum, c) => sum + c.additions, 0);
        const deletions = myCommits.reduce((sum, c) => sum + c.deletions, 0);

        // レビュー指標（集計時はゼロで初期化、後段で注入可能）
        const reviewedPrCount = 0;
        const reviewCommentCount = 0;

        // 派生指標（ゼロ除算時は null）
        // PR サイズは PR レベルの additions/deletions を使用
        const totalPrSize = myPrs.reduce(
            (sum, pr) => sum + pr.additions + pr.deletions,
            0
        );
        const reviewRate =
            createdCount === 0 ? null : reviewedPrCount / createdCount;
        const averagePrSize =
            createdCount === 0 ? null : totalPrSize / createdCount;
        const averageReviewComments =
            reviewedPrCount === 0 ? null : reviewCommentCount / reviewedPrCount;
        const mergeRate =
            createdCount === 0 ? null : mergedCount / createdCount;

        return {
            login,
            prs: { createdCount, closedCount, mergedCount, relatedIssues },
            commits: { commitCount, additions, deletions },
            reviews: { reviewedPrCount, reviewCommentCount },
            derived: { reviewRate, averagePrSize, averageReviewComments, mergeRate },
            prDetails: {
                createdPrNumbers,
                mergedPrNumbers,
                reviewedPrNumbers: [],
            },
        };
    });
}

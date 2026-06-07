import { describe, expect, it } from 'vitest';
import { aggregate } from '../../src/domain/aggregate.js';
import type { ContributorMetrics } from '../../src/domain/schema.js';

/** テスト用の空 ContributorMetrics を生成するヘルパー */
function emptyContributor(login: string): ContributorMetrics {
    return {
        login,
        prs: { createdCount: 0, closedCount: 0, mergedCount: 0, relatedIssues: [] },
        commits: { commitCount: 0, additions: 0, deletions: 0 },
        reviews: { reviewedPrCount: 0, reviewCommentCount: 0 },
        derived: {
            reviewRate: null,
            averagePrSize: null,
            averageReviewComments: null,
            mergeRate: null,
        },
        prDetails: {
            createdPrNumbers: [],
            mergedPrNumbers: [],
            reviewedPrNumbers: [],
        },
    };
}

describe('aggregate', () => {
    describe('基本集計', () => {
        it('空の入力では空の contributors 配列を返す', () => {
            const result = aggregate({ rawPrs: [], rawCommits: [], logins: [] });
            expect(result).toEqual([]);
        });

        it('指定した login の集計結果を返す', () => {
            const result = aggregate({
                rawPrs: [
                    {
                        login: 'user1',
                        number: 1,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 100,
                        deletions: 20,
                        repoFullName: 'org/repo',
                    },
                ],
                rawCommits: [],
                logins: ['user1'],
            });

            expect(result).toHaveLength(1);
            const c = result[0]!;
            expect(c.login).toBe('user1');
            expect(c.prs.createdCount).toBe(1);
            expect(c.prs.mergedCount).toBe(1);
            expect(c.prs.closedCount).toBe(0);
            expect(c.prDetails.createdPrNumbers).toEqual([1]);
            expect(c.prDetails.mergedPrNumbers).toEqual([1]);
            expect(c.prDetails.reviewedPrNumbers).toEqual([]);
        });

        it('複数リポジトリの PR を合算する', () => {
            const result = aggregate({
                rawPrs: [
                    {
                        login: 'user1',
                        number: 1,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 50,
                        deletions: 10,
                        repoFullName: 'org/repo-a',
                    },
                    {
                        login: 'user1',
                        number: 2,
                        state: 'CLOSED',
                        createdAt: '2026-05-15T00:00:00Z',
                        mergedAt: null,
                        closedAt: '2026-05-16T00:00:00Z',
                        body: '',
                        additions: 30,
                        deletions: 5,
                        repoFullName: 'org/repo-b',
                    },
                ],
                rawCommits: [],
                logins: ['user1'],
            });

            const c = result[0]!;
            expect(c.prs.createdCount).toBe(2);
            expect(c.prs.mergedCount).toBe(1);
            expect(c.prs.closedCount).toBe(1);
            expect(c.commits.additions).toBe(0); // コミット未指定
        });
    });

    describe('コミット集計', () => {
        it('担当者のコミット数・変更量を集計する', () => {
            const result = aggregate({
                rawPrs: [],
                rawCommits: [
                    {
                        login: 'user1',
                        oid: 'abc1',
                        committedDate: '2026-05-10T00:00:00Z',
                        additions: 200,
                        deletions: 50,
                        repoFullName: 'org/repo',
                    },
                    {
                        login: 'user1',
                        oid: 'abc2',
                        committedDate: '2026-05-15T00:00:00Z',
                        additions: 100,
                        deletions: 30,
                        repoFullName: 'org/repo',
                    },
                ],
                logins: ['user1'],
            });

            const c = result[0]!;
            expect(c.commits.commitCount).toBe(2);
            expect(c.commits.additions).toBe(300);
            expect(c.commits.deletions).toBe(80);
        });
    });

    describe('派生指標', () => {
        it('PR数が0の場合、reviewRate / averagePrSize / mergeRate が null を返す', () => {
            const result = aggregate({
                rawPrs: [],
                rawCommits: [],
                logins: ['user1'],
            });

            const c = result[0]!;
            expect(c.derived.reviewRate).toBeNull();
            expect(c.derived.averagePrSize).toBeNull();
            expect(c.derived.mergeRate).toBeNull();
        });

        it('mergeRate を正しく計算する', () => {
            const result = aggregate({
                rawPrs: [
                    {
                        login: 'user1',
                        number: 1,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 10,
                        deletions: 5,
                        repoFullName: 'org/repo',
                    },
                    {
                        login: 'user1',
                        number: 2,
                        state: 'MERGED',
                        createdAt: '2026-05-12T00:00:00Z',
                        mergedAt: '2026-05-13T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 20,
                        deletions: 10,
                        repoFullName: 'org/repo',
                    },
                    {
                        login: 'user1',
                        number: 3,
                        state: 'CLOSED',
                        createdAt: '2026-05-14T00:00:00Z',
                        mergedAt: null,
                        closedAt: '2026-05-15T00:00:00Z',
                        body: '',
                        additions: 5,
                        deletions: 2,
                        repoFullName: 'org/repo',
                    },
                ],
                rawCommits: [],
                logins: ['user1'],
            });

            const c = result[0]!;
            // 2 merged / 3 created = 0.666...
            expect(c.derived.mergeRate).toBeCloseTo(2 / 3);
        });

        it('averagePrSize を正しく計算する', () => {
            const result = aggregate({
                rawPrs: [
                    {
                        login: 'user1',
                        number: 1,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 100,
                        deletions: 50,
                        repoFullName: 'org/repo',
                    },
                    {
                        login: 'user1',
                        number: 2,
                        state: 'MERGED',
                        createdAt: '2026-05-12T00:00:00Z',
                        mergedAt: '2026-05-13T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 50,
                        deletions: 30,
                        repoFullName: 'org/repo',
                    },
                ],
                rawCommits: [],
                logins: ['user1'],
            });

            const c = result[0]!;
            // (100+50 + 50+30) / 2 = 230/2 = 115
            expect(c.derived.averagePrSize).toBe(115);
        });
    });

    describe('複数担当者', () => {
        it('担当者ごとに分離した結果を返す', () => {
            const result = aggregate({
                rawPrs: [
                    {
                        login: 'user1',
                        number: 1,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 10,
                        deletions: 5,
                        repoFullName: 'org/repo',
                    },
                    {
                        login: 'user2',
                        number: 2,
                        state: 'MERGED',
                        createdAt: '2026-05-10T00:00:00Z',
                        mergedAt: '2026-05-11T00:00:00Z',
                        closedAt: null,
                        body: '',
                        additions: 20,
                        deletions: 10,
                        repoFullName: 'org/repo',
                    },
                ],
                rawCommits: [],
                logins: ['user1', 'user2'],
            });

            expect(result).toHaveLength(2);
            const u1 = result.find((c) => c.login === 'user1')!;
            const u2 = result.find((c) => c.login === 'user2')!;
            expect(u1.prs.createdCount).toBe(1);
            expect(u2.prs.createdCount).toBe(1);
        });
    });
});

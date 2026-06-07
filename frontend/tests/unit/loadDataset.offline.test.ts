import { describe, expect, it } from 'vitest';
import { toDashboardViewModel } from '../../src/services/toDashboardViewModel.js';
import type { Dataset } from '../../src/types/dataset.js';

/** テスト用の最小 Dataset */
function makeDataset(overrides: Partial<Dataset> = {}): Dataset {
    return {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [{ owner: 'org', name: 'repo' }],
        contributors: [],
        warnings: [],
        ...overrides,
    };
}

describe('loadDataset オフライン読込テスト', () => {
    describe('toDashboardViewModel', () => {
        it('空の contributors で KPI がすべて0になる', () => {
            const vm = toDashboardViewModel(makeDataset());
            expect(vm.kpi.totalPrCreated).toBe(0);
            expect(vm.kpi.contributorCount).toBe(0);
            expect(vm.contributors).toHaveLength(0);
        });

        it('contributors の KPI を正しく合算する', () => {
            const dataset = makeDataset({
                contributors: [
                    {
                        login: 'user1',
                        prs: { createdCount: 5, closedCount: 1, mergedCount: 4, relatedIssues: [] },
                        commits: { commitCount: 10, additions: 200, deletions: 50 },
                        reviews: { reviewedPrCount: 3, reviewCommentCount: 6 },
                        derived: { reviewRate: 0.6, averagePrSize: 50.0, averageReviewComments: 2.0, mergeRate: 0.8 },
                    },
                    {
                        login: 'user2',
                        prs: { createdCount: 2, closedCount: 0, mergedCount: 2, relatedIssues: [] },
                        commits: { commitCount: 5, additions: 100, deletions: 20 },
                        reviews: { reviewedPrCount: 1, reviewCommentCount: 2 },
                        derived: { reviewRate: 0.5, averagePrSize: 60.0, averageReviewComments: 2.0, mergeRate: 1.0 },
                    },
                ],
            });

            const vm = toDashboardViewModel(dataset);
            expect(vm.kpi.totalPrCreated).toBe(7);
            expect(vm.kpi.totalCommits).toBe(15);
            expect(vm.kpi.totalReviews).toBe(4);
            expect(vm.kpi.totalAdditions).toBe(300);
            expect(vm.kpi.contributorCount).toBe(2);
        });

        it('derived が null の場合 mergeRate / reviewRate が "-" になる', () => {
            const dataset = makeDataset({
                contributors: [
                    {
                        login: 'user1',
                        prs: { createdCount: 0, closedCount: 0, mergedCount: 0, relatedIssues: [] },
                        commits: { commitCount: 0, additions: 0, deletions: 0 },
                        reviews: { reviewedPrCount: 0, reviewCommentCount: 0 },
                        derived: { reviewRate: null, averagePrSize: null, averageReviewComments: null, mergeRate: null },
                    },
                ],
            });

            const vm = toDashboardViewModel(dataset);
            expect(vm.contributors[0]!.mergeRate).toBe('-');
            expect(vm.contributors[0]!.reviewRate).toBe('-');
        });

        it('warnings があると hasWarnings が true になる', () => {
            const dataset = makeDataset({
                warnings: [{ code: 'PARTIAL_DATA', message: 'テスト警告' }],
            });

            const vm = toDashboardViewModel(dataset);
            expect(vm.hasWarnings).toBe(true);
            expect(vm.warningCount).toBe(1);
        });

        it('issueMetrics が欠損していてもオフライン読込できる', () => {
            const dataset = makeDataset({
                datasetVersion: '1.0.0',
                contributors: [
                    {
                        login: 'user1',
                        prs: { createdCount: 1, closedCount: 0, mergedCount: 1, relatedIssues: [] },
                        commits: { commitCount: 1, additions: 10, deletions: 2 },
                        reviews: { reviewedPrCount: 0, reviewCommentCount: 0 },
                        derived: { reviewRate: 0, averagePrSize: 12.0, averageReviewComments: null, mergeRate: 1.0 },
                    },
                ],
            });

            const vm = toDashboardViewModel(dataset);
            expect(vm.issueMetrics).toBeNull();
            expect(vm.contributors).toHaveLength(1);
            expect(vm.kpi.totalPrCreated).toBe(1);
        });
    });
});

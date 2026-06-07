import { describe, expect, it } from 'vitest';
import { useContributorFilters } from '../../src/composables/useContributorFilters.js';
import type { ContributorRow } from '../../src/services/toDashboardViewModel.js';

function makeRow(login: string, prCreated: number = 3): ContributorRow {
    return {
        login,
        prCreated,
        prMerged: prCreated,
        mergeRate: '100.0%',
        commits: 10,
        additions: 100,
        deletions: 30,
        reviewedPrs: 2,
        reviewRate: '66.7%',
        relatedIssueCount: 1,
        prDetails: {
            createdPrNumbers: [],
            mergedPrNumbers: [],
            reviewedPrNumbers: [],
        },
    };
}

describe('useContributorFilters', () => {
    describe('ソート', () => {
        it('PR作成数の降順にソートできる', () => {
            const rows: ContributorRow[] = [
                makeRow('user-c', 1),
                makeRow('user-a', 5),
                makeRow('user-b', 3),
            ];

            const { sortedAndFiltered, setSortKey, setSortOrder } = useContributorFilters(rows);
            setSortKey('prCreated');
            setSortOrder('desc');

            expect(sortedAndFiltered.value.map((r) => r.login)).toEqual([
                'user-a',
                'user-b',
                'user-c',
            ]);
        });

        it('ログイン名の昇順にソートできる', () => {
            const rows: ContributorRow[] = [
                makeRow('charlie'),
                makeRow('alice'),
                makeRow('bob'),
            ];

            const { sortedAndFiltered, setSortKey, setSortOrder } = useContributorFilters(rows);
            setSortKey('login');
            setSortOrder('asc');

            expect(sortedAndFiltered.value.map((r) => r.login)).toEqual([
                'alice',
                'bob',
                'charlie',
            ]);
        });
    });

    describe('フィルタ', () => {
        it('ログイン名でフィルタリングできる', () => {
            const rows: ContributorRow[] = [
                makeRow('alice'),
                makeRow('bob'),
                makeRow('carol'),
            ];

            const { sortedAndFiltered, setSearchQuery } = useContributorFilters(rows);
            setSearchQuery('bo');

            expect(sortedAndFiltered.value).toHaveLength(1);
            expect(sortedAndFiltered.value[0]!.login).toBe('bob');
        });

        it('フィルタが空のとき全員表示', () => {
            const rows: ContributorRow[] = [
                makeRow('alice'),
                makeRow('bob'),
            ];

            const { sortedAndFiltered, setSearchQuery } = useContributorFilters(rows);
            setSearchQuery('');

            expect(sortedAndFiltered.value).toHaveLength(2);
        });
    });
});

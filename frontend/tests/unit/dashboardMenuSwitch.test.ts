import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createVuetify } from 'vuetify';

vi.mock('../../src/composables/useDatasetLoader.js', () => ({
    useDatasetLoader: () => ({
        viewModel: ref({
            period: { from: '2025-01-01', to: '2025-05-31' },
            generatedAt: '2026-06-07T00:00:00Z',
            kpi: {
                totalPrCreated: 1,
                totalPrMerged: 1,
                totalCommits: 1,
                totalReviews: 1,
                totalAdditions: 10,
                totalDeletions: 5,
                contributorCount: 1,
            },
            contributors: [],
            issueMetrics: {
                projectId: 'ebichan88#3',
                rows: [
                    {
                        login: 'alice',
                        displayLogin: 'alice',
                        doneCount: 1,
                        estimateTotal: 3,
                        estimateMissingCount: 0,
                        doneIssueNumbers: [10],
                        isUnassigned: false,
                    },
                ],
            },
            hasWarnings: false,
            warningCount: 0,
        }),
        isLoading: ref(false),
        error: ref(null),
        onFileSelected: vi.fn(),
        reset: vi.fn(),
    }),
}));

import DashboardPage from '../../src/pages/DashboardPage.vue';

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
    },
});

describe('DashboardPage メニュー切替', () => {
    it('PR実績とIssue実績を切り替えられる', async () => {
        const wrapper = mount(DashboardPage, {
            global: {
                plugins: [vuetify],
                stubs: {
                    ContributorTable: true,
                    ErrorStateBanner: true,
                    PrDetailsAccordion: true,
                    KpiCards: {
                        template: '<div data-testid="kpi-cards">kpi</div>',
                    },
                    IssueMetricsTable: {
                        template: '<div data-testid="issue-table">issue</div>',
                    },
                },
            },
        });

        expect(wrapper.find('[data-testid="kpi-cards"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="issue-table"]').exists()).toBe(false);

        await wrapper.get('[data-testid="menu-issue"]').trigger('click');
        expect(wrapper.find('[data-testid="kpi-cards"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="issue-table"]').exists()).toBe(true);

        await wrapper.get('[data-testid="menu-pr"]').trigger('click');
        expect(wrapper.find('[data-testid="kpi-cards"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="issue-table"]').exists()).toBe(false);
    });
});

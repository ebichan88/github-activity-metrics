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
                totalPrCreated: 0,
                totalPrMerged: 0,
                totalCommits: 0,
                totalReviews: 0,
                totalAdditions: 0,
                totalDeletions: 0,
                contributorCount: 0,
            },
            contributors: [],
            issueMetrics: {
                projectId: 'ebichan88#3',
                rows: [],
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

describe('DashboardPage 0件表示回帰', () => {
    it('PR実績0件でも画面が継続表示される', () => {
        const wrapper = mount(DashboardPage, {
            global: {
                plugins: [vuetify],
                stubs: {
                    ErrorStateBanner: true,
                    ContributorTable: true,
                    PrDetailsAccordion: true,
                },
            },
        });

        expect(wrapper.text()).toContain('PR実績');
        expect(wrapper.text()).toContain('JSON読込');
    });

    it('Issue実績0件でも画面が継続表示される', async () => {
        const wrapper = mount(DashboardPage, {
            global: {
                plugins: [vuetify],
                stubs: {
                    ErrorStateBanner: true,
                    ContributorTable: true,
                    PrDetailsAccordion: true,
                },
            },
        });

        await wrapper.get('[data-testid="menu-issue"]').trigger('click');

        expect(wrapper.text()).toContain('Issue実績');
        expect(wrapper.text()).toContain('期間内に Done issue はありません');
    });
});

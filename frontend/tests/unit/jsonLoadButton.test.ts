import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createVuetify } from 'vuetify';

const onFileSelected = vi.fn<() => Promise<void>>();
const reset = vi.fn();

vi.mock('../../src/composables/useDatasetLoader.js', () => ({
    useDatasetLoader: () => ({
        viewModel: ref(null),
        isLoading: ref(false),
        error: ref(null),
        onFileSelected,
        reset,
    }),
}));

import DashboardPage from '../../src/pages/DashboardPage.vue';

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
    },
});

describe('DashboardPage JSON読込ボタン', () => {
    beforeEach(() => {
        onFileSelected.mockReset();
        onFileSelected.mockResolvedValue(undefined);
        reset.mockReset();
    });

    it('JSON読込ボタンを表示し、ファイル選択開始に使える', async () => {
        const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => { });
        const wrapper = mount(DashboardPage, {
            global: {
                plugins: [vuetify],
                stubs: {
                    ErrorStateBanner: true,
                    KpiCards: true,
                    ContributorTable: true,
                    PrDetailsAccordion: true,
                    IssueMetricsTable: true,
                },
            },
        });

        expect(wrapper.text()).toContain('JSON読込');
        await wrapper.get('[data-testid="json-load-button"]').trigger('click');
        expect(clickSpy).toHaveBeenCalledTimes(1);

        const input = wrapper.get('[data-testid="json-file-input"]');
        const file = new File(['{}'], 'activity.json', { type: 'application/json' });
        Object.defineProperty(input.element, 'files', {
            configurable: true,
            value: [file],
        });

        await input.trigger('change');
        expect(onFileSelected).toHaveBeenCalledWith(file);

        clickSpy.mockRestore();
    });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PrDetailsAccordion from '../../src/components/PrDetailsAccordion.vue';

describe('PrDetailsAccordion', () => {
    it('PR番号一覧をカテゴリごとに表示できる', () => {
        const wrapper = mount(PrDetailsAccordion, {
            props: {
                details: {
                    createdPrNumbers: [101, 102],
                    mergedPrNumbers: [101],
                    reviewedPrNumbers: [201],
                },
                initialOpen: 'merged',
            },
        });

        const text = wrapper.text();
        expect(text).toContain('作成したPR (2)');
        expect(text).toContain('マージしたPR (1)');
        expect(text).toContain('レビューしたPR (1)');
        expect(text).toContain('#101');
        expect(text).toContain('#102');
        expect(text).toContain('#201');
    });

    it('対象PRがない場合に案内文を表示する', () => {
        const wrapper = mount(PrDetailsAccordion, {
            props: {
                details: {
                    createdPrNumbers: [],
                    mergedPrNumbers: [],
                    reviewedPrNumbers: [],
                },
            },
        });

        expect(wrapper.text()).toContain('対象PRはありません');
    });
});

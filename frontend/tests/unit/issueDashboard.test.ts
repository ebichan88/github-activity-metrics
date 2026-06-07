import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import IssueMetricsTable from '../../src/components/IssueMetricsTable.vue';

describe('IssueMetricsTable', () => {
    it('担当者別の Done 件数と Estimate 合計を表示できる', () => {
        const wrapper = mount(IssueMetricsTable, {
            props: {
                rows: [
                    {
                        login: 'alice',
                        displayLogin: 'alice',
                        doneCount: 3,
                        estimateTotal: 8,
                        estimateMissingCount: 1,
                        doneIssueNumbers: [101, 102, 103],
                        isUnassigned: false,
                    },
                    {
                        login: 'unassigned',
                        displayLogin: '未割り当て',
                        doneCount: 1,
                        estimateTotal: 0,
                        estimateMissingCount: 1,
                        doneIssueNumbers: [110],
                        isUnassigned: true,
                    },
                ]
            },
        });

        const text = wrapper.text();
        expect(text).toContain('Issue実績');
        expect(text).toContain('alice');
        expect(text).toContain('3');
        expect(text).toContain('8');
        expect(text).toContain('#101, #102, #103');
        expect(text).toContain('未割り当て');
        expect(text).toContain('#110');
    });
});

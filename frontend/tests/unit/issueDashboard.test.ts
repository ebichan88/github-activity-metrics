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
                        doneIssues: [
                            { number: 101, title: 'Issue 101', url: 'https://github.com/org/repo/issues/101' },
                            { number: 102, title: 'Issue 102', url: 'https://github.com/org/repo/issues/102' },
                            { number: 103, title: 'Issue 103', url: 'https://github.com/org/repo/issues/103' },
                        ],
                        isUnassigned: false,
                    },
                    {
                        login: 'unassigned',
                        displayLogin: '未割り当て',
                        doneCount: 1,
                        estimateTotal: 0,
                        estimateMissingCount: 1,
                        doneIssues: [
                            { number: 110, title: 'Issue 110', url: 'https://github.com/org/repo/issues/110' },
                        ],
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
        expect(text).toContain('詳細');
        expect(text).toContain('未割り当て');
    });

    it('詳細ボタンを押すとモーダルが開き issue リストが表示される', async () => {
        const wrapper = mount(IssueMetricsTable, {
            props: {
                rows: [
                    {
                        login: 'alice',
                        displayLogin: 'alice',
                        doneCount: 2,
                        estimateTotal: 5,
                        estimateMissingCount: 0,
                        doneIssues: [
                            { number: 10, title: 'Fix bug', url: 'https://github.com/org/repo/issues/10' },
                            { number: 11, title: 'Add feature', url: 'https://github.com/org/repo/issues/11' },
                        ],
                        isUnassigned: false,
                    },
                ]
            },
        });

        await wrapper.find('.detail-btn').trigger('click');

        const modalText = wrapper.text();
        expect(modalText).toContain('#10: Fix bug');
        expect(modalText).toContain('#11: Add feature');

        const links = wrapper.findAll('.issue-link');
        expect(links[0]?.attributes('href')).toBe('https://github.com/org/repo/issues/10');
        expect(links[1]?.attributes('href')).toBe('https://github.com/org/repo/issues/11');
    });

    it('doneIssues が空の場合は詳細ボタンではなく - を表示する', () => {
        const wrapper = mount(IssueMetricsTable, {
            props: {
                rows: [
                    {
                        login: 'bob',
                        displayLogin: 'bob',
                        doneCount: 0,
                        estimateTotal: 0,
                        estimateMissingCount: 0,
                        doneIssues: [],
                        isUnassigned: false,
                    },
                ]
            },
        });

        expect(wrapper.find('.detail-btn').exists()).toBe(false);
        expect(wrapper.text()).toContain('-');
    });
});

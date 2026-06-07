import { describe, expect, it } from 'vitest';
import {
    aggregateIssueMetrics,
    extractProjectIssueEvents,
    type ProjectIssueItem,
} from '../../src/domain/issueMetrics.js';

function createItem(input: {
    issueNumber: number;
    assignees?: string[];
    status?: string;
    estimate?: number | null;
    doneDate?: string | null;
    closedAt?: string | null;
    updatedAt?: string;
}): ProjectIssueItem {
    return {
        id: `item-${input.issueNumber}`,
        updatedAt: input.updatedAt ?? '2026-05-10T09:00:00Z',
        content: {
            number: input.issueNumber,
            title: `Issue ${input.issueNumber}`,
            closedAt: input.closedAt ?? null,
            assignees: {
                nodes: (input.assignees ?? []).map((login) => ({ login })),
            },
        },
        fieldValues: {
            nodes: [
                {
                    __typename: 'ProjectV2ItemFieldSingleSelectValue',
                    name: input.status ?? 'Done',
                    field: {
                        name: 'Status',
                    },
                },
                ...(input.estimate === undefined
                    ? []
                    : [
                        {
                            __typename: 'ProjectV2ItemFieldNumberValue' as const,
                            number: input.estimate,
                            field: {
                                name: 'Estimate',
                            },
                        },
                    ]),
                ...(input.doneDate === undefined
                    ? []
                    : [
                        {
                            __typename: 'ProjectV2ItemFieldDateValue' as const,
                            date: input.doneDate,
                            field: {
                                name: 'Done Date',
                            },
                        },
                    ]),
            ],
        },
    };
}

describe('issueMetrics', () => {
    it('Project item から Done issue イベントを抽出できる', () => {
        const events = extractProjectIssueEvents([
            createItem({ issueNumber: 10, assignees: ['alice'], estimate: 3, doneDate: '2026-05-10' }),
            createItem({ issueNumber: 11, assignees: ['alice', 'bob'], estimate: null, updatedAt: '2026-05-12T12:00:00Z' }),
            createItem({ issueNumber: 12, assignees: [], status: 'In Progress', estimate: 5 }),
        ]);

        expect(events).toEqual([
            {
                issueNumber: 10,
                assignees: ['alice'],
                doneAt: '2026-05-10T00:00:00Z',
                estimate: 3,
                status: 'Done',
            },
            {
                issueNumber: 11,
                assignees: ['alice', 'bob'],
                doneAt: '2026-05-12T12:00:00Z',
                estimate: null,
                status: 'Done',
            },
        ]);
    });

    it('担当者別に Done 件数と Estimate を集計できる', () => {
        const summary = aggregateIssueMetrics({
            projectId: 'org#12',
            period: { from: '2026-05-01', to: '2026-05-31' },
            logins: ['alice', 'bob'],
            events: [
                {
                    issueNumber: 10,
                    assignees: ['alice'],
                    doneAt: '2026-05-10T00:00:00Z',
                    estimate: 3,
                    status: 'Done',
                },
                {
                    issueNumber: 11,
                    assignees: ['alice', 'bob'],
                    doneAt: '2026-05-12T12:00:00Z',
                    estimate: null,
                    status: 'Done',
                },
                {
                    issueNumber: 12,
                    assignees: [],
                    doneAt: '2026-05-20T08:30:00Z',
                    estimate: 5,
                    status: 'Done',
                },
                {
                    issueNumber: 13,
                    assignees: ['alice'],
                    doneAt: '2026-06-01T00:00:00Z',
                    estimate: 8,
                    status: 'Done',
                },
            ],
        });

        expect(summary).toEqual({
            projectId: 'org#12',
            period: { from: '2026-05-01', to: '2026-05-31' },
            contributors: [
                {
                    login: 'alice',
                    doneCount: 2,
                    estimateTotal: 3,
                    estimateMissingCount: 1,
                    doneIssueNumbers: [10, 11],
                },
                {
                    login: 'bob',
                    doneCount: 1,
                    estimateTotal: 0,
                    estimateMissingCount: 1,
                    doneIssueNumbers: [11],
                },
            ],
            unassigned: {
                login: 'unassigned',
                doneCount: 1,
                estimateTotal: 5,
                estimateMissingCount: 0,
                doneIssueNumbers: [12],
            },
        });
    });

    it('Estimate フィールド名の別名（Story Points）でも値を抽出できる', () => {
        const items: ProjectIssueItem[] = [{
            id: 'item-21',
            updatedAt: '2026-05-15T09:00:00Z',
            content: {
                number: 21,
                title: 'Issue 21',
                assignees: {
                    nodes: [{ login: 'alice' }],
                },
            },
            fieldValues: {
                nodes: [
                    {
                        __typename: 'ProjectV2ItemFieldSingleSelectValue',
                        name: 'Done',
                        field: {
                            name: 'Status',
                        },
                    },
                    {
                        __typename: 'ProjectV2ItemFieldNumberValue',
                        number: 5,
                        field: {
                            name: 'Story Points',
                        },
                    },
                ],
            },
        }];

        const events = extractProjectIssueEvents(items);

        expect(events).toEqual([
            {
                issueNumber: 21,
                assignees: ['alice'],
                doneAt: '2026-05-15T09:00:00Z',
                estimate: 5,
                status: 'Done',
            },
        ]);
    });

    it('Done日付が無い場合は closedAt を優先して doneAt を決定する', () => {
        const events = extractProjectIssueEvents([
            createItem({
                issueNumber: 30,
                assignees: ['alice'],
                estimate: 2,
                doneDate: undefined,
                closedAt: '2025-04-20T10:00:00Z',
                updatedAt: '2026-06-07T00:00:00Z',
            }),
        ]);

        expect(events).toEqual([
            {
                issueNumber: 30,
                assignees: ['alice'],
                doneAt: '2025-04-20T10:00:00Z',
                estimate: 2,
                status: 'Done',
            },
        ]);
    });
});
import type { IssueContributorMetrics, IssueMetricsSummary } from './schema.js';

interface ProjectFieldBase {
    field?: {
        name?: string | null;
    } | null;
}

interface ProjectSingleSelectFieldValue extends ProjectFieldBase {
    __typename: 'ProjectV2ItemFieldSingleSelectValue';
    name?: string | null;
}

interface ProjectNumberFieldValue extends ProjectFieldBase {
    __typename: 'ProjectV2ItemFieldNumberValue';
    number?: number | null;
}

interface ProjectDateFieldValue extends ProjectFieldBase {
    __typename: 'ProjectV2ItemFieldDateValue';
    date?: string | null;
}

export type ProjectFieldValue =
    | ProjectSingleSelectFieldValue
    | ProjectNumberFieldValue
    | ProjectDateFieldValue;

export interface ProjectIssueItem {
    id: string;
    updatedAt: string;
    content?: {
        number?: number;
        title?: string;
        url?: string;
        closedAt?: string | null;
        assignees?: {
            nodes: Array<{
                login?: string | null;
            }>;
        };
    } | null;
    fieldValues: {
        nodes: ProjectFieldValue[];
    };
}

export interface ProjectIssueEvent {
    issueNumber: number;
    title: string;
    url: string;
    assignees: string[];
    doneAt: string;
    estimate: number | null;
    status: string;
}

interface ExtractProjectIssueEventsOptions {
    statusFieldName?: string;
    doneValue?: string;
    estimateFieldName?: string;
    estimateFieldNames?: string[];
    doneDateFieldNames?: string[];
}

interface AggregateIssueMetricsInput {
    projectId: string;
    period: { from: string; to: string };
    logins: string[];
    events: ProjectIssueEvent[];
}

interface MutableIssueContributorMetrics extends IssueContributorMetrics {
    doneIssues: DoneIssueItem[];
    seen: Set<number>;
}

const DEFAULT_STATUS_FIELD_NAME = 'Status';
const DEFAULT_DONE_VALUE = 'Done';
const DEFAULT_ESTIMATE_FIELD_NAME = 'Estimate';
const DEFAULT_ESTIMATE_FIELD_NAME_ALIASES = [
    'Story Point',
    'Story Points',
    'Points',
    'Point',
    '見積',
    '見積り',
    '見積もり',
];
const DEFAULT_DONE_DATE_FIELD_NAMES = ['Done Date', 'Done At', 'Completed At', 'Completed Date'];

export function extractProjectIssueEvents(
    items: ProjectIssueItem[],
    options: ExtractProjectIssueEventsOptions = {}
): ProjectIssueEvent[] {
    const statusFieldName = normalize(options.statusFieldName ?? DEFAULT_STATUS_FIELD_NAME);
    const doneValue = normalize(options.doneValue ?? DEFAULT_DONE_VALUE);
    const estimateFieldNames = [
        options.estimateFieldName ?? DEFAULT_ESTIMATE_FIELD_NAME,
        ...(options.estimateFieldNames ?? []),
        ...DEFAULT_ESTIMATE_FIELD_NAME_ALIASES,
    ].map(normalize);
    const doneDateFieldNames = (options.doneDateFieldNames ?? DEFAULT_DONE_DATE_FIELD_NAMES).map(normalize);

    return items.flatMap((item) => {
        const issueNumber = item.content?.number;
        if (typeof issueNumber !== 'number') {
            return [];
        }

        let status: string | null = null;
        let estimate: number | null = null;
        let doneAt: string | null = null;

        for (const fieldValue of item.fieldValues.nodes) {
            const fieldName = normalize(fieldValue.field?.name ?? '');

            if (fieldValue.__typename === 'ProjectV2ItemFieldSingleSelectValue' && fieldName === statusFieldName) {
                status = fieldValue.name ?? null;
            }

            if (fieldValue.__typename === 'ProjectV2ItemFieldNumberValue' && isEstimateFieldName(fieldName, estimateFieldNames)) {
                estimate = typeof fieldValue.number === 'number' ? fieldValue.number : null;
            }

            if (fieldValue.__typename === 'ProjectV2ItemFieldDateValue' && doneDateFieldNames.includes(fieldName)) {
                doneAt = toIsoDate(fieldValue.date ?? null);
            }
        }

        if (normalize(status ?? '') !== doneValue) {
            return [];
        }

        const assignees = Array.from(
            new Set(
                (item.content?.assignees?.nodes ?? [])
                    .map((assignee) => assignee.login?.trim())
                    .filter((login): login is string => Boolean(login))
            )
        );

        return [{
            issueNumber,
            title: item.content?.title ?? '',
            url: item.content?.url ?? '',
            assignees,
            // Done日付フィールドが無い場合は closedAt を優先し、最後に updatedAt を使う。
            doneAt: doneAt ?? item.content?.closedAt ?? item.updatedAt,
            estimate,
            status: status ?? DEFAULT_DONE_VALUE,
        }];
    });
}

export function aggregateIssueMetrics(input: AggregateIssueMetricsInput): IssueMetricsSummary {
    const contributorMap = new Map<string, MutableIssueContributorMetrics>();
    for (const login of input.logins) {
        contributorMap.set(login, createMutableMetrics(login));
    }
    const unassigned = createMutableMetrics('unassigned');

    const periodFrom = `${input.period.from}T00:00:00Z`;
    const periodTo = `${input.period.to}T23:59:59Z`;

    for (const event of input.events) {
        if (event.doneAt < periodFrom || event.doneAt > periodTo) {
            continue;
        }

        const targets = event.assignees.length === 0
            ? [unassigned]
            : event.assignees
                .map((login) => contributorMap.get(login))
                .filter((entry): entry is MutableIssueContributorMetrics => entry !== undefined);

        for (const target of targets) {
            applyEvent(target, event);
        }
    }

    return {
        projectId: input.projectId,
        period: input.period,
        contributors: input.logins.map((login) => stripMutableFields(contributorMap.get(login) ?? createMutableMetrics(login))),
        unassigned: stripMutableFields(unassigned),
    };
}

function applyEvent(target: MutableIssueContributorMetrics, event: ProjectIssueEvent): void {
    if (target.seen.has(event.issueNumber)) {
        return;
    }

    target.seen.add(event.issueNumber);
    target.doneIssues.push({ number: event.issueNumber, title: event.title, url: event.url });
    target.doneCount += 1;

    if (typeof event.estimate === 'number') {
        target.estimateTotal += event.estimate;
        return;
    }

    target.estimateMissingCount += 1;
}

function createMutableMetrics(login: string): MutableIssueContributorMetrics {
    return {
        login,
        doneCount: 0,
        estimateTotal: 0,
        estimateMissingCount: 0,
        doneIssues: [],
        seen: new Set<number>(),
    };
}

function stripMutableFields(metrics: MutableIssueContributorMetrics): IssueContributorMetrics {
    return {
        login: metrics.login,
        doneCount: metrics.doneCount,
        estimateTotal: metrics.estimateTotal,
        estimateMissingCount: metrics.estimateMissingCount,
        doneIssues: metrics.doneIssues,
    };
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function isEstimateFieldName(fieldName: string, estimateFieldNames: string[]): boolean {
    if (estimateFieldNames.includes(fieldName)) {
        return true;
    }

    // プロジェクトごとの命名揺れ（例: "Estimate (pt)", "Story Points (SP)"）を吸収する。
    if (fieldName.includes('estimate') || fieldName.includes('story point') || fieldName.includes('見積')) {
        return true;
    }

    return false;
}

function toIsoDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T00:00:00Z`;
    }

    return value;
}

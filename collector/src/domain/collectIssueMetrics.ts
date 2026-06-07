import type { GithubClient } from '../github/client.js';
import { GET_PROJECT_ISSUES_QUERY } from '../github/queries.js';
import {
    aggregateIssueMetrics,
    extractProjectIssueEvents,
    type ProjectIssueItem,
} from './issueMetrics.js';
import type { IssueMetricsSummary, Period } from './schema.js';

interface ProjectPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

interface ProjectItemsConnection {
    pageInfo: ProjectPageInfo;
    nodes: ProjectIssueItem[];
}

interface ProjectOwnerNode {
    projectV2: {
        id: string;
        title: string;
        items: ProjectItemsConnection;
    } | null;
}

interface ProjectIssuesQueryResult {
    organization: ProjectOwnerNode | null;
    user: ProjectOwnerNode | null;
}

export interface CollectIssueMetricsInput {
    client: GithubClient;
    project: {
        owner: string;
        number: number;
    };
    period: Period;
    logins: string[];
}

export async function collectIssueMetrics(
    input: CollectIssueMetricsInput
): Promise<IssueMetricsSummary> {
    const items = await input.client.executeGraphQLPaged<ProjectIssuesQueryResult, ProjectIssueItem>({
        query: GET_PROJECT_ISSUES_QUERY,
        variables: {
            owner: input.project.owner,
            projectNumber: input.project.number,
            first: 100,
        },
        extractNodes: (response) => getProjectItems(response).nodes,
        extractPageInfo: (response) => getProjectItems(response).pageInfo,
    });

    const events = extractProjectIssueEvents(items);
    const resolvedLogins = input.logins.length > 0
        ? input.logins
        : Array.from(new Set(events.flatMap((event) => event.assignees))).sort();

    return aggregateIssueMetrics({
        projectId: `${input.project.owner}#${input.project.number}`,
        period: input.period,
        logins: resolvedLogins,
        events,
    });
}

function getProjectItems(response: ProjectIssuesQueryResult): ProjectItemsConnection {
    const project = response.organization?.projectV2 ?? response.user?.projectV2;
    if (!project) {
        throw new Error('指定された GitHub Project が見つかりません');
    }

    return project.items;
}

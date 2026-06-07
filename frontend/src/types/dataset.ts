/**
 * Dataset 型定義（collector の schema.ts と同一構造）
 * frontend は JSON ファイルとして Dataset を受け取るため、
 * 独立した型定義として管理する
 */

export interface RelatedIssueLink {
    prNumber: number;
    repository: string;
    issueRef: string;
    keyword?: 'Fixes' | 'Closes' | 'Resolved';
}

export interface PrMetrics {
    createdCount: number;
    closedCount: number;
    mergedCount: number;
    relatedIssues: RelatedIssueLink[];
}

export interface CommitMetrics {
    commitCount: number;
    additions: number;
    deletions: number;
}

export interface ReviewMetrics {
    reviewedPrCount: number;
    reviewCommentCount: number;
}

export interface DerivedMetrics {
    reviewRate: number | null;
    averagePrSize: number | null;
    averageReviewComments: number | null;
    mergeRate: number | null;
}

export interface PrDetails {
    createdPrNumbers: number[];
    mergedPrNumbers: number[];
    reviewedPrNumbers: number[];
}

export interface IssueContributorMetrics {
    login: string;
    doneCount: number;
    estimateTotal: number;
    estimateMissingCount: number;
    doneIssueNumbers: number[];
}

export interface IssueMetricsSummary {
    projectId: string;
    period: Period;
    contributors: IssueContributorMetrics[];
    unassigned: IssueContributorMetrics;
}

export interface ContributorMetrics {
    login: string;
    prs: PrMetrics;
    commits: CommitMetrics;
    reviews: ReviewMetrics;
    derived: DerivedMetrics;
    prDetails?: PrDetails;
}

export interface Period {
    from: string;
    to: string;
}

export interface RepositoryRef {
    owner: string;
    name: string;
    visibility?: 'public' | 'private' | 'internal';
}

export interface Warning {
    code: string;
    message: string;
    repository?: string;
    contributor?: string;
}

export interface Dataset {
    datasetVersion: string;
    generatedAt: string;
    sourceType?: 'enterprise-cloud' | 'personal';
    period: Period;
    repositories: RepositoryRef[];
    contributors: ContributorMetrics[];
    issueMetrics?: IssueMetricsSummary;
    warnings: Warning[];
}

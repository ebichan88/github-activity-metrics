import { z } from 'zod';

// -----------------------------------------------------------------
// 個別フィールドスキーマ
// -----------------------------------------------------------------

export const RelatedIssueLinkSchema = z.object({
    prNumber: z.number().int(),
    repository: z.string(),
    issueRef: z.string(),
    keyword: z.enum(['Fixes', 'Closes', 'Resolved']).optional(),
});

export const PrMetricsSchema = z.object({
    createdCount: z.number().int().min(0),
    closedCount: z.number().int().min(0),
    mergedCount: z.number().int().min(0),
    relatedIssues: z.array(RelatedIssueLinkSchema),
});

export const CommitMetricsSchema = z.object({
    commitCount: z.number().int().min(0),
    additions: z.number().int().min(0),
    deletions: z.number().int().min(0),
});

export const ReviewMetricsSchema = z.object({
    reviewedPrCount: z.number().int().min(0),
    reviewCommentCount: z.number().int().min(0),
});

export const DerivedMetricsSchema = z.object({
    reviewRate: z.number().nullable(),
    averagePrSize: z.number().nullable(),
    averageReviewComments: z.number().nullable(),
    mergeRate: z.number().nullable(),
});

export const PrDetailsSchema = z.object({
    createdPrNumbers: z.array(z.number().int().min(1)).default([]),
    mergedPrNumbers: z.array(z.number().int().min(1)).default([]),
    reviewedPrNumbers: z.array(z.number().int().min(1)).default([]),
});

export const IssueContributorMetricsSchema = z
    .object({
        login: z.string().min(1),
        doneCount: z.number().int().min(0),
        estimateTotal: z.number().min(0),
        estimateMissingCount: z.number().int().min(0),
        doneIssueNumbers: z.array(z.number().int().min(1)),
    })
    .refine((value) => value.doneIssueNumbers.length === value.doneCount, {
        message: 'doneIssueNumbers.length は doneCount と一致する必要があります',
    });

export const ContributorMetricsSchema = z.object({
    login: z.string().min(1),
    prs: PrMetricsSchema,
    commits: CommitMetricsSchema,
    reviews: ReviewMetricsSchema,
    derived: DerivedMetricsSchema,
    prDetails: PrDetailsSchema.default({
        createdPrNumbers: [],
        mergedPrNumbers: [],
        reviewedPrNumbers: [],
    }),
});

export const PeriodSchema = z
    .object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .refine((p) => p.from <= p.to, {
        message: 'period.from は period.to 以前の日付である必要があります',
    });

export const RepositoryRefSchema = z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    visibility: z.enum(['public', 'private', 'internal']).optional(),
});

export const WarningSchema = z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    repository: z.string().optional(),
    contributor: z.string().optional(),
});

export const IssueMetricsSummarySchema = z.object({
    projectId: z.string().min(1),
    period: PeriodSchema,
    contributors: z.array(IssueContributorMetricsSchema),
    unassigned: IssueContributorMetricsSchema,
});

// -----------------------------------------------------------------
// トップレベル Dataset スキーマ
// -----------------------------------------------------------------

export const DatasetSchema = z.object({
    datasetVersion: z.string().min(1),
    generatedAt: z.string(),
    sourceType: z.enum(['enterprise-cloud', 'personal']).optional(),
    period: PeriodSchema,
    repositories: z.array(RepositoryRefSchema),
    contributors: z.array(ContributorMetricsSchema),
    issueMetrics: IssueMetricsSummarySchema.optional(),
    warnings: z.array(WarningSchema).default([]),
});

// -----------------------------------------------------------------
// TypeScript 型エクスポート（Zod 推論）
// -----------------------------------------------------------------

export type RelatedIssueLink = z.infer<typeof RelatedIssueLinkSchema>;
export type PrMetrics = z.infer<typeof PrMetricsSchema>;
export type CommitMetrics = z.infer<typeof CommitMetricsSchema>;
export type ReviewMetrics = z.infer<typeof ReviewMetricsSchema>;
export type DerivedMetrics = z.infer<typeof DerivedMetricsSchema>;
export type PrDetails = z.infer<typeof PrDetailsSchema>;
export type IssueContributorMetrics = z.infer<typeof IssueContributorMetricsSchema>;
export type IssueMetricsSummary = z.infer<typeof IssueMetricsSummarySchema>;
export type ContributorMetrics = z.infer<typeof ContributorMetricsSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type RepositoryRef = z.infer<typeof RepositoryRefSchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;

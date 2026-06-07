import type { Dataset, ContributorMetrics } from '../types/dataset.js';

/** KPI サマリー（全担当者合算） */
export interface KpiSummary {
  totalPrCreated: number;
  totalPrMerged: number;
  totalCommits: number;
  totalReviews: number;
  totalAdditions: number;
  totalDeletions: number;
  contributorCount: number;
}

/** 担当者行の表示用データ */
export interface ContributorRow {
  login: string;
  prCreated: number;
  prMerged: number;
  mergeRate: string;
  commits: number;
  additions: number;
  deletions: number;
  reviewedPrs: number;
  reviewRate: string;
  relatedIssueCount: number;
}

/** ダッシュボード全体の表示用 ViewModel */
export interface DashboardViewModel {
  period: { from: string; to: string };
  generatedAt: string;
  kpi: KpiSummary;
  contributors: ContributorRow[];
  hasWarnings: boolean;
  warningCount: number;
}

/** 数値を小数第1位の百分率文字列に変換する（null は '-'） */
function toPercentStr(value: number | null): string {
  if (value === null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

/** Dataset から DashboardViewModel に変換する純粋関数 */
export function toDashboardViewModel(dataset: Dataset): DashboardViewModel {
  const { contributors, period, generatedAt, warnings } = dataset;

  const kpi: KpiSummary = {
    totalPrCreated: contributors.reduce((s, c) => s + c.prs.createdCount, 0),
    totalPrMerged: contributors.reduce((s, c) => s + c.prs.mergedCount, 0),
    totalCommits: contributors.reduce((s, c) => s + c.commits.commitCount, 0),
    totalReviews: contributors.reduce((s, c) => s + c.reviews.reviewedPrCount, 0),
    totalAdditions: contributors.reduce((s, c) => s + c.commits.additions, 0),
    totalDeletions: contributors.reduce((s, c) => s + c.commits.deletions, 0),
    contributorCount: contributors.length,
  };

  const rows: ContributorRow[] = contributors.map((c: ContributorMetrics) => ({
    login: c.login,
    prCreated: c.prs.createdCount,
    prMerged: c.prs.mergedCount,
    mergeRate: toPercentStr(c.derived.mergeRate),
    commits: c.commits.commitCount,
    additions: c.commits.additions,
    deletions: c.commits.deletions,
    reviewedPrs: c.reviews.reviewedPrCount,
    reviewRate: toPercentStr(c.derived.reviewRate),
    relatedIssueCount: c.prs.relatedIssues.length,
  }));

  return {
    period,
    generatedAt,
    kpi,
    contributors: rows,
    hasWarnings: warnings.length > 0,
    warningCount: warnings.length,
  };
}

import type { DerivedMetrics } from './schema.js';

/** calcDerivedMetrics の入力型 */
export interface CalcDerivedMetricsInput {
    createdCount: number;
    mergedCount: number;
    reviewedPrCount: number;
    reviewCommentCount: number;
    /** PR の additions 合計 */
    totalAdditions: number;
    /** PR の deletions 合計 */
    totalDeletions: number;
}

/**
 * 派生指標を計算する pure 関数
 * 分母が 0 の場合は null を返す（ゼロ除算回避）
 */
export function calcDerivedMetrics(input: CalcDerivedMetricsInput): DerivedMetrics {
    const {
        createdCount,
        mergedCount,
        reviewedPrCount,
        reviewCommentCount,
        totalAdditions,
        totalDeletions,
    } = input;

    const reviewRate =
        createdCount === 0 ? null : reviewedPrCount / createdCount;

    const averagePrSize =
        createdCount === 0
            ? null
            : (totalAdditions + totalDeletions) / createdCount;

    const averageReviewComments =
        reviewedPrCount === 0 ? null : reviewCommentCount / reviewedPrCount;

    const mergeRate =
        createdCount === 0 ? null : mergedCount / createdCount;

    return { reviewRate, averagePrSize, averageReviewComments, mergeRate };
}

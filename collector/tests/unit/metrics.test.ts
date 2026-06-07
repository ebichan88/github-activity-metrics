import { describe, expect, it } from 'vitest';
import { calcDerivedMetrics } from '../../src/domain/metrics.js';

describe('calcDerivedMetrics', () => {
    describe('reviewRate', () => {
        it('createdCount が0のとき null を返す', () => {
            const result = calcDerivedMetrics({
                createdCount: 0,
                mergedCount: 0,
                reviewedPrCount: 2,
                reviewCommentCount: 4,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.reviewRate).toBeNull();
        });

        it('reviewedPrCount / createdCount を計算する', () => {
            const result = calcDerivedMetrics({
                createdCount: 5,
                mergedCount: 4,
                reviewedPrCount: 8,
                reviewCommentCount: 16,
                totalAdditions: 100,
                totalDeletions: 50,
            });
            expect(result.reviewRate).toBeCloseTo(8 / 5);
        });
    });

    describe('averagePrSize', () => {
        it('createdCount が0のとき null を返す', () => {
            const result = calcDerivedMetrics({
                createdCount: 0,
                mergedCount: 0,
                reviewedPrCount: 0,
                reviewCommentCount: 0,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.averagePrSize).toBeNull();
        });

        it('(totalAdditions + totalDeletions) / createdCount を計算する', () => {
            const result = calcDerivedMetrics({
                createdCount: 2,
                mergedCount: 2,
                reviewedPrCount: 0,
                reviewCommentCount: 0,
                totalAdditions: 100,
                totalDeletions: 50,
            });
            // (100 + 50) / 2 = 75
            expect(result.averagePrSize).toBe(75);
        });
    });

    describe('averageReviewComments', () => {
        it('reviewedPrCount が0のとき null を返す', () => {
            const result = calcDerivedMetrics({
                createdCount: 5,
                mergedCount: 4,
                reviewedPrCount: 0,
                reviewCommentCount: 10,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.averageReviewComments).toBeNull();
        });

        it('reviewCommentCount / reviewedPrCount を計算する', () => {
            const result = calcDerivedMetrics({
                createdCount: 3,
                mergedCount: 2,
                reviewedPrCount: 4,
                reviewCommentCount: 12,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.averageReviewComments).toBe(3);
        });
    });

    describe('mergeRate', () => {
        it('createdCount が0のとき null を返す', () => {
            const result = calcDerivedMetrics({
                createdCount: 0,
                mergedCount: 0,
                reviewedPrCount: 0,
                reviewCommentCount: 0,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.mergeRate).toBeNull();
        });

        it('mergedCount / createdCount を計算する', () => {
            const result = calcDerivedMetrics({
                createdCount: 4,
                mergedCount: 3,
                reviewedPrCount: 0,
                reviewCommentCount: 0,
                totalAdditions: 0,
                totalDeletions: 0,
            });
            expect(result.mergeRate).toBeCloseTo(3 / 4);
        });
    });

    describe('すべての指標をまとめて計算する', () => {
        it('標準的なデータで4指標すべてが計算される', () => {
            const result = calcDerivedMetrics({
                createdCount: 5,
                mergedCount: 4,
                reviewedPrCount: 8,
                reviewCommentCount: 16,
                totalAdditions: 200,
                totalDeletions: 100,
            });

            expect(result.reviewRate).toBeCloseTo(8 / 5);
            expect(result.averagePrSize).toBe(60); // (200+100)/5
            expect(result.averageReviewComments).toBe(2); // 16/8
            expect(result.mergeRate).toBeCloseTo(4 / 5);
        });
    });
});

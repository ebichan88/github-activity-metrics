import { describe, expect, it } from 'vitest';
import { extractRelatedIssues } from '../../src/domain/extractRelatedIssues.js';

describe('extractRelatedIssues', () => {
    describe('キーワード検出', () => {
        it('Fixes #123 を検出する', () => {
            const result = extractRelatedIssues({
                prNumber: 1,
                repository: 'org/repo',
                body: 'この PR で Fixes #123 の問題を解消します。',
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                prNumber: 1,
                repository: 'org/repo',
                issueRef: '#123',
                keyword: 'Fixes',
            });
        });

        it('Closes #456 を検出する', () => {
            const result = extractRelatedIssues({
                prNumber: 2,
                repository: 'org/repo',
                body: 'Closes #456',
            });

            expect(result[0]).toMatchObject({ issueRef: '#456', keyword: 'Closes' });
        });

        it('Resolved #789 を検出する', () => {
            const result = extractRelatedIssues({
                prNumber: 3,
                repository: 'org/repo',
                body: 'Resolved #789',
            });

            expect(result[0]).toMatchObject({ issueRef: '#789', keyword: 'Resolved' });
        });

        it('大文字小文字を区別しない', () => {
            const result = extractRelatedIssues({
                prNumber: 4,
                repository: 'org/repo',
                body: 'fixes #100\ncloses #200',
            });

            expect(result).toHaveLength(2);
        });
    });

    describe('複数参照', () => {
        it('1つの PR 本文から複数の Issue 参照を抽出する', () => {
            const result = extractRelatedIssues({
                prNumber: 10,
                repository: 'org/repo',
                body: 'Fixes #10\nCloses #20\nAlso related to #30 (without keyword)',
            });

            // Fixes #10 と Closes #20 のみ（キーワードなしは除外）
            expect(result).toHaveLength(2);
            const refs = result.map((r) => r.issueRef);
            expect(refs).toContain('#10');
            expect(refs).toContain('#20');
        });
    });

    describe('エッジケース', () => {
        it('空の本文は空配列を返す', () => {
            const result = extractRelatedIssues({
                prNumber: 1,
                repository: 'org/repo',
                body: '',
            });
            expect(result).toEqual([]);
        });

        it('null / undefined の本文は空配列を返す', () => {
            const result = extractRelatedIssues({
                prNumber: 1,
                repository: 'org/repo',
                body: null,
            });
            expect(result).toEqual([]);
        });

        it('キーワードのない Issue 番号参照は抽出しない', () => {
            const result = extractRelatedIssues({
                prNumber: 1,
                repository: 'org/repo',
                body: 'See #100 for context',
            });
            expect(result).toEqual([]);
        });

        it('同一 Issue への重複参照は1件にまとめる', () => {
            const result = extractRelatedIssues({
                prNumber: 1,
                repository: 'org/repo',
                body: 'Fixes #10\nFixes #10',
            });
            expect(result).toHaveLength(1);
        });
    });
});

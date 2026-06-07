import { describe, it, expect } from 'vitest';
import { DatasetSchema } from '../../src/domain/schema.js';

describe('datasetSchema', () => {
  describe('必須フィールド', () => {
    it('有効な Dataset を正常にパースできる', () => {
      const valid = {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [{ owner: 'org', name: 'repo' }],
        contributors: [],
      };

      const result = DatasetSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('datasetVersion が欠損している場合はバリデーション失敗', () => {
      const invalid = {
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [],
        contributors: [],
      };

      const result = DatasetSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('period.from が period.to より後の場合はバリデーション失敗', () => {
      const invalid = {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-06-01', to: '2026-05-01' },
        repositories: [],
        contributors: [],
      };

      const result = DatasetSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('contributors', () => {
    it('contributors が空配列でも有効', () => {
      const dataset = {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [],
        contributors: [],
      };

      const result = DatasetSchema.safeParse(dataset);
      expect(result.success).toBe(true);
    });

    it('derived の null フィールドを含む contributor を許容する', () => {
      const dataset = {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [],
        contributors: [
          {
            login: 'user1',
            prs: { createdCount: 0, closedCount: 0, mergedCount: 0, relatedIssues: [] },
            commits: { commitCount: 0, additions: 0, deletions: 0 },
            reviews: { reviewedPrCount: 0, reviewCommentCount: 0 },
            derived: {
              reviewRate: null,
              averagePrSize: null,
              averageReviewComments: null,
              mergeRate: null,
            },
          },
        ],
      };

      const result = DatasetSchema.safeParse(dataset);
      expect(result.success).toBe(true);
    });

    it('count フィールドが負の値の場合はバリデーション失敗', () => {
      const dataset = {
        datasetVersion: '1.0.0',
        generatedAt: '2026-05-31T00:00:00Z',
        period: { from: '2026-05-01', to: '2026-05-31' },
        repositories: [],
        contributors: [
          {
            login: 'user1',
            prs: { createdCount: -1, closedCount: 0, mergedCount: 0, relatedIssues: [] },
            commits: { commitCount: 0, additions: 0, deletions: 0 },
            reviews: { reviewedPrCount: 0, reviewCommentCount: 0 },
            derived: { reviewRate: null, averagePrSize: null, averageReviewComments: null, mergeRate: null },
          },
        ],
      };

      const result = DatasetSchema.safeParse(dataset);
      expect(result.success).toBe(false);
    });
  });

  describe('samples/activity-dataset.sample.json との整合性', () => {
    it('サンプルデータは DatasetSchema を満たす', async () => {
      const { readFileSync } = await import('node:fs');
      const { join, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const samplePath = join(__dirname, '../../../samples/activity-dataset.sample.json');
      const raw = readFileSync(samplePath, 'utf-8');
      const json = JSON.parse(raw) as unknown;

      const result = DatasetSchema.safeParse(json);
      expect(result.success).toBe(true);
    });
  });
});

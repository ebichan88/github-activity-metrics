import { describe, it, expect } from 'vitest';
import { readDataset, DatasetVersionError, DatasetParseError } from '../../src/output/readDataset.js';
import { writeDataset } from '../../src/output/datasetStore.js';
import { DatasetSchema } from '../../src/domain/schema.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, rmSync, existsSync } from 'node:fs';

/** テスト用の最小有効 Dataset */
const minimalDataset = DatasetSchema.parse({
  datasetVersion: '1.0.0',
  generatedAt: '2026-05-31T00:00:00Z',
  period: { from: '2026-05-01', to: '2026-05-31' },
  repositories: [{ owner: 'org', name: 'repo' }],
  contributors: [],
});

function tmpPath(): string {
  return join(tmpdir(), `dataset-version-test-${Date.now()}.json`);
}

describe('datasetVersion 互換性', () => {
  it('バージョン 1.0.0 のファイルを正常に読み込める', () => {
    const path = tmpPath();
    try {
      writeDataset(path, minimalDataset);
      const loaded = readDataset(path);
      expect(loaded.datasetVersion).toBe('1.0.0');
    } finally {
      if (existsSync(path)) rmSync(path);
    }
  });

  it('未サポートのバージョンで DatasetVersionError が投げられる', () => {
    const path = tmpPath();
    try {
      const future = { ...minimalDataset, datasetVersion: '99.0.0' };
      writeFileSync(path, JSON.stringify(future), 'utf-8');

      expect(() => readDataset(path)).toThrowError(DatasetVersionError);
    } finally {
      if (existsSync(path)) rmSync(path);
    }
  });

  it('不正な JSON で DatasetParseError が投げられる', () => {
    const path = tmpPath();
    try {
      writeFileSync(path, 'not-json!!!', 'utf-8');
      expect(() => readDataset(path)).toThrowError(DatasetParseError);
    } finally {
      if (existsSync(path)) rmSync(path);
    }
  });

  it('スキーマ不一致で DatasetParseError が投げられる', () => {
    const path = tmpPath();
    try {
      writeFileSync(path, JSON.stringify({ datasetVersion: '1.0.0', invalid: true }), 'utf-8');
      expect(() => readDataset(path)).toThrowError(DatasetParseError);
    } finally {
      if (existsSync(path)) rmSync(path);
    }
  });
});

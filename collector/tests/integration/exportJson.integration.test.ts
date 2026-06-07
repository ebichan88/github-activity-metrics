/**
 * 収集スクリプトの JSON 出力 統合テスト
 * gh CLI が利用できる環境でのみ実行する
 * CI では SKIP_INTEGRATION=true を設定して除外可能
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DatasetSchema } from '../../src/domain/schema.js';
import { writeDataset } from '../../src/output/datasetStore.js';

const SKIP = process.env['SKIP_INTEGRATION'] === 'true';

describe.skipIf(SKIP)('exportJson 統合テスト', () => {
    it('writeDataset が出力した JSON は DatasetSchema を満たす', () => {
        const outPath = join(tmpdir(), `test-dataset-${Date.now()}.json`);

        const sampleDataset = DatasetSchema.parse({
            datasetVersion: '1.0.0',
            generatedAt: new Date().toISOString(),
            sourceType: 'personal',
            period: { from: '2026-05-01', to: '2026-05-31' },
            repositories: [{ owner: 'example', name: 'repo-a', visibility: 'public' }],
            contributors: [
                {
                    login: 'user1',
                    prs: { createdCount: 1, closedCount: 0, mergedCount: 1, relatedIssues: [] },
                    commits: { commitCount: 3, additions: 50, deletions: 10 },
                    reviews: { reviewedPrCount: 2, reviewCommentCount: 4 },
                    derived: { reviewRate: 2.0, averagePrSize: 60.0, averageReviewComments: 2.0, mergeRate: 1.0 },
                },
            ],
        });

        try {
            writeDataset(outPath, sampleDataset);

            // 出力ファイルが存在する
            expect(existsSync(outPath)).toBe(true);

            // JSON としてパースできる
            const raw = readFileSync(outPath, 'utf-8');
            const parsed = JSON.parse(raw) as unknown;

            // DatasetSchema を満たす
            const validated = DatasetSchema.safeParse(parsed);
            expect(validated.success).toBe(true);

            if (validated.success) {
                expect(validated.data.datasetVersion).toBe('1.0.0');
                expect(validated.data.contributors).toHaveLength(1);
            }
        } finally {
            if (existsSync(outPath)) rmSync(outPath);
        }
    });

    it('export-activity-json.sh は --out 相対パスをリポジトリルート基準に解決する', () => {
        const repoRoot = resolve(__dirname, '../../..');
        const scriptPath = join(repoRoot, 'scripts/export-activity-json.sh');

        const tempRoot = mkdtempSync(join(tmpdir(), 'export-json-test-'));
        const fakeBin = join(tempRoot, 'bin');
        const capturePath = join(tempRoot, 'pnpm-args.txt');

        try {
            mkdirSync(fakeBin, { recursive: true });
            // テスト用の最小モックコマンドを作成
            writeFileSync(join(fakeBin, 'gh'), '#!/usr/bin/env bash\nif [[ "$1" == "auth" && "$2" == "status" ]]; then exit 0; fi\nexit 0\n');
            writeFileSync(join(fakeBin, 'pnpm'), '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$CAPTURE_ARGS_PATH"\nexit 0\n');
            chmodSync(join(fakeBin, 'gh'), 0o755);
            chmodSync(join(fakeBin, 'pnpm'), 0o755);

            execFileSync(scriptPath, [
                '--from', '2026-05-01',
                '--to', '2026-05-31',
                '--repos', 'org/repo-a',
                '--contributors', 'user1',
                '--out', './data/out.json',
            ], {
                cwd: repoRoot,
                env: {
                    ...process.env,
                    PATH: `${fakeBin}:${process.env['PATH'] ?? ''}`,
                    CAPTURE_ARGS_PATH: capturePath,
                },
                encoding: 'utf-8',
            });

            const captured = readFileSync(capturePath, 'utf-8').trim().split('\n');
            const outIndex = captured.findIndex((arg) => arg === '--out');

            expect(outIndex).toBeGreaterThanOrEqual(0);
            expect(captured[outIndex + 1]).toBe(join(repoRoot, 'data/out.json'));
        } finally {
            rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});

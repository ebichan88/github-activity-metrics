#!/usr/bin/env node
/**
 * 収集 CLI エントリポイント
 * scripts/export-activity-json.sh から呼び出される
 */
import { Command } from 'commander';
import { collectActivity } from '../domain/collectActivity.js';
import { CollectRequestSchema } from '../domain/collectRequest.js';
import { CliGithubClient } from '../github/client.js';
import { writeDataset } from '../output/datasetStore.js';

const program = new Command();

program
    .name('collector')
    .description('GitHub活動実績を収集し、JSONとして出力します')
    .version('0.1.0');

program
    .command('collect')
    .alias('run')
    .description('GitHubから活動実績を収集してJSONファイルに保存します')
    .requiredOption('--from <date>', '集計開始日 (YYYY-MM-DD)')
    .requiredOption('--to <date>', '集計終了日 (YYYY-MM-DD)')
    .requiredOption('--repos <repos>', 'カンマ区切りのリポジトリ一覧 (owner/name,owner/name,...)')
    .requiredOption('--contributors <logins>', 'カンマ区切りの GitHub ログイン一覧')
    .requiredOption('--out <path>', '出力 JSON ファイルパス')
    .option('--source-type <type>', 'アカウント種別 (enterprise-cloud | personal)', 'personal')
    .action(async (options: {
        from: string;
        to: string;
        repos: string;
        contributors: string;
        out: string;
        sourceType: string;
    }) => {
        const startTime = Date.now();

        // リポジトリ文字列をパース (owner/name,...)
        const repositories = options.repos.split(',').map((r) => {
            const trimmed = r.trim();
            const slashIdx = trimmed.indexOf('/');
            if (slashIdx === -1) {
                console.error(`[error] リポジトリ形式が不正です: ${trimmed} (owner/name 形式で指定してください)`);
                process.exit(1);
            }
            return {
                owner: trimmed.slice(0, slashIdx),
                name: trimmed.slice(slashIdx + 1),
            };
        });

        const logins = options.contributors.split(',').map((l) => l.trim());

        // 入力バリデーション
        const parseResult = CollectRequestSchema.safeParse({
            period: { from: options.from, to: options.to },
            repositories,
            logins,
        });

        if (!parseResult.success) {
            console.error('[error] 入力パラメータが不正です:');
            for (const issue of parseResult.error.issues) {
                console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
            }
            process.exit(1);
        }

        const client = new CliGithubClient();

        console.error(`[info] 収集を開始します: ${options.from} ～ ${options.to}`);
        console.error(`[info] リポジトリ: ${repositories.map((r) => `${r.owner}/${r.name}`).join(', ')}`);
        console.error(`[info] 担当者: ${logins.join(', ')}`);

        const { dataset } = await collectActivity({
            client,
            request: parseResult.data,
        });

        // sourceType をオプションから注入
        const sourceType = options.sourceType as 'enterprise-cloud' | 'personal';
        const finalDataset = { ...dataset, sourceType };

        writeDataset(options.out, finalDataset);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[info] 収集完了: ${options.out} (${elapsed}秒)`);

        // T046: パフォーマンス計測ログ出力
        const repoCount = repositories.length;
        const contributorCount = dataset.contributors.length;
        console.error(
          `[perf] repos=${repoCount} contributors=${contributorCount} elapsed=${elapsed}s`
        );

        if (dataset.warnings.length > 0) {
            console.error(`[warn] ${dataset.warnings.length}件の警告があります:`);
            for (const w of dataset.warnings) {
                console.error(`  [${w.code}] ${w.message}`);
            }
        }
    });

// デフォルトは collect コマンドとして扱う（scripts/export-activity-json.sh の互換性）
if (process.argv.slice(2)[0] !== 'collect') {
    process.argv.splice(2, 0, 'collect');
}

program.parseAsync(process.argv).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[error] ${msg}`);
    process.exit(1);
});

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Dataset } from '../domain/schema.js';

/**
 * Dataset を JSON ファイルに書き込む（Local First 保存 API）
 * 親ディレクトリが存在しない場合は再帰的に作成する
 */
export function writeDataset(filePath: string, dataset: Dataset): void {
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });

    const json = JSON.stringify(dataset, null, 2);
    writeFileSync(filePath, json, { encoding: 'utf-8' });
}

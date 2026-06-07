import { readFileSync } from 'node:fs';
import { DatasetSchema, type Dataset } from '../domain/schema.js';

export class DatasetVersionError extends Error {
    constructor(public readonly found: string) {
        super(`サポートされていない datasetVersion です: ${found}`);
        this.name = 'DatasetVersionError';
    }
}

export class DatasetParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatasetParseError';
    }
}

/** サポートする datasetVersion の一覧 */
const SUPPORTED_VERSIONS = ['1.0.0', '1.1.0'];

/**
 * JSON ファイルを読み込んで Dataset に変換する
 * バージョン不一致・スキーマ不一致の場合は例外をスローする
 */
export function readDataset(filePath: string): Dataset {
    let raw: string;
    try {
        raw = readFileSync(filePath, { encoding: 'utf-8' });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new DatasetParseError(`ファイルの読み込みに失敗しました: ${msg}`);
    }

    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new DatasetParseError('JSONのパースに失敗しました。ファイルが壊れている可能性があります。');
    }

    // バージョンチェック（スキーマ検証より前に実施）
    if (
        typeof json === 'object' &&
        json !== null &&
        'datasetVersion' in json &&
        typeof (json as Record<string, unknown>)['datasetVersion'] === 'string'
    ) {
        const version = (json as Record<string, unknown>)['datasetVersion'] as string;
        if (!SUPPORTED_VERSIONS.includes(version)) {
            throw new DatasetVersionError(version);
        }
    }

    const result = DatasetSchema.safeParse(json);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        throw new DatasetParseError(`データセットのスキーマ検証に失敗しました: ${issues}`);
    }

    return result.data;
}

import type { Dataset } from '../types/dataset.js';

export class DatasetLoadError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'DatasetLoadError';
    }
}

/**
 * ユーザーが選択したファイルから Dataset を読み込む
 * バリデーションはスキーマチェックで実施し、問題があれば DatasetLoadError をスローする
 */
export async function loadDataset(file: File): Promise<Dataset> {
    const text = await file.text().catch((err) => {
        throw new DatasetLoadError('ファイルの読み込みに失敗しました', err);
    });

    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        throw new DatasetLoadError(
            'JSONのパースに失敗しました。ファイルが壊れているか、JSON形式ではありません。'
        );
    }

    if (typeof json !== 'object' || json === null) {
        throw new DatasetLoadError('データセットの形式が不正です');
    }

    const obj = json as Record<string, unknown>;

    // datasetVersion チェック
    if (!('datasetVersion' in obj) || typeof obj['datasetVersion'] !== 'string') {
        throw new DatasetLoadError(
            '`datasetVersion` フィールドが見つかりません。このファイルはダッシュボード用データセットではない可能性があります。'
        );
    }

    const SUPPORTED_VERSIONS = ['1.0.0'];
    if (!SUPPORTED_VERSIONS.includes(obj['datasetVersion'] as string)) {
        throw new DatasetLoadError(
            `サポートされていないバージョン: ${String(obj['datasetVersion'])}。最新の収集ツールで再取得してください。`
        );
    }

    // 必須フィールドの簡易チェック
    for (const field of ['period', 'repositories', 'contributors'] as const) {
        if (!(field in obj)) {
            throw new DatasetLoadError(`必須フィールド "${field}" が見つかりません`);
        }
    }

    return json as Dataset;
}

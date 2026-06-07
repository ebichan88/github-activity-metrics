import type { Dataset } from '../types/dataset.js';

export class DatasetLoadError extends Error {
    constructor(
        message: string,
        cause?: unknown
    ) {
        super(message, { cause });
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

    const SUPPORTED_VERSIONS = ['1.0.0', '1.1.0'];
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

    const dataset = json as Dataset;

    // 後方互換: 旧データセットに prDetails がない場合は空配列を補完
    for (const contributor of dataset.contributors) {
        if (!contributor.prDetails) {
            contributor.prDetails = {
                createdPrNumbers: [],
                mergedPrNumbers: [],
                reviewedPrNumbers: [],
            };
        }
    }

    // 後方互換: issueMetrics 未収集データでもUIで扱えるように undefined を許容
    if (!('issueMetrics' in dataset)) {
        dataset.issueMetrics = undefined;
    }

    return dataset;
}

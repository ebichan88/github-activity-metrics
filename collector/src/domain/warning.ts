/**
 * 非致命エラー通知モデル
 * 収集処理中に発生した回復可能な問題を表現する
 */

import type { Warning } from './schema.js';

/** 定義済みウォーニングコード定数 */
export const WarningCode = {
    /** リポジトリへのアクセス権がない */
    REPO_ACCESS_DENIED: 'REPO_ACCESS_DENIED',
    /** GitHub API レート制限に達した */
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    /** GraphQL エラーが発生したが収集は継続できた */
    GRAPHQL_ERROR: 'GRAPHQL_ERROR',
    /** データが部分的にしか取得できなかった */
    PARTIAL_DATA: 'PARTIAL_DATA',
    /** コミット履歴の取得でデフォルトブランチが存在しない */
    NO_DEFAULT_BRANCH: 'NO_DEFAULT_BRANCH',
} as const;

export type WarningCodeType = (typeof WarningCode)[keyof typeof WarningCode];

/**
 * Warning オブジェクトを生成するファクトリ関数
 */
export function createWarning(
    code: string,
    message: string,
    options?: { repository?: string; contributor?: string }
): Warning {
    return {
        code,
        message,
        ...options,
    };
}

/**
 * リポジトリアクセス拒否ウォーニングを生成する
 */
export function createRepoAccessWarning(repository: string): Warning {
    return createWarning(
        WarningCode.REPO_ACCESS_DENIED,
        `リポジトリ ${repository} へのアクセスが拒否されました。利用可能なデータで集計を継続します。`,
        { repository }
    );
}

/**
 * GraphQL エラーウォーニングを生成する
 */
export function createGraphqlErrorWarning(
    message: string,
    options?: { repository?: string; contributor?: string }
): Warning {
    return createWarning(WarningCode.GRAPHQL_ERROR, message, options);
}

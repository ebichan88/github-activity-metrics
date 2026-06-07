import { z } from 'zod';
import { PeriodSchema } from './schema.js';

/**
 * 収集リクエストの入力バリデーションスキーマ
 */
export const CollectRequestSchema = z.object({
    /** 集計対象期間 */
    period: PeriodSchema,
    /** 対象リポジトリ一覧 */
    repositories: z
        .array(
            z.object({
                owner: z.string().min(1),
                name: z.string().min(1),
            })
        )
        .min(1, 'リポジトリを1件以上指定してください'),
    /** 集計対象の GitHub login 一覧 */
    logins: z
        .array(z.string().min(1))
        .min(1, 'ログイン名を1件以上指定してください'),
});

export type CollectRequest = z.infer<typeof CollectRequestSchema>;

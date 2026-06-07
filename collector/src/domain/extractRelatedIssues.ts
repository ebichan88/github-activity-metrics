import type { RelatedIssueLink } from './schema.js';

/** サポートするキーワード（大文字小文字不問） */
const KEYWORDS = ['Fixes', 'Closes', 'Resolved'] as const;
type Keyword = (typeof KEYWORDS)[number];

/** extractRelatedIssues の入力型 */
export interface ExtractInput {
    prNumber: number;
    repository: string;
    body: string | null | undefined;
}

/** PR 本文から Issue 参照を抽出する pure 関数 */
export function extractRelatedIssues(input: ExtractInput): RelatedIssueLink[] {
    const { prNumber, repository, body } = input;

    if (!body) return [];

    const pattern = new RegExp(
        `(?:${KEYWORDS.join('|')})\\s+(#\\d+)`,
        'gi'
    );

    const seen = new Set<string>();
    const results: RelatedIssueLink[] = [];

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(body)) !== null) {
        const rawKeyword = match[0]!.split(/\s+/)[0]!;
        // 正規化: 先頭大文字
        const normalized = rawKeyword.charAt(0).toUpperCase() + rawKeyword.slice(1).toLowerCase();
        const keyword = KEYWORDS.find(
            (k) => k.toLowerCase() === rawKeyword.toLowerCase()
        ) as Keyword | undefined;
        const issueRef = match[1]!;

        const key = `${issueRef}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
            prNumber,
            repository,
            issueRef,
            keyword,
        });
    }

    return results;
}

import { describe, it, expect } from 'vitest';

/**
 * T047: FR-010 ログイン導線非提供のガードテスト
 * DashboardPage に GitHub 認証関連の UI 要素が存在しないことを確認する
 */
describe('noLoginFlow', () => {
  it('DashboardPage のテンプレートにログインボタン・OAuth関連要素が含まれない', async () => {
    // DashboardPage のソースコードを文字列として読み込み、
    // ログイン関連のキーワードが含まれていないことを確認する
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dashboardPagePath = join(__dirname, '../../src/pages/DashboardPage.vue');
    const source = readFileSync(dashboardPagePath, 'utf-8');

    // ログイン・認証関連のキーワードが含まれていないことを確認
    const forbiddenPatterns = [
      /gh\s*auth/i,
      /oauth/i,
      /sign[\s-]?in/i,
      /log[\s-]?in/i,
      /access[\s-]?token/i,
      /personal[\s-]?access[\s-]?token/i,
      /PAT/,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(
        source,
        `DashboardPage に禁止パターン "${pattern.source}" が含まれています`
      ).not.toMatch(pattern);
    }
  });

  it('loadDataset.ts にログイン要求コードが含まれない', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const loadDatasetPath = join(__dirname, '../../src/services/loadDataset.ts');
    const source = readFileSync(loadDatasetPath, 'utf-8');

    // fetch/XMLHttpRequest による外部 API 呼び出しがないことを確認
    expect(source).not.toMatch(/fetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest/);
    expect(source).not.toMatch(/axios/);
  });
});

# GitHub Activity Metrics

GitHub の活動実績をローカルで収集し、JSON として保存、ダッシュボードで可視化するツールです。

- 収集: Node.js + gh CLI + GraphQL
- 表示: Vue 3 + Vuetify + Vite
- 配備: GitHub Pages（静的ホスティング）

## 前提環境

- Node.js 22 以上
- pnpm 9 以上
- gh CLI（GitHub CLI）

## セットアップ

```bash
pnpm install
```

GitHub 認証を確認します。

```bash
gh auth status
```

未ログインの場合はログインします。

```bash
gh auth login
```

## データ収集（JSON 出力）

収集スクリプトを実行します。

```bash
./scripts/export-activity-json.sh \
  --from 2026-05-01 --to 2026-05-31 \
  --repos org/repo-a,org/repo-b \
  --contributors user1,user2 \
  --out ./data/activity-2026-05.json
```

Issue 実績（GitHub Project）の収集:

```bash
./scripts/export-activity-json.sh \
  --from 2026-05-01 --to 2026-05-31 \
  --repos org/repo-a \
  --contributors user1,user2 \
  --project-owner your-org \
  --project-number 12 \
  --out ./data/activity-issue-2026-05.json
```

引数なしで実行すると Usage を表示します。

```bash
./scripts/export-activity-json.sh
```

出力ファイルは `datasetVersion` を含む JSON です（`--out` が相対パスの場合はリポジトリルート基準）。

## フロントエンド起動（ローカル）

```bash
pnpm frontend:dev
```

ブラウザで表示後、`JSON読込` ボタンからローカルJSONファイルを選択してダッシュボードを確認します。

- `PR実績` メニュー: PR/Commit/Review の指標とPR番号詳細
- `Issue実績` メニュー: Done件数、Estimate合計、Estimate未設定件数

## テスト実行

全体テスト:

```bash
pnpm test
```

個別実行:

```bash
pnpm test:collector
pnpm test:frontend
```

## GitHub Pages 配備

ビルド（Pages 用 base 付き）:

```bash
GITHUB_PAGES=true pnpm frontend:build
```

配備は GitHub Actions を利用します。

- ワークフロー: `.github/workflows/deploy-pages.yml`
- `main` ブランチへ push 後に自動デプロイ

## 主要ディレクトリ

```text
collector/   収集CLI・ドメインロジック
frontend/    ダッシュボードUI
scripts/     実行スクリプト
samples/     サンプルデータ
specs/       仕様・計画・チェックリスト
```

## トラブルシュート

- `gh CLI が見つかりません`:
  gh CLI をインストールしてください。
- `gh CLI で認証されていません`:
  `gh auth login` を実行してください。
- `pnpm が見つかりません`:
  pnpm をインストールし、PATH が通っていることを確認してください。

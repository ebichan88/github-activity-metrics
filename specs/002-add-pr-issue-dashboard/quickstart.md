# Quickstart: PR詳細表示とGitHub Project Issue実績ダッシュボード

## 前提

- Node.js 22 LTS
- pnpm 9+
- gh CLI インストール済み
- GitHub Enterprise Cloud または個人GitHubアカウントの読み取り権限

## 1. セットアップ

1. 依存関係をインストール

   pnpm install

2. gh CLI ログイン状態を確認

   gh auth status

3. 未ログイン時はログイン

   gh auth login

4. GitHub Project を収集する場合は `read:project` スコープを追加

   gh auth refresh --scopes read:project

   ※ スコープ確認: `gh auth status` で `Token scopes` に `read:project` が含まれているか確認

## 2. PRベースデータの収集

1. 収集スクリプトに実行権限を付与

   chmod +x ./scripts/export-activity-json.sh

2. 期間・対象repo・担当者を指定して収集

   ./scripts/export-activity-json.sh --from 2026-05-01 --to 2026-05-31 --repos org/repo-a,org/repo-b --contributors user1,user2 --out ./data/activity-pr-2026-05.json

   ※ `--out` が相対パスの場合、リポジトリルート基準で出力される

3. 出力JSON確認

- `contributors[].prDetails` が含まれる
- `createdPrNumbers` / `mergedPrNumbers` / `reviewedPrNumbers` を確認できる

## 3. Issueベースデータの収集

1. 同スクリプトでProject指定オプションを利用

   ./scripts/export-activity-json.sh --from 2026-05-01 --to 2026-05-31 --project-owner your-org --project-number 12 --out ./data/activity-issue-2026-05.json

2. 出力JSON確認

- `issueMetrics.contributors[].doneCount` がある
- `issueMetrics.contributors[].estimateTotal` がある

## 4. ダッシュボード表示確認

1. 開発サーバ起動

   pnpm frontend:dev

2. ブラウザで表示し、`JSON読込` ボタンからローカルで生成したJSONファイルを選択

3. 初期表示の `PR実績` メニューで担当者行の詳細表示を開き、PR番号一覧を確認

4. `Issue実績` メニューへ切り替え、担当者別Done件数とEstimate合計を確認

## 5. テスト実行

1. collectorテスト

   pnpm --filter collector test

2. frontendテスト

   pnpm --filter frontend test

## 6. 補足

- 既存データに `issueMetrics` がない場合、Issueビューは「未収集」メッセージを表示する。
- GitHub Pages側ではデータ取得を実行せず、ローカルシェルで生成済みJSONの読込のみを行う。
- 収集オプション一覧は `./scripts/export-activity-json.sh --help` で確認できる。

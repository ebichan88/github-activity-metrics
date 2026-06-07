# Quickstart: GitHub活動実績ローカルダッシュボード

## 前提

- Node.js 22 LTS
- pnpm 9+
- gh CLI インストール済み
- GitHub Enterprise Cloud または個人GitHubアカウントにアクセス権あり

## 1. セットアップ

1. 依存関係インストール

   pnpm install

2. gh CLI ログイン確認

   gh auth status

3. 必要ならログイン

   gh auth login

## 2. データ収集

1. 収集スクリプトに実行権限を付与

   chmod +x ./scripts/export-activity-json.sh

2. 指定期間・対象repo・担当者で収集

   ./scripts/export-activity-json.sh --from 2026-05-01 --to 2026-05-31 --repos org/repo-a,org/repo-b --contributors user1,user2 --out ./data/activity-2026-05.json

3. 成果物確認

   - 出力JSONに datasetVersion がある
   - contributors 配列に担当者結果がある

## 3. フロント起動（ローカル）

1. 開発サーバ起動

   pnpm frontend:dev

2. ブラウザで表示し、JSON読込ボタンから収集ファイルを選択

3. 主要KPI（PR/Commit/Review/派生指標）が表示されることを確認

## 4. GitHub Pages 配備

1. ビルド（GitHub Pages 用ベースパスを指定）

   GITHUB_PAGES=true pnpm frontend:build

2. `.github/workflows/deploy-pages.yml` を有効化し、`main` ブランチへプッシュ
   → GitHub Actions が自動的にビルド＆デプロイします

3. リポジトリ設定 > Pages > Source を「GitHub Actions」に変更

4. 公開ページでJSON読み込み表示を確認

## 5. 評価資料準備時間の計測（SC-004）

```bash
# 作業開始時
./scripts/measure-report-prep-time.sh start

# ... 評価資料作成作業 ...

# 作業完了時（所要時間が表示される）
./scripts/measure-report-prep-time.sh stop
```

詳細は `specs/001-github-activity-dashboard/checklists/reporting-time-benchmark.md` を参照。

## 6. 手動確認チェックリスト

- gh CLI未ログイン時に収集スクリプトが終了し、案内メッセージが出る
- 期間内データ0件でもエラーにならず0件表示される
- Fixes/Closes 参照IssueがPR単位で表示される
- 作成PR数0件の担当者で派生指標が null 扱いになる
- オフライン状態でも保存済みJSON読込が成功する
- 不正JSONで復旧可能なエラーメッセージが表示される

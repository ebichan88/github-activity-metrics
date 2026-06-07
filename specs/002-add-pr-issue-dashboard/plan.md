# Implementation Plan: PR詳細表示とGitHub Project Issue実績ダッシュボード

**Branch**: `001-add-pr-issue-dashboard` | **Date**: 2026-06-07 | **Spec**: /home/takashi-ebina/github-activity-metrics/specs/001-add-pr-issue-dashboard/spec.md

**Input**: Feature specification from `/home/takashi-ebina/github-activity-metrics/specs/001-add-pr-issue-dashboard/spec.md`

## Summary

既存のPRベース集計に対して、担当者別のPR番号詳細を確認できるUI導線を追加し、
さらにGitHub Project issueベースのDone件数/Estimate合計を同一ダッシュボード内の別メニューとして提供する。
実装は既存のLocal First構成（collectorで収集してJSON保存、frontendで読込表示）を維持し、
データモデル拡張とUI分岐の最小変更で要件を満たす。

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x, Vue 3
- Collector: Node.js 22 LTS, TypeScript

**Primary Dependencies**:
- Frontend: Vue 3, Vite, Vuetify 3, Vitest
- Collector: zod, gh CLI（外部コマンド経由）, Vitest
- Access: GitHub GraphQL API（PR情報 + Project issue情報）

**Storage**:
- ローカルJSONファイル（datasetVersion付きデータセット）

**Testing**:
- Collector: Vitest（ユニット + 統合）
- Frontend: Vitest + Vue Test Utils
- Schema: datasetスキーマ検証テスト

**Target Platform**:
- 収集: ローカルPC（Linux/macOS/Windows）
- 表示: 静的Web（Vite build、GitHub Pages配信）

**Project Type**:
- モノレポ構成の Web application + local collector

**Performance Goals**:
- 100リポジトリ・31日範囲で収集15分以内
- 保存済みJSON読込後、主要カード表示3秒以内
- PR番号詳細の展開操作で体感1秒以内に一覧表示

**Constraints**:
- 認証はgh CLIを継続利用し、PAT入力UIを導入しない
- Local First（保存済みJSONのみで再表示可能）を維持する
- 既存PRダッシュボードとの後方互換を維持する
- データ取得はローカルシェル実行のみで行い、GitHub Pages側では取得処理を実行しない
- GitHub Pages側の表示開始は `JSON読込` ボタンによるローカルファイル選択を唯一の入口とする
- `.specify/README.md` は未存在のため、既存spec/plan書式を準拠元とする

**Scale/Scope**:
- 初期対象: 1ユーザー運用
- 集計対象: 最大100リポジトリ、最大50担当者
- GitHub Project: 単一または少数Projectを期間指定で集計

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Simplicity First: PASS（既存dataset拡張と画面切替追加に限定、追加サーバなし）
- Maintainability: PASS（PR詳細・Issue集計を既存domain層で分離実装）
- Testability: PASS（集計ロジックをpure関数化し、GitHub取得境界はモック可能）
- Local First: PASS（JSON保存/読込を変更せず拡張）
- UX: PASS（PRビュー/Issueビューをメニュー分離し導線明確化）

## Project Structure

### Documentation (this feature)

```text
/home/takashi-ebina/github-activity-metrics/specs/001-add-pr-issue-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── github-project-issues.graphql
└── tasks.md
```

### Source Code (repository root)

```text
/home/takashi-ebina/github-activity-metrics/collector/
├── src/
│   ├── cli/
│   ├── domain/
│   ├── github/
│   └── output/
└── tests/
    ├── integration/
    └── unit/

/home/takashi-ebina/github-activity-metrics/frontend/
├── src/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   ├── services/
│   └── types/
└── tests/
    └── unit/

/home/takashi-ebina/github-activity-metrics/scripts/
└── export-activity-json.sh
```

**Structure Decision**:
collector + frontend の既存モノレポ構成を維持し、collector側でPR詳細/Issue集計データを拡張、frontend側でビュー切替と詳細表示UIを追加する。

## Phase 0: Research Scope

- GitHub Project issueでDone判定を安定化するフィールド戦略（Status/Iteration互換）
- Estimate集計における欠損値（未設定/非数値）の扱い
- PR番号詳細表示UI（アコーディオン/モーダル）の運用性比較
- 既存datasetVersionとの互換ポリシー（拡張フィールドの扱い）

## Phase 1: Design Scope

- Data Model: Dataset拡張（PR番号詳細セット、Issue担当者集計）
- Contracts: GitHub Project issue取得用のGraphQL契約
- Quickstart: PRビュー/Issueビューの収集・表示フロー更新

## Phase 2 Preview (Implementation)

- collector: GitHub Project issue収集、担当者別Done/Estimate集計、dataset出力拡張
- frontend: PR詳細アコーディオン/モーダル、PR/Issueメニュー切替、Issue集計テーブル、`JSON読込` ボタン導線統一
- cleanup: `scripts/measure-report-prep-time.sh` の削除
- tests: domain集計ユニットテストとUI切替/詳細表示テスト追加

## Constitution Check (Post-Design)

- Simplicity First: PASS（新規サービス導入なし、既存責務内の拡張）
- Maintainability: PASS（PR詳細とIssue集計を別モジュールとして設計）
- Testability: PASS（集計関数とUI状態遷移にテスト点を明示）
- Local First: PASS（保存データ読み込みでPR/Issue両ビュー再表示可能）
- UX: PASS（ビュー切替をトップ導線化し、詳細確認を1アクション化）

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| なし | N/A | N/A |

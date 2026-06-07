# Tasks: PR詳細表示とGitHub Project Issue実績ダッシュボード

**Input**: Design documents from `/specs/001-add-pr-issue-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: コア集計ロジックのユニットテストは必須。仕様で要求されたPR詳細表示・Issue集計・メニュー分離の検証テストを含める。

**Organization**: タスクはユーザーストーリー単位で分割し、各ストーリーを独立実装・独立検証できるように構成する。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: ユーザーストーリーに紐づくタスク（US1, US2, US3）
- すべてのタスクは具体的なファイルパスを含む

## 🚀 3. Phase

### Phase 1: Setup（プロジェクト初期化）

**目的**: 本機能で必要な開発設定と実装枠を準備する

- [x] T001 収集オプションの使い方を `scripts/export-activity-json.sh` のヘルプ出力に追記
- [x] T002 [P] 機能クイックスタートの実行手順を `specs/001-add-pr-issue-dashboard/quickstart.md` に最終反映
- [x] T003 [P] GitHub Projectクエリ契約の同期元を `collector/src/github/queries.ts` のコメントに明記

### Phase 2: Foundational（全ストーリー共通の前提）

**目的**: US1/US2/US3の実装前提となるデータ構造・収集境界・読込互換を整備する

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリーへ着手しない

- [x] T004 `collector/src/domain/schema.ts` に `prDetails` と `issueMetrics` のスキーマを追加
- [x] T005 [P] `frontend/src/types/dataset.ts` に `PrDetails` と `IssueMetricsSummary` 型を追加
- [x] T006 [P] `collector/src/domain/collectRequest.ts` に `--project-owner` / `--project-number` 入力検証を追加
- [x] T007 [P] `collector/src/github/client.ts` に Project items のページング取得処理を追加
- [x] T008 `collector/src/cli/collect.ts` で Project指定引数を受け取り収集リクエストへ連携
- [x] T009 `collector/src/domain/collectActivity.ts` でPR集計とIssue集計を統合したDataset生成フローを整備
- [x] T010 [P] `frontend/src/services/loadDataset.ts` に新旧データ互換読込（issueMetrics未存在時のフォールバック）を実装
- [x] T011 [P] `collector/tests/unit/datasetSchema.test.ts` に拡張スキーマ検証ケースを追加
- [x] T012 [P] `collector/tests/unit/datasetVersion.test.ts` にdatasetVersionのminor更新ケースを追加

**Checkpoint**: ここまで完了後、各ユーザーストーリーを並列着手可能

### Phase 3: US1 - PRベース実績の詳細確認 [P1] 🎯 MVP

**ゴール**: 担当者別の作成/マージ/レビューPR番号をUIで即時確認できるようにする

**独立テスト**: 任意担当者でPR指標セルから詳細表示を開き、番号一覧が集計条件どおり表示されることを確認

#### Tests（US1）

- [x] T013 [P] [US1] PR番号詳細集計のユニットテストを `collector/tests/unit/aggregate.test.ts` に追加
- [x] T014 [P] [US1] PR詳細UI表示テストを `frontend/tests/unit/prDetailsDisplay.test.ts` に作成

#### Implementation（US1）

- [x] T015 [P] [US1] PR番号配列（created/merged/reviewed）生成を `collector/src/domain/aggregate.ts` に実装
- [x] T016 [US1] PR詳細データのViewModel変換を `frontend/src/services/toDashboardViewModel.ts` に実装
- [x] T017 [P] [US1] PR番号一覧のアコーディオン/モーダルを `frontend/src/components/PrDetailsAccordion.vue` に作成
- [x] T018 [US1] 指標セルから詳細を開く導線を `frontend/src/components/ContributorTable.vue` に実装
- [x] T019 [US1] PR詳細表示状態管理を `frontend/src/pages/DashboardPage.vue` に実装

**Checkpoint**: US1単体でPR実績の根拠追跡が可能

### Phase 4: US2 - Issueベース実績の可視化 [P2]

**ゴール**: GitHub Project issueから担当者別Done件数とEstimate合計を表示する

**独立テスト**: Project指定で収集したJSONを読み込み、Issueビューで担当者別Done件数/Estimate合計が表示されることを確認

#### Tests（US2）

- [x] T020 [P] [US2] Done判定とEstimate集計のユニットテストを `collector/tests/unit/issueMetrics.test.ts` に作成
- [x] T021 [P] [US2] Project issue収集の統合テストを `collector/tests/integration/collect.integration.test.ts` に追加
- [x] T022 [P] [US2] Issueビュー表示テストを `frontend/tests/unit/issueDashboard.test.ts` に作成
- [x] T042 [P] [US2] GitHub Pages導線としての `JSON読込` ボタン表示・読込開始テストを `frontend/tests/unit/jsonLoadButton.test.ts` に作成

#### Implementation（US2）

- [x] T023 [P] [US2] Project issue GraphQLクエリを `collector/src/github/queries.ts` に実装
- [x] T024 [P] [US2] Issueイベント変換と集計ロジックを `collector/src/domain/issueMetrics.ts` に作成
- [x] T025 [US2] Issue集計ユースケースを `collector/src/domain/collectIssueMetrics.ts` に作成
- [x] T026 [US2] `collectIssueMetrics` 統合を `collector/src/domain/collectActivity.ts` に実装
- [x] T027 [US2] Project指定オプションを `scripts/export-activity-json.sh` に実装
- [x] T028 [US2] Issue実績テーブルを `frontend/src/components/IssueMetricsTable.vue` に作成
- [x] T029 [US2] PR/Issueメニュー切替を `frontend/src/pages/DashboardPage.vue` に実装
- [x] T043 [US2] `frontend/src/pages/DashboardPage.vue` に `JSON読込` ボタン（ファイル選択起点）を明示実装
- [x] T030 [US2] Issue実績のViewModel変換を `frontend/src/services/toDashboardViewModel.ts` に実装
- [x] T031 [US2] 未収集/欠損時の案内表示を `frontend/src/components/ErrorStateBanner.vue` に実装

**Checkpoint**: US2単体でIssue実績の収集・表示が可能

### Phase 5: US3 - 運用整理と不要資産の削減 [P3]

**ゴール**: 不要スクリプトを削除し、PR/Issueの入口を明確にする

**独立テスト**: 不要スクリプトが削除され、画面上でPR用/Issue用導線が迷わず選択できることを確認

#### Tests（US3）

- [x] T032 [P] [US3] メニュー導線の切替テストを `frontend/tests/unit/dashboardMenuSwitch.test.ts` に作成

#### Implementation（US3）

- [x] T033 [US3] 不要スクリプト `scripts/measure-report-prep-time.sh` を削除
- [x] T034 [US3] メニュー文言と初期表示導線を `frontend/src/pages/DashboardPage.vue` で整理
- [x] T035 [US3] 画面補助文言を `frontend/src/components/KpiCards.vue` に追加しPR/Issueの文脈を明確化
- [x] T036 [US3] 利用手順を `README.md` に追記（ローカルシェル収集→GitHub PagesのJSON読込ボタン）

**Checkpoint**: US3単体で運用導線の整理が完了

### Phase 6: Polish & Cross-Cutting Concerns

**目的**: 横断品質・ドキュメント・サンプルデータを仕上げる

- [x] T037 [P] サンプル拡張データを `samples/activity-dataset.sample.json` に更新
- [x] T038 [P] オフライン読込回帰テストを `frontend/tests/unit/loadDataset.offline.test.ts` に追加
- [x] T044 [P] PRビュー0件・Issueビュー0件でも異常終了せず表示継続する回帰テストを `frontend/tests/unit/zeroResultsView.test.ts` に作成
- [x] T039 [P] 手動確認チェックリストを `specs/002-add-pr-issue-dashboard/checklists/manual-test.md` に作成
- [x] T040 Quickstart整合チェックを `specs/002-add-pr-issue-dashboard/quickstart.md` に反映
- [x] T041 収集スクリプトの回帰統合テストを `collector/tests/integration/exportJson.integration.test.ts` に追加

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1: 依存なし
- Phase 2: Phase 1 完了後
- Phase 3 (US1): Phase 2 完了後
- Phase 4 (US2): Phase 2 完了後
- Phase 5 (US3): Phase 2 完了後
- Phase 6: 目的とするUS完了後

### User Story Dependencies

- US1 (P1): Foundational完了後に開始可能、他USへの依存なし
- US2 (P2): Foundational完了後に開始可能、他USへの依存なし
- US3 (P3): Foundational完了後に開始可能、他USへの依存なし

### Within Each User Story

- テストを先に作成して失敗を確認後、実装する
- collector domain → collector cli/script → frontend services/components/pages の順で実装する
- 同一ファイルを編集するタスクは直列で実行する

## Parallel Opportunities

- Phase 1: T002 と T003 は並列可能
- Phase 2: T005, T006, T007, T010, T011, T012 は並列可能
- US1: T013 と T014、T015 と T017 は並列可能
- US2: T020, T021, T022, T042 は並列可能、T023 と T024 は並列可能
- US3: T032 は T033 と並列可能
- Polish: T037, T038, T039, T044 は並列可能

## Parallel Example: User Story 2

```bash
# 先行テストを並列実行
Task T020: collector/tests/unit/issueMetrics.test.ts
Task T021: collector/tests/integration/collect.integration.test.ts
Task T022: frontend/tests/unit/issueDashboard.test.ts

# 収集側実装を並列化
Task T023: collector/src/github/queries.ts
Task T024: collector/src/domain/issueMetrics.ts
```

## Implementation Strategy

### MVP First（US1のみ先行）

1. Phase 1 と Phase 2 を完了
2. Phase 3 (US1) を完了
3. US1独立テストを実施し、PR番号詳細表示をMVPとして検証

### Incremental Delivery

1. US1でPR実績の根拠確認を提供
2. US2でIssue実績可視化を追加
3. US3で運用整理（不要ファイル削除と導線明確化）を実施

### Parallel Team Strategy

1. 全員でPhase 1/2を完了
2. US1/US2/US3を担当分担して並列実装
3. Phase 6で統合検証とドキュメント仕上げ

## Notes

- [P] は異なるファイルかつ依存なしのタスクに限定
- [USx] ラベルはユーザーストーリーPhaseで必須
- 各タスクは追加コンテキスト不要で実行可能な粒度に分解
- 仕様変更時は `spec.md` と `tasks.md` を同時更新する
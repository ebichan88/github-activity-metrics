# Tasks: GitHub活動実績ローカルダッシュボード

**Input**: Design documents from `/specs/001-github-activity-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, dataset-schema.json, quickstart.md

**Tests**: コア集計ロジックのユニットテストは必須。JSONスキーマ検証テスト・統合テストは本仕様で要求されるため実施する。

**Organization**: タスクはユーザーストーリー単位で分割し、各ストーリーが独立して実装・検証できるように構成する。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: ユーザーストーリーに紐づくタスク（US1, US2, US3）
- すべてのタスクは具体的なファイルパスを含む

## 🚀 3. Phase

### Phase 1: Setup（プロジェクト初期化）

**目的**: モノレポ基盤と開発設定を用意する

- [ ] T001 ルートのワークスペース設定を `pnpm-workspace.yaml` に作成
- [ ] T002 ルートスクリプトと共通依存を `package.json` に定義
- [ ] T003 [P] 収集ツールの初期設定を `collector/package.json` に作成
- [ ] T004 [P] フロントエンド初期設定を `frontend/package.json` に作成
- [ ] T005 [P] TypeScript共通設定を `tsconfig.base.json` に作成
- [ ] T006 [P] Lint/Format設定を `.eslintrc.cjs` に作成

### Phase 2: Foundational（全ストーリー共通の前提）

**目的**: US着手前に必要な基盤（取得境界・JSON仕様・テスト基盤）を整備する

- [ ] T007 GitHub CLI実行境界を `collector/src/github/client.ts` に実装
- [ ] T008 [P] GraphQLクエリ定義を `collector/src/github/queries.ts` に実装
- [ ] T009 [P] データセットスキーマ検証を `collector/src/domain/schema.ts` に実装
- [ ] T010 Local First保存APIを `collector/src/output/datasetStore.ts` に実装
- [ ] T011 [P] 非致命エラー通知モデルを `collector/src/domain/warning.ts` に実装
- [ ] T012 JSON仕様の整合確認を `specs/001-github-activity-dashboard/dataset-schema.json` で更新
- [ ] T013 サンプルデータを `samples/activity-dataset.sample.json` に作成
- [ ] T014 [P] Collectorのテスト設定を `collector/vitest.config.ts` に作成
- [ ] T015 [P] Frontendのテスト設定を `frontend/vitest.config.ts` に作成

**Checkpoint**: ここまで完了後に各ユーザーストーリーへ着手可能

### Phase 3: US1 - 期間指定で活動実績を集計する [P1] 🎯 MVP

**ゴール**: 指定期間・複数リポジトリ・担当者単位の基本指標を収集し表示する

**独立テスト**: 期間/リポジトリ/担当者を指定して実行し、PR/Commit/Review/変更量とIssue参照が表示されれば合格

#### Tests（US1）

- [ ] T016 [P] [US1] 集計コアのユニットテストを `collector/tests/unit/aggregate.test.ts` に実装
- [ ] T017 [P] [US1] PR本文からIssue参照抽出のユニットテストを `collector/tests/unit/extractRelatedIssues.test.ts` に実装
- [ ] T018 [P] [US1] 収集スクリプトのJSON出力統合テストを `collector/tests/integration/exportJson.integration.test.ts` に実装
- [ ] T019 [P] [US1] 収集CLI統合テストを `collector/tests/integration/collect.integration.test.ts` に実装

#### Implementation（US1）

- [ ] T020 [P] [US1] Issue参照抽出ロジックを `collector/src/domain/extractRelatedIssues.ts` に実装
- [ ] T021 [P] [US1] 基本集計ロジックを `collector/src/domain/aggregate.ts` に実装
- [ ] T022 [US1] 収集ユースケースを `collector/src/domain/collectActivity.ts` に実装
- [ ] T023 [US1] 収集CLIエントリを `collector/src/cli/collect.ts` に実装
- [ ] T024 [US1] 収集入力バリデータを `collector/src/domain/collectRequest.ts` に実装
- [ ] T025 [US1] ダッシュボード表示用変換を `frontend/src/services/toDashboardViewModel.ts` に実装
- [ ] T026 [US1] 主要KPI表示コンポーネントを `frontend/src/components/KpiCards.vue` に実装
- [ ] T027 [US1] 担当者別実績テーブルを `frontend/src/components/ContributorTable.vue` に実装

**Checkpoint**: US1単体で主要価値（定量集計）が提供可能

### Phase 4: US2 - ローカル保存データで再表示する [P2]

**ゴール**: 保存済みJSONのみで再集計・再表示できる

**独立テスト**: オフライン状態でJSON読込後に同一形式のダッシュボード表示ができれば合格

#### Tests（US2）

- [ ] T028 [P] [US2] JSONスキーマ検証テストを `collector/tests/unit/datasetSchema.test.ts` に実装
- [ ] T029 [P] [US2] オフライン読込統合テストを `frontend/tests/unit/loadDataset.offline.test.ts` に実装
- [ ] T030 [P] [US2] データセット互換性ユニットテストを `collector/tests/unit/datasetVersion.test.ts` に実装

#### Implementation（US2）

- [ ] T031 [P] [US2] バージョン検証付き読込ロジックを `collector/src/output/readDataset.ts` に実装
- [ ] T032 [US2] JSON読込サービスを `frontend/src/services/loadDataset.ts` に実装
- [ ] T033 [US2] ファイル読込フローを `frontend/src/composables/useDatasetLoader.ts` に実装
- [ ] T034 [US2] 復旧可能なエラー表示を `frontend/src/components/ErrorStateBanner.vue` に実装
- [ ] T035 [US2] 読込導線付きページを `frontend/src/pages/DashboardPage.vue` に実装

**Checkpoint**: US2単体でLocal First要件を満たす

### Phase 5: US3 - 指標を評価資料向けに確認する [P3]

**ゴール**: 派生指標と比較表示で評価資料向けの分析を可能にする

**独立テスト**: 派生指標の計算整合と担当者比較表示が確認できれば合格

#### Tests（US3）

- [ ] T036 [P] [US3] 派生指標計算ユニットテストを `collector/tests/unit/metrics.test.ts` に実装
- [ ] T037 [P] [US3] 比較表示統合テストを `frontend/tests/unit/contributorComparison.test.ts` に実装

#### Implementation（US3）

- [ ] T038 [P] [US3] 派生指標計算モジュールを `collector/src/domain/metrics.ts` に実装
- [ ] T039 [US3] 比較フィルタロジックを `frontend/src/composables/useContributorFilters.ts` に実装
- [ ] T040 [US3] 派生指標パネルを `frontend/src/components/DerivedMetricsPanel.vue` に実装
- [ ] T041 [US3] 担当者ランキングテーブルを `frontend/src/components/ContributorRankingTable.vue` に実装

**Checkpoint**: US3単体で分析・比較ユースケースを満たす

### Phase 6: Polish & Cross-Cutting Concerns

**目的**: 横断品質向上と配備準備

- [ ] T042 [P] 手動テスト観点を `specs/001-github-activity-dashboard/checklists/manual-test.md` に作成
- [ ] T043 Quickstart手順を `specs/001-github-activity-dashboard/quickstart.md` に更新
- [ ] T044 GitHub Pagesデプロイ設定を `.github/workflows/deploy-pages.yml` に実装
- [ ] T045 ViteのPages base設定を `frontend/vite.config.ts` に実装
- [ ] T046 収集パフォーマンス計測ログ出力を `collector/src/cli/collect.ts` に追加
- [ ] T047 [P] ログイン導線非提供のガードテストを `frontend/tests/unit/noLoginFlow.test.ts` に実装
- [ ] T048 [P] 評価資料準備時間のベースライン計測手順を `specs/001-github-activity-dashboard/checklists/reporting-time-benchmark.md` に作成
- [ ] T049 [P] SC-004判定用の計測スクリプトを `scripts/measure-report-prep-time.sh` に作成

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → 依存なし
- Phase 2 → Phase 1 完了後
- Phase 3 (US1) → Phase 2 完了後
- Phase 4 (US2) → Phase 2 完了後（US1非依存）
- Phase 5 (US3) → Phase 2 完了後（US1/US2の成果を利用可能だが必須依存なし）
- Phase 6 → 目的とするUS完了後

### User Story Dependencies

- US1 (P1): Foundational後に開始可能、他USへの依存なし
- US2 (P2): Foundational後に開始可能、他USへの依存なし
- US3 (P3): Foundational後に開始可能、他USへの依存なし

### Within Each User Story

- テストを先に作成し失敗を確認してから実装
- データ処理（domain）→ 入出力（cli/services）→ UI の順で実装
- 依存タスク完了前に同一ファイルを編集しない

## Parallel Opportunities

- Phase 1: T003, T004, T005, T006 は並列可能
- Phase 2: T008, T009, T011, T014, T015 は並列可能
- US1: T016, T017, T018, T019 は並列可能、T020 と T021 も並列可能
- US2: T028, T029, T030 は並列可能、T031 と T032 は別担当で並列可能
- US3: T036 と T037、T038 と T039 は並列可能

## Parallel Example: US1

```bash
# 並列でテストを先行
Task T016: collector/tests/unit/aggregate.test.ts
Task T017: collector/tests/unit/extractRelatedIssues.test.ts
Task T018: collector/tests/integration/exportJson.integration.test.ts
Task T019: collector/tests/integration/collect.integration.test.ts

# 並列でドメイン実装
Task T020: collector/src/domain/extractRelatedIssues.ts
Task T021: collector/src/domain/aggregate.ts
```

## Implementation Strategy

### MVP First（US1のみ先行）

1. Phase 1 と Phase 2 を完了
2. Phase 3 (US1) を完了
3. US1の独立テストを実施しMVPとして評価

### Incremental Delivery

1. US1を提供して主要価値を実現
2. US2を追加しLocal First運用を安定化
3. US3を追加し評価資料向け分析を強化

### Parallel Team Strategy

1. 共通基盤（Phase 1/2）を合同で実装
2. US1/US2/US3 を担当分担して並列実装
3. Phase 6 で統合検証と配備設定を実施

## Notes

- [P] は並列実行可能タスクのみ付与
- [USx] ラベルはユーザーストーリーフェーズで必須
- すべてのタスクに実ファイルパスを記載
- 各ストーリーは独立実装・独立検証可能な単位で分割

# Implementation Plan: GitHub活動実績ローカルダッシュボード

**Branch**: `001-github-activity-dashboard` | **Date**: 2026-06-07 | **Spec**: /specs/001-github-activity-dashboard/spec.md

**Input**: Feature specification from `/specs/001-github-activity-dashboard/spec.md`

## Summary

GitHub Enterprise Cloud / 個人GitHubアカウントを対象に、複数リポジトリ横断の活動実績を集計し、
MBOや評価資料作成に活用できるLocal Firstダッシュボードを提供する。
実装は「収集（Node.js + gh CLI/GraphQL）」「表示（Vue3 + Vuetify + TypeScript + Vite）」「保存（JSON）」
に分離し、GitHub Pagesで静的ホスティングする。

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x, Vue 3
- Backend/Collector: Node.js 22 LTS

**Primary Dependencies**:
- Frontend: Vue 3, Vite, Vuetify 3, Material Design Icons
- Backend: GraphQL request client (or native fetch), zod（入力検証）, commander（CLI）
- Access: GitHub CLI (`gh`) + GraphQL API

**Storage**:
- ローカルJSONファイル（収集結果を永続化）

**Testing**:
- Frontend: Vitest + Vue Test Utils
- Backend: Vitest（ユニット + 統合）
- Data: JSONスキーマ検証テスト（出力データ妥当性確認）

**Target Platform**:
- 収集: ローカルPC（Linux/macOS/Windows）
- 表示: GitHub Pages で配信される静的サイト

**Project Type**:
- Web application + local collector（モノレポ）

**Performance Goals**:
- 100リポジトリ・31日範囲で、収集完了まで15分以内
- 保存済みJSON読み込み後、主要カード表示まで3秒以内

**Constraints**:
- 認証は gh CLI 利用（PAT入力UIを作らない）
- Local First（再可視化は保存データのみで実行可能）
- ログイン機能はスコープ外

**Scale/Scope**:
- 初期対象: 1ユーザー利用、最大100リポジトリ、1回の集計で最大50担当者

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Simplicity First: 提案設計は最小構成か。過度な抽象化や未使用レイヤーを含まないか。
- Maintainability: 責務分離、重複排除、変更影響の追跡可能性が担保されているか。
- Testability: コア集計ロジックのユニットテスト方針と、外部通信のモック境界が定義されているか。
- Local First: 取得データのローカル保存と、保存済みデータのみでの再集計フローが設計されているか。
- UX: データ取得・分析の操作手順が最小化され、複雑な設定導線を増やしていないか。

判定（Phase 0 前）:
- PASS: 収集/表示/保存を最小責務で分離している
- PASS: コア集計ロジックを pure 関数化しユニットテスト対象にしている
- PASS: Local First を仕様レベルで必須にしている
- PASS: 主要導線を「収集 → JSON保存 → 読み込み表示」の3手順に限定している

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── dataset-schema.json  # Phase 1 output (JSON schema)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
collector/
├── src/
│   ├── cli/
│   ├── github/
│   ├── domain/
│   └── output/
└── tests/
  ├── unit/
  └── integration/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── composables/
│   ├── services/
│   └── types/
└── tests/
  ├── unit/
  └── e2e/

scripts/
└── export-activity-json.sh

samples/
└── activity-dataset.sample.json
```

**Structure Decision**: Web application + local collector構成を採用。GitHub Pages制約に合わせ、
API常駐サーバは持たず、収集はローカルCLI、可視化は静的フロントエンドに分離する。

## 実行計画（ユーザー指定形式）

### 1) マイルストーン（フェーズ）一覧

- Phase 0: 技術検証と設計確定
- Phase 1: 収集基盤（Node.js + gh CLI/GraphQL）
- Phase 2: ローカルデータモデル/派生指標実装
- Phase 3: ダッシュボードUI（Vue3 + Vuetify）
- Phase 4: 受け入れ検証とGitHub Pages配備

### 2) 各フェーズのステップ（目的 / 作業内容 / Done条件 / 影響ファイル案）

#### Phase 0

Step P0-1
- 目的: 技術選定を固定し未決事項を解消する
- 作業内容: gh CLI利用方式、GraphQLクエリ方針、JSONスキーマ方針を確定
- Done条件: research.md に決定/根拠/代替案が記録される
- 影響ファイル案: specs/001-github-activity-dashboard/research.md

Step P0-2
- 目的: 実装単位を分割し責務境界を明確化する
- 作業内容: 収集・集計・表示・保存の境界設計、データモデル定義
- Done条件: data-model.md が完成し主要エンティティと検証ルールが定義される
- 影響ファイル案: specs/001-github-activity-dashboard/data-model.md

#### Phase 1

Step P1-1
- 目的: GitHubデータを取得する基盤を実装する
- 作業内容: ローカル実行スクリプトから gh CLI起動、GraphQLクエリ実行、ページング/エラー処理実装
- Done条件: シェルスクリプト実行で指定期間・複数repo・担当者の原データ取得が成功する
- 影響ファイル案: scripts/export-activity-json.sh, collector/src/github/client.ts, collector/src/github/queries.ts, collector/src/cli/collect.ts

Step P1-2
- 目的: Local Firstの保存経路を実装する
- 作業内容: 取得結果をJSONへ保存、バージョン付きスキーマ出力
- Done条件: 収集結果JSONを再読込可能な形式で保存できる
- 影響ファイル案: collector/src/output/datasetStore.ts, collector/src/output/readDataset.ts, samples/activity-dataset.sample.json

#### Phase 2

Step P2-1
- 目的: コア集計と派生指標を実装する
- 作業内容: PR/Commit/Review/変更量集計、レビュー率等の派生指標計算
- Done条件: サンプル入力に対して期待値どおりの結果を返す
- 影響ファイル案: collector/src/domain/aggregate.ts, collector/src/domain/metrics.ts, collector/tests/unit/metrics.test.ts

Step P2-2
- 目的: JSON入出力仕様を固定する
- 作業内容: フロントが利用するJSONスキーマを明文化し、出力結果を検証する
- Done条件: dataset-schema.json と実データが一致する
- 影響ファイル案: specs/001-github-activity-dashboard/dataset-schema.json

#### Phase 3

Step P3-1
- 目的: JSON読み込みからダッシュボード表示までの導線を実装する
- 作業内容: ファイル選択、データ読み込み、主要KPIカード・テーブル表示
- Done条件: 保存JSON読み込み後3秒以内に主要指標が表示される
- 影響ファイル案: frontend/src/pages/DashboardPage.vue, frontend/src/services/loadDataset.ts

Step P3-2
- 目的: 比較・分析のUXを整える
- 作業内容: 担当者別比較、フィルタ、エラー表示、空データ表示
- Done条件: 失敗時でも復帰可能なメッセージと再操作導線を提供できる
- 影響ファイル案: frontend/src/components/KpiCards.vue, frontend/src/components/ContributorTable.vue

#### Phase 4

Step P4-1
- 目的: AC準拠の検証を完了する
- 作業内容: ACトレーサビリティ確認、手動テスト、主要ユニットテスト実行、SC-004（評価資料準備時間）の事前/事後計測
- Done条件: AC全件PASS、重大不具合0件
- 影響ファイル案: specs/001-github-activity-dashboard/quickstart.md, specs/001-github-activity-dashboard/checklists/manual-test.md

Step P4-2
- 目的: GitHub Pages公開を完了する
- 作業内容: Vite build設定、base path調整、Pagesデプロイ手順化
- Done条件: Pages上でJSON読込表示まで再現できる
- 影響ファイル案: frontend/vite.config.ts, .github/workflows/deploy-pages.yml

### 3) 受け入れ条件との対応（Step → AC）

| Step | 対応AC |
|---|---|
| P1-1 | US1-AC1 |
| P1-2 | US2-AC1 |
| P2-1 | US1-AC1, US1-AC3, US3-AC1 |
| P2-2 | US2-AC1 |
| P3-1 | US2-AC1, US3-AC2 |
| P3-2 | US2-AC2 |
| P4-1 | US1-AC1〜3, US2-AC1〜2, US3-AC1〜2 |
| P4-2 | US2-AC1 |

### 4) 手動の動作確認チェックリスト

- gh CLIログイン済み状態で収集を実行し、JSONが出力される
- 期間/リポジトリ/担当者条件を変えて再収集できる
- PR本文の Fixes/Closes がIssue参照として表示される
- 作成PR数0件の担当者で派生指標が安全に表示される
- 保存済みJSONのみでオフライン表示ができる
- 不正JSON読込時に復旧ガイド付きエラーが表示される
- アクセス権なしrepoを含んでも収集可能分で継続できる
- Pages環境でJSON読込からダッシュボード表示まで完了する

### 5) リスク/未決事項（決めるべき順番つき）

1. GraphQLクエリの上限・レート制限対策（最優先）
2. リポジトリ横断時の取得戦略（逐次/並列・再試行ポリシー）
3. JSONスキーマのバージョニング方式（互換性維持）
4. Enterprise Cloudと個人アカウントの切替UX
5. Pages配備時のbase pathとローカルファイル読込制約

## Constitution Check (Post-Design)

- PASS: シンプルな2層構造（収集CLI + 静的UI）を維持
- PASS: 集計ロジックを domain 層へ集約し保守性を担保
- PASS: ユニットテスト対象をコア計算に集中
- PASS: Local First要件をJSON中心で充足
- PASS: ユーザー導線を「収集→読み込み→分析」に固定

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| なし | N/A | N/A |


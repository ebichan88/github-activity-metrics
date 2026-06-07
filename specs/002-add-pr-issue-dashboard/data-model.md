# Data Model: PR詳細表示とGitHub Project Issue実績ダッシュボード

## 1. Dataset（拡張）

- 説明: 1回の収集結果全体を表すトップレベルデータ。
- 既存フィールドは維持し、以下を追加する。

### 1.1 追加フィールド

- `issueMetrics`: IssueMetricsSummary

## 2. ContributorMetrics（拡張）

- 説明: 担当者単位のPR/Commit/Review集計結果。

### 2.1 追加フィールド

- `prDetails`: PrDetails

### 2.2 バリデーション

- `prDetails.createdPrNumbers` は重複なしの整数配列。
- `prDetails.mergedPrNumbers` は `createdPrNumbers` の部分集合である必要はない（他者PRのマージや運用差異を許容）。
- `prDetails.reviewedPrNumbers` は重複なしの整数配列。

## 3. PrDetails（新規）

- 説明: 担当者別にPR番号詳細を保持する。
- フィールド:
  - `createdPrNumbers`: number[]
  - `mergedPrNumbers`: number[]
  - `reviewedPrNumbers`: number[]
- 表示用途:
  - 担当者別実績のアコーディオン/モーダルに表示する根拠データ。

## 4. IssueMetricsSummary（新規）

- 説明: Issue実績ビュー全体の集計情報。
- フィールド:
  - `projectId`: string
  - `period`: Period
  - `contributors`: IssueContributorMetrics[]
  - `unassigned`: UnassignedIssueMetrics

## 5. IssueContributorMetrics（新規）

- 説明: 担当者別のDone issue集計。
- フィールド:
  - `login`: string
  - `doneCount`: number
  - `estimateTotal`: number
  - `estimateMissingCount`: number
  - `doneIssueNumbers`: number[]
- バリデーション:
  - `doneCount >= 0`
  - `estimateTotal >= 0`
  - `estimateMissingCount >= 0`
  - `doneIssueNumbers.length = doneCount`

## 6. UnassignedIssueMetrics（新規）

- 説明: 担当者未割り当てでDoneになったissueの補助集計。
- フィールド:
  - `doneCount`: number
  - `estimateTotal`: number
  - `estimateMissingCount`: number
  - `doneIssueNumbers`: number[]

## 7. ProjectIssueEvent（内部集計モデル）

- 説明: GitHub Project itemから抽出する内部イベント。
- フィールド:
  - `issueNumber`: number
  - `assignees`: string[]
  - `doneAt`: string (ISO8601)
  - `estimate`: number | null
  - `status`: string
- 用途:
  - collectorのdomain層で期間フィルタ・担当者別集計を行う入力。

## 8. 状態遷移（Issue収集ジョブ）

- `pending -> collecting_project_items -> aggregating -> completed`
- `pending -> collecting_project_items -> failed`
- `collecting_project_items -> partial_completed`（一部item取得失敗時）

## 9. 互換性ポリシー

- 既存Datasetフィールドは削除しない。
- 新規フィールドは追加のみとし、未対応UIは無視可能にする。
- `datasetVersion` は後方互換拡張として minor 更新する。

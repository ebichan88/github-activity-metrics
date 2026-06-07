# Data Model: GitHub活動実績ローカルダッシュボード

## 1. Dataset

- 説明: 1回の収集結果全体を表すトップレベルエンティティ。
- フィールド:
  - datasetVersion: string（例: 1.0.0）
  - generatedAt: string（ISO8601）
  - sourceType: enum（enterprise-cloud, personal）
  - period: Period
  - repositories: RepositoryRef[]
  - contributors: ContributorMetrics[]
  - warnings: Warning[]
- バリデーション:
  - datasetVersion は必須。
  - contributors は0件以上。
  - period.from <= period.to。

## 2. Period

- 説明: 集計対象期間。
- フィールド:
  - from: string（YYYY-MM-DD）
  - to: string（YYYY-MM-DD）
- バリデーション:
  - from, to は日付文字列。
  - from <= to。

## 3. RepositoryRef

- 説明: 集計対象リポジトリ参照。
- フィールド:
  - owner: string
  - name: string
  - visibility: enum（public, private, internal）

## 4. ContributorMetrics

- 説明: 担当者単位の集計結果。
- フィールド:
  - login: string
  - prs: PrMetrics
  - commits: CommitMetrics
  - reviews: ReviewMetrics
  - derived: DerivedMetrics
- バリデーション:
  - login は必須。
  - すべての件数フィールドは 0 以上の整数。

## 5. PrMetrics

- フィールド:
  - createdCount: number
  - closedCount: number
  - mergedCount: number
  - relatedIssues: RelatedIssueLink[]

## 6. RelatedIssueLink

- フィールド:
  - prNumber: number
  - repository: string（owner/name）
  - issueRef: string（例: #123）
  - keyword: enum（Fixes, Closes, Resolved）

## 7. CommitMetrics

- フィールド:
  - commitCount: number
  - additions: number
  - deletions: number

## 8. ReviewMetrics

- フィールド:
  - reviewedPrCount: number
  - reviewCommentCount: number

## 9. DerivedMetrics

- フィールド:
  - reviewRate: number | null
  - averagePrSize: number | null
  - averageReviewComments: number | null
  - mergeRate: number | null
- 計算式:
  - reviewRate = reviewedPrCount / createdCount
  - averagePrSize = (additions + deletions) / createdCount
  - averageReviewComments = reviewCommentCount / reviewedPrCount
  - mergeRate = mergedCount / createdCount
- ゼロ除算ルール:
  - 分母が0の場合は null を返す。

## 10. Warning

- 説明: 非致命エラーや取得不完全の通知。
- フィールド:
  - code: string
  - message: string
  - repository?: string
  - contributor?: string

## 状態遷移（収集ジョブ）

- pending -> collecting -> completed
- pending -> collecting -> failed
- collecting -> partial_completed（取得不可repoがあるが継続可能な場合）

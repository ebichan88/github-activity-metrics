/**
 * GitHub GraphQL クエリ定義
 * 各クエリは100件ずつページング取得する設計
 *
 * 契約同期元:
 * - specs/001-add-pr-issue-dashboard/contracts/github-project-issues.graphql
 * 仕様変更時は上記契約を先に更新し、このファイルへ反映する。
 */

/**
 * 指定条件に合致する PR を検索するクエリ
 * search API を利用し、author/repo/期間でフィルタする
 */
export const SEARCH_PULL_REQUESTS_QUERY = `
  query SearchPullRequests($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      nodes {
        ... on PullRequest {
          number
          state
          createdAt
          mergedAt
          closedAt
          body
          additions
          deletions
          repository {
            owner { login }
            name
            visibility
          }
          reviews(first: 100) {
            nodes {
              author { login }
              comments(first: 1) {
                totalCount
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * 指定ユーザーがレビューした PR を検索するクエリ
 * reviewed-by: フィルタを使用する
 */
export const SEARCH_REVIEWED_PRS_QUERY = `
  query SearchReviewedPRs($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      nodes {
        ... on PullRequest {
          number
          repository {
            owner { login }
            name
          }
          reviews(first: 100) {
            nodes {
              author { login }
              comments(first: 1) {
                totalCount
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * リポジトリのデフォルトブランチのコミット履歴を取得するクエリ
 * since/until で期間を絞り込み、JS側でさらに author.login によるフィルタを行う
 */
export const GET_COMMITS_QUERY = `
  query GetCommits(
    $owner: String!
    $repo: String!
    $since: GitTimestamp!
    $until: GitTimestamp!
    $cursor: String
  ) {
    repository(owner: $owner, name: $repo) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(since: $since, until: $until, first: 100, after: $cursor) {
              nodes {
                oid
                committedDate
                additions
                deletions
                author {
                  user {
                    login
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * GitHub Project の Issue item を取得するクエリ
 * organization / user のどちらの owner でも解決できるよう両方を問い合わせる
 */
export const GET_PROJECT_ISSUES_QUERY = `
  query ProjectIssuesForDoneMetrics(
    $owner: String!
    $projectNumber: Int!
    $first: Int!
    $after: String
  ) {
    organization(login: $owner) {
      projectV2(number: $projectNumber) {
        id
        title
        items(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            content {
              ... on Issue {
                number
                title
                url
                closedAt
                assignees(first: 20) {
                  nodes {
                    login
                  }
                }
              }
            }
            fieldValues(first: 50) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                }
              }
            }
            updatedAt
          }
        }
      }
    }
    user(login: $owner) {
      projectV2(number: $projectNumber) {
        id
        title
        items(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            content {
              ... on Issue {
                number
                title
                url
                closedAt
                assignees(first: 20) {
                  nodes {
                    login
                  }
                }
              }
            }
            fieldValues(first: 50) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                }
              }
            }
            updatedAt
          }
        }
      }
    }
  }
`;

/**
 * PR author 用の検索クエリ文字列を構築する
 */
export function buildPrAuthorSearchQuery(params: {
  login: string;
  repoFullName: string;
  from: string;
  to: string;
}): string {
  return `type:pr author:${params.login} repo:${params.repoFullName} created:${params.from}..${params.to}`;
}

/**
 * PR reviewer 用の検索クエリ文字列を構築する
 */
export function buildPrReviewerSearchQuery(params: {
  login: string;
  repoFullName: string;
  from: string;
  to: string;
}): string {
  return `type:pr reviewed-by:${params.login} repo:${params.repoFullName} created:${params.from}..${params.to}`;
}

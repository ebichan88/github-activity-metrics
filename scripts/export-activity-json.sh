#!/usr/bin/env bash
set -euo pipefail

# ローカルでGitHubデータを収集し、JSONを出力するラッパースクリプト
# 実処理は collector 側の CLI に委譲する

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "[error] gh CLI が見つかりません。インストールしてください。" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "[error] gh CLI で認証されていません。先に 'gh auth login' を実行してください。" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[error] pnpm が見つかりません。インストールしてください。" >&2
  exit 1
fi

if [[ $# -eq 0 ]] || [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage:
  ./scripts/export-activity-json.sh \
    --from 2026-05-01 --to 2026-05-31 \
    --repos org/repo-a,org/repo-b \
    --contributors user1,user2 \
    --out ./data/activity-2026-05.json

  # GitHub Project issue 集計（Done件数 / Estimate合計）
  ./scripts/export-activity-json.sh \
    --from 2026-05-01 --to 2026-05-31 \
    --project-owner your-org \
    --project-number 12 \
    --out ./data/activity-issue-2026-05.json

Options:
  --from <YYYY-MM-DD>           集計期間の開始日（必須）
  --to <YYYY-MM-DD>             集計期間の終了日（必須）
  --repos <owner/repo,...>      対象リポジトリ（PR/Commit/Review集計時に利用）
  --contributors <login,...>    対象担当者（PR/Commit/Review集計時に利用）
  --project-owner <org-login>   GitHub Projectのオーナー（Issue集計時に利用）
  --project-number <number>     GitHub Project番号（Issue集計時に利用）
  --out <path>                  出力JSONファイルパス（必須）
  -h, --help                    このヘルプを表示
USAGE
  if [[ $# -eq 0 ]]; then
    exit 1
  fi
  exit 0
fi

ARGS=("$@")
for i in "${!ARGS[@]}"; do
  if [[ "${ARGS[$i]}" == "--out" ]]; then
    next_index=$((i + 1))
    if [[ ${next_index} -lt ${#ARGS[@]} ]]; then
      out_path="${ARGS[$next_index]}"
      if [[ "${out_path}" != /* ]]; then
        ARGS[$next_index]="${REPO_ROOT}/${out_path#./}"
      fi
    fi
    break
  fi
done

cd "${REPO_ROOT}"
pnpm collector:run "${ARGS[@]}"

#!/usr/bin/env bash
set -euo pipefail

# ローカルでGitHubデータを収集し、JSONを出力するラッパースクリプト
# 実処理は collector 側の CLI に委譲する

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

if [[ $# -eq 0 ]]; then
  cat <<'USAGE'
Usage:
  ./scripts/export-activity-json.sh \
    --from 2026-05-01 --to 2026-05-31 \
    --repos org/repo-a,org/repo-b \
    --contributors user1,user2 \
    --out ./data/activity-2026-05.json
USAGE
  exit 1
fi

pnpm collector:run "$@"

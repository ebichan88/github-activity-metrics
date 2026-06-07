#!/usr/bin/env bash
set -euo pipefail

# SC-004 判定用: 評価資料準備時間の計測スクリプト
# 使い方:
#   ./scripts/measure-report-prep-time.sh start        # タイマー開始
#   ./scripts/measure-report-prep-time.sh stop         # タイマー停止・結果表示
#   ./scripts/measure-report-prep-time.sh status       # 現在の経過時間
#   ./scripts/measure-report-prep-time.sh reset        # 状態リセット

TIMER_FILE="${HOME}/.github-activity-metrics-timer"

cmd="${1:-}"

case "$cmd" in
  start)
    if [[ -f "$TIMER_FILE" ]]; then
      echo "[warn] 既にタイマーが開始されています。'stop' で停止するか 'reset' でリセットしてください。"
      exit 1
    fi
    date +%s > "$TIMER_FILE"
    echo "[info] タイマーを開始しました。作業が終わったら './scripts/measure-report-prep-time.sh stop' を実行してください。"
    ;;

  stop)
    if [[ ! -f "$TIMER_FILE" ]]; then
      echo "[error] タイマーが開始されていません。先に 'start' を実行してください。"
      exit 1
    fi
    start_time=$(cat "$TIMER_FILE")
    end_time=$(date +%s)
    elapsed_sec=$(( end_time - start_time ))
    elapsed_min=$(echo "scale=1; $elapsed_sec / 60" | bc)
    rm -f "$TIMER_FILE"
    echo "[info] 所要時間: ${elapsed_min} 分 (${elapsed_sec} 秒)"
    echo ""
    echo "この時間を checklists/reporting-time-benchmark.md の計測表に記録してください。"
    ;;

  status)
    if [[ ! -f "$TIMER_FILE" ]]; then
      echo "[info] タイマーは開始されていません。"
      exit 0
    fi
    start_time=$(cat "$TIMER_FILE")
    now=$(date +%s)
    elapsed_sec=$(( now - start_time ))
    elapsed_min=$(echo "scale=1; $elapsed_sec / 60" | bc)
    echo "[info] 経過時間: ${elapsed_min} 分 (${elapsed_sec} 秒)"
    ;;

  reset)
    rm -f "$TIMER_FILE"
    echo "[info] タイマーをリセットしました。"
    ;;

  *)
    cat <<'USAGE'
使い方:
  ./scripts/measure-report-prep-time.sh start    # 作業開始時にタイマー開始
  ./scripts/measure-report-prep-time.sh stop     # 作業完了時にタイマー停止・結果表示
  ./scripts/measure-report-prep-time.sh status   # 現在の経過時間確認
  ./scripts/measure-report-prep-time.sh reset    # タイマーリセット

目的: SC-004（評価資料準備時間50%削減）の計測
詳細: specs/001-github-activity-dashboard/checklists/reporting-time-benchmark.md
USAGE
    exit 1
    ;;
esac

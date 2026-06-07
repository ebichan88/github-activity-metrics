# 手動確認チェックリスト

- [ ] `./scripts/export-activity-json.sh --help` で `--project-owner` / `--project-number` が表示される
- [ ] PRのみ収集（Project指定なし）でJSON出力できる
- [ ] Issue収集（Project指定あり）で `issueMetrics` を含むJSONを出力できる
- [ ] GitHub Pages またはローカル画面で `JSON読込` ボタンからJSONを読み込める
- [ ] `PR実績` メニューでKPI・担当者テーブルを表示できる
- [ ] PR指標セルからPR番号詳細（created/merged/reviewed）を開ける
- [ ] `Issue実績` メニューでDone件数/Estimate合計/Estimate未設定件数を表示できる
- [ ] `issueMetrics` が無いJSONを読み込んだ場合に未収集メッセージが表示される
- [ ] PR実績0件データでも画面が異常終了せず表示継続する
- [ ] Issue実績0件データでも画面が異常終了せず表示継続する

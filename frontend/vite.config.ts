import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// GitHub Pages 配備時のベースパス
// GITHUB_PAGES=true の環境変数がある場合はリポジトリ名をベースパスに設定
const base = process.env['GITHUB_PAGES'] === 'true'
  ? '/github-activity-metrics/'
  : '/';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  base,
  build: {
    outDir: 'dist',
    // ローカルファイル読み込み（File API）は静的ビルドで動作する
    target: 'es2022',
  },
});

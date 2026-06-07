// ESLint 設定（CommonJS形式）
// Node.js 22 / TypeScript 5.x / Vue 3 共通ルール

/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    env: {
        es2022: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ],
    rules: {
        // 未使用変数は警告（アンダースコアプレフィックスは除外）
        "@typescript-eslint/no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        // any型の使用は警告
        "@typescript-eslint/no-explicit-any": "warn",
        // console.logは警告
        "no-console": "warn",
    },
    overrides: [
        {
            // Vue ファイル
            files: ["*.vue"],
            parser: "vue-eslint-parser",
            parserOptions: {
                parser: "@typescript-eslint/parser",
            },
            extends: ["plugin:vue/vue3-recommended"],
        },
        {
            // テストファイル
            files: ["**/*.test.ts", "**/*.spec.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": "off",
            },
        },
    ],
};

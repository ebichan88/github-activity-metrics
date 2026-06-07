<template>
  <!-- 担当者別実績テーブル -->
  <v-data-table
    :headers="headers"
    :items="contributors"
    item-value="login"
    density="comfortable"
    class="elevation-1"
  >
    <!-- ヘッダーカスタマイズ -->
    <template #top>
      <v-toolbar flat>
        <v-toolbar-title>担当者別実績</v-toolbar-title>
      </v-toolbar>
    </template>

    <!-- login セル -->
    <template #[`item.login`]="{ item }">
      <v-chip label size="small">{{ item.login }}</v-chip>
    </template>

    <!-- mergeRate セル：'-' を薄く表示 -->
    <template #[`item.mergeRate`]="{ item }">
      <span :class="item.mergeRate === '-' ? 'text-medium-emphasis' : ''">
        {{ item.mergeRate }}
      </span>
    </template>

    <!-- reviewRate セル -->
    <template #[`item.reviewRate`]="{ item }">
      <span :class="item.reviewRate === '-' ? 'text-medium-emphasis' : ''">
        {{ item.reviewRate }}
      </span>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import type { ContributorRow } from '../services/toDashboardViewModel.js';

defineProps<{
  contributors: ContributorRow[];
}>();

const headers = [
  { title: 'ログイン', key: 'login', sortable: true },
  { title: 'PR作成', key: 'prCreated', sortable: true },
  { title: 'PRマージ', key: 'prMerged', sortable: true },
  { title: 'マージ率', key: 'mergeRate', sortable: false },
  { title: 'コミット', key: 'commits', sortable: true },
  { title: '+追加', key: 'additions', sortable: true },
  { title: '-削除', key: 'deletions', sortable: true },
  { title: 'レビュー', key: 'reviewedPrs', sortable: true },
  { title: 'レビュー率', key: 'reviewRate', sortable: false },
  { title: 'Issue参照', key: 'relatedIssueCount', sortable: true },
];
</script>

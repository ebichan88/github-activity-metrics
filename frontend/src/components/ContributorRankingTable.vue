<template>
  <!-- 担当者ランキングテーブル（比較・評価資料向け） -->
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <v-icon icon="mdi-podium" class="mr-2" />
      担当者ランキング
      <v-spacer />
      <!-- ソートキー切替 -->
      <v-btn-toggle
        v-model="activeSortKey"
        density="compact"
        variant="outlined"
        size="small"
        mandatory
      >
        <v-btn value="prCreated">PR作成</v-btn>
        <v-btn value="commits">コミット</v-btn>
        <v-btn value="reviewedPrs">レビュー</v-btn>
      </v-btn-toggle>
    </v-card-title>

    <!-- 検索フィールド -->
    <v-card-text class="pb-0">
      <v-text-field
        v-model="searchText"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        placeholder="ログイン名で絞り込み"
        clearable
        hide-details
        variant="outlined"
      />
    </v-card-text>

    <v-list density="compact">
      <v-list-item
        v-for="(row, idx) in sortedAndFiltered"
        :key="row.login"
        :subtitle="`PR ${row.prCreated}件 / コミット ${row.commits}件 / レビュー ${row.reviewedPrs}件`"
      >
        <template #prepend>
          <v-avatar size="28" color="primary" class="mr-2 text-caption font-weight-bold">
            {{ idx + 1 }}
          </v-avatar>
        </template>
        <template #title>
          <span class="font-weight-medium">{{ row.login }}</span>
        </template>
      </v-list-item>

      <v-list-item v-if="sortedAndFiltered.length === 0">
        <v-list-item-title class="text-medium-emphasis text-body-2">
          該当する担当者がいません
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useContributorFilters } from '../composables/useContributorFilters.js';
import type { ContributorRow } from '../services/toDashboardViewModel.js';

const props = defineProps<{
  contributors: ContributorRow[];
}>();

const { sortedAndFiltered, setSortKey, setSortOrder, setSearchQuery, updateRows } =
  useContributorFilters(props.contributors);

const activeSortKey = ref<'prCreated' | 'commits' | 'reviewedPrs'>('prCreated');
const searchText = ref('');

watch(activeSortKey, (key) => {
  setSortKey(key);
  setSortOrder('desc');
});

watch(searchText, (q) => {
  setSearchQuery(q ?? '');
});

watch(
  () => props.contributors,
  (newRows) => updateRows(newRows),
  { deep: true }
);

// 初期ソート設定
setSortKey('prCreated');
setSortOrder('desc');
</script>

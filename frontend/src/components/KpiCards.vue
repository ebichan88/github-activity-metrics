<template>
  <!-- 主要 KPI カード群 -->
  <v-row>
    <v-col v-for="card in cards" :key="card.label" cols="12" sm="6" md="4">
      <v-card variant="outlined">
        <v-card-text class="text-center">
          <v-icon :icon="card.icon" size="32" color="primary" class="mb-2" />
          <div class="text-h5 font-weight-bold">{{ card.value }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ card.label }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KpiSummary } from '../services/toDashboardViewModel.js';

const props = defineProps<{
  kpi: KpiSummary;
}>();

const cards = computed(() => [
  {
    label: 'PR作成数',
    value: props.kpi.totalPrCreated,
    icon: 'mdi-source-pull',
  },
  {
    label: 'PRマージ数',
    value: props.kpi.totalPrMerged,
    icon: 'mdi-source-merge',
  },
  {
    label: 'コミット数',
    value: props.kpi.totalCommits,
    icon: 'mdi-source-commit',
  },
  {
    label: 'レビュー数',
    value: props.kpi.totalReviews,
    icon: 'mdi-eye-check-outline',
  },
  {
    label: '追加行数',
    value: `+${props.kpi.totalAdditions.toLocaleString()}`,
    icon: 'mdi-plus-circle-outline',
  },
  {
    label: '削除行数',
    value: `-${props.kpi.totalDeletions.toLocaleString()}`,
    icon: 'mdi-minus-circle-outline',
  },
]);
</script>

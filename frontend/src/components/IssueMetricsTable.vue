<template>
  <section class="issue-metrics-table">
    <h2 class="text-h6 mb-3">Issue実績</h2>
    <table class="issue-table">
      <thead>
        <tr>
          <th>担当者</th>
          <th>Done件数</th>
          <th>Estimate合計</th>
          <th>Estimate未設定</th>
          <th>Done issue番号</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.login">
          <td>{{ row.isUnassigned ? '未割り当て' : (row.displayLogin || row.login) }}</td>
          <td>{{ row.doneCount }}</td>
          <td>{{ row.estimateTotal }}</td>
          <td>{{ row.estimateMissingCount }}</td>
          <td>{{ formatIssueNumbers(row.doneIssueNumbers) }}</td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="5" class="empty">期間内に Done issue はありません</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { IssueContributorRow } from '../services/toDashboardViewModel.js';

defineProps<{
  rows: IssueContributorRow[];
}>();

function formatIssueNumbers(issueNumbers: number[]): string {
  if (issueNumbers.length === 0) {
    return '-';
  }

  return issueNumbers.map((issueNumber) => `#${issueNumber}`).join(', ');
}
</script>

<style scoped>
.issue-table {
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--v-theme-surface));
}

.issue-table th,
.issue-table td {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 12px;
  text-align: left;
}

.issue-table th {
  background: rgba(var(--v-theme-primary), 0.08);
}

.empty {
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}
</style>

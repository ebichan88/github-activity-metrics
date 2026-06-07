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
          <td>
            <button
              v-if="row.doneIssues.length > 0"
              class="detail-btn"
              @click="openModal(row)"
            >
              詳細
            </button>
            <span v-else>-</span>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="5" class="empty">期間内に Done issue はありません</td>
        </tr>
      </tbody>
    </table>

    <!-- Done issue 詳細モーダル -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="modalTitle">
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button class="modal-close" aria-label="閉じる" @click="closeModal">✕</button>
        </div>
        <ul class="issue-list">
          <li v-for="issue in modalIssues" :key="issue.number">
            <a
              :href="issue.url"
              target="_blank"
              rel="noopener noreferrer"
              class="issue-link"
            >
              #{{ issue.number }}: {{ issue.title }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { IssueContributorRow } from '../services/toDashboardViewModel.js';
import type { DoneIssueItem } from '../types/dataset.js';

defineProps<{
  rows: IssueContributorRow[];
}>();

const modalVisible = ref(false);
const modalTitle = ref('');
const modalIssues = ref<DoneIssueItem[]>([]);

function openModal(row: IssueContributorRow): void {
  modalTitle.value = `${row.isUnassigned ? '未割り当て' : (row.displayLogin || row.login)} の Done issue 一覧`;
  modalIssues.value = row.doneIssues;
  modalVisible.value = true;
}

function closeModal(): void {
  modalVisible.value = false;
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

.detail-btn {
  padding: 4px 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.6);
  border-radius: 4px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.detail-btn:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* モーダル */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 24px;
  min-width: 360px;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: rgba(0, 0, 0, 0.6);
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: rgba(0, 0, 0, 0.87);
}

.issue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  word-break: break-all;
}

.issue-link:hover {
  text-decoration: underline;
}
</style>

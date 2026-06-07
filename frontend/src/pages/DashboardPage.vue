<template>
  <v-container max-width="1200">
    <input
      ref="fileInputRef"
      data-testid="json-file-input"
      type="file"
      accept=".json"
      class="d-none"
      @change="onFileChange"
    />

    <!-- ページタイトル -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon icon="mdi-chart-bar" class="mr-2" />
          GitHub 活動実績ダッシュボード
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          収集ツールで生成した JSON ファイルを読み込んで活動実績を表示します
        </p>
      </v-col>
    </v-row>

    <!-- エラーバナー -->
    <v-row v-if="error">
      <v-col>
        <ErrorStateBanner
          :message="error"
          action-label="JSON読込"
          @close="reset"
          @retry="openFilePicker"
        />
      </v-col>
    </v-row>

    <!-- ファイル選択（データ未読込時） -->
    <template v-if="!viewModel && !isLoading">
      <v-row justify="center">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-6 text-center">
            <v-icon icon="mdi-file-upload-outline" size="64" color="primary" class="mb-4" />
            <div class="text-h6 mb-2">データセット JSON を選択</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              scripts/export-activity-json.sh で生成した JSON ファイルを指定してください
            </div>
            <v-btn
              data-testid="json-load-button"
              color="primary"
              prepend-icon="mdi-folder-open"
              @click="openFilePicker"
            >
              JSON読込
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- ローディング -->
    <v-row v-else-if="isLoading" justify="center" class="mt-8">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary" size="48" />
        <div class="mt-2 text-body-2">読み込み中...</div>
      </v-col>
    </v-row>

    <!-- ダッシュボード本体 -->
    <template v-else-if="viewModel">
      <!-- ヘッダー情報 -->
      <v-row class="mb-2">
        <v-col class="d-flex flex-wrap align-center ga-2">
          <v-chip prepend-icon="mdi-calendar-range" size="small">
            {{ viewModel.period.from }} ～ {{ viewModel.period.to }}
          </v-chip>
          <v-chip prepend-icon="mdi-account-group" size="small">
            {{ viewModel.kpi.contributorCount }}名
          </v-chip>
          <v-chip v-if="activeView === 'issue' && viewModel.issueMetrics" prepend-icon="mdi-view-dashboard" size="small">
            {{ viewModel.issueMetrics.projectId }}
          </v-chip>
          <v-btn
            data-testid="json-load-button"
            variant="text"
            size="small"
            prepend-icon="mdi-file-replace-outline"
            @click="openFilePicker"
          >
            JSON読込
          </v-btn>
        </v-col>
      </v-row>

      <v-row class="mb-4">
        <v-col>
          <div class="text-subtitle-2 mb-2">表示メニュー</div>
          <div class="text-body-2 text-medium-emphasis mb-2">PR分析とIssue分析を切り替えて確認できます</div>
          <div class="d-flex ga-2">
            <v-btn
              data-testid="menu-pr"
              :variant="activeView === 'pr' ? 'flat' : 'outlined'"
              color="primary"
              @click="activeView = 'pr'"
            >
            PR実績
            </v-btn>
            <v-btn
              data-testid="menu-issue"
              :variant="activeView === 'issue' ? 'flat' : 'outlined'"
              color="primary"
              @click="activeView = 'issue'"
            >
            Issue実績
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- 警告バナー -->
      <v-row v-if="viewModel.hasWarnings" class="mb-2">
        <v-col>
          <v-alert type="warning" variant="tonal" density="compact">
            {{ viewModel.warningCount }}件の警告があります。一部データが欠損している可能性があります。
          </v-alert>
        </v-col>
      </v-row>

      <template v-if="activeView === 'pr'">
        <!-- KPI カード -->
        <v-row class="mb-4">
          <v-col>
            <KpiCards :kpi="viewModel.kpi" />
          </v-col>
        </v-row>

        <!-- 担当者テーブル -->
        <v-row>
          <v-col>
            <ContributorTable
              :contributors="viewModel.contributors"
              @show-pr-details="onShowPrDetails"
            />
          </v-col>
        </v-row>

        <v-dialog v-model="prDetailsDialog" max-width="640">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>PR番号詳細</span>
              <v-btn icon="mdi-close" variant="text" @click="prDetailsDialog = false" />
            </v-card-title>
            <v-card-text v-if="selectedContributor">
              <PrDetailsAccordion
                :details="selectedContributor.prDetails"
                :initial-open="initialOpenSection"
              />
            </v-card-text>
          </v-card>
        </v-dialog>
      </template>

      <template v-else>
        <v-row v-if="!viewModel.issueMetrics">
          <v-col>
            <ErrorStateBanner
              title="Issue 実績は未収集です"
              message="このJSONには issueMetrics が含まれていません。GitHub Project を指定して再収集したJSONを読み込んでください。"
              type="info"
              action-label="JSON読込"
              @close="activeView = 'pr'"
              @retry="openFilePicker"
            />
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col>
            <IssueMetricsTable :rows="viewModel.issueMetrics.rows" />
          </v-col>
        </v-row>
      </template>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDatasetLoader } from '../composables/useDatasetLoader.js';
import ContributorTable from '../components/ContributorTable.vue';
import ErrorStateBanner from '../components/ErrorStateBanner.vue';
import IssueMetricsTable from '../components/IssueMetricsTable.vue';
import KpiCards from '../components/KpiCards.vue';
import PrDetailsAccordion from '../components/PrDetailsAccordion.vue';
import type { ContributorRow } from '../services/toDashboardViewModel.js';

const { viewModel, isLoading, error, onFileSelected, reset } = useDatasetLoader();
const fileInputRef = ref<HTMLInputElement | null>(null);
const prDetailsDialog = ref(false);
const selectedContributor = ref<ContributorRow | null>(null);
const initialOpenSection = ref<'created' | 'merged' | 'reviewed'>('created');
const activeView = ref<'pr' | 'issue'>('pr');

function openFilePicker(): void {
  fileInputRef.value?.click();
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await onFileSelected(file);
  input.value = '';
}

function onShowPrDetails(payload: {
  contributor: ContributorRow;
  kind: 'created' | 'merged' | 'reviewed';
}): void {
  selectedContributor.value = payload.contributor;
  initialOpenSection.value = payload.kind;
  prDetailsDialog.value = true;
}
</script>

<template>
  <v-container max-width="1200">
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
          @close="reset"
          @retry="reset"
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
              <code>scripts/export-activity-json.sh</code> で生成した JSON ファイルを指定してください
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-folder-open"
              @click="openFilePicker"
            >
              ファイルを開く
            </v-btn>
            <!-- 非表示ファイル入力（ログイン機能は提供しない） -->
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              class="d-none"
              @change="onFileChange"
            />
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
        <v-col>
          <v-chip class="mr-2" prepend-icon="mdi-calendar-range" size="small">
            {{ viewModel.period.from }} ～ {{ viewModel.period.to }}
          </v-chip>
          <v-chip prepend-icon="mdi-account-group" size="small">
            {{ viewModel.kpi.contributorCount }}名
          </v-chip>
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-file-replace-outline"
            class="ml-2"
            @click="reset"
          >
            ファイルを変更
          </v-btn>
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

      <!-- KPI カード -->
      <v-row class="mb-4">
        <v-col>
          <KpiCards :kpi="viewModel.kpi" />
        </v-col>
      </v-row>

      <!-- 担当者テーブル -->
      <v-row>
        <v-col>
          <ContributorTable :contributors="viewModel.contributors" />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDatasetLoader } from '../composables/useDatasetLoader.js';
import KpiCards from '../components/KpiCards.vue';
import ContributorTable from '../components/ContributorTable.vue';
import ErrorStateBanner from '../components/ErrorStateBanner.vue';

const { viewModel, isLoading, error, onFileSelected, reset } = useDatasetLoader();
const fileInputRef = ref<HTMLInputElement | null>(null);

function openFilePicker(): void {
  fileInputRef.value?.click();
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await onFileSelected(file);
  // 同一ファイルを再選択できるようにリセット
  input.value = '';
}
</script>

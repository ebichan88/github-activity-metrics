import { ref } from 'vue';
import { loadDataset, DatasetLoadError } from '../services/loadDataset.js';
import { toDashboardViewModel, type DashboardViewModel } from '../services/toDashboardViewModel.js';

/** データセット読み込み Composable */
export function useDatasetLoader() {
  const viewModel = ref<DashboardViewModel | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function onFileSelected(file: File): Promise<void> {
    isLoading.value = true;
    error.value = null;
    viewModel.value = null;

    try {
      const dataset = await loadDataset(file);
      viewModel.value = toDashboardViewModel(dataset);
    } catch (err: unknown) {
      if (err instanceof DatasetLoadError) {
        error.value = err.message;
      } else {
        error.value = '予期しないエラーが発生しました。もう一度お試しください。';
      }
    } finally {
      isLoading.value = false;
    }
  }

  function reset(): void {
    viewModel.value = null;
    error.value = null;
  }

  return { viewModel, isLoading, error, onFileSelected, reset };
}

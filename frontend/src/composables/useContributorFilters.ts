import { ref, computed, type Ref } from 'vue';
import type { ContributorRow } from '../services/toDashboardViewModel.js';

type SortKey = keyof ContributorRow;
type SortOrder = 'asc' | 'desc';

/**
 * 担当者一覧のソート・フィルタ Composable
 */
export function useContributorFilters(initialRows: ContributorRow[]) {
  const rows: Ref<ContributorRow[]> = ref(initialRows);
  const sortKey = ref<SortKey>('prCreated');
  const sortOrder = ref<SortOrder>('desc');
  const searchQuery = ref('');

  const sortedAndFiltered = computed<ContributorRow[]>(() => {
    let result = rows.value;

    // ログイン名フィルタ
    const query = searchQuery.value.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => r.login.toLowerCase().includes(query));
    }

    // ソート
    const key = sortKey.value;
    const order = sortOrder.value;
    result = [...result].sort((a, b) => {
      const va = a[key];
      const vb = b[key];

      if (typeof va === 'number' && typeof vb === 'number') {
        return order === 'asc' ? va - vb : vb - va;
      }

      const sa = String(va);
      const sb = String(vb);
      if (sa < sb) return order === 'asc' ? -1 : 1;
      if (sa > sb) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  function setSortKey(key: SortKey): void {
    sortKey.value = key;
  }

  function setSortOrder(order: SortOrder): void {
    sortOrder.value = order;
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  function updateRows(newRows: ContributorRow[]): void {
    rows.value = newRows;
  }

  return {
    sortedAndFiltered,
    sortKey,
    sortOrder,
    searchQuery,
    setSortKey,
    setSortOrder,
    setSearchQuery,
    updateRows,
  };
}

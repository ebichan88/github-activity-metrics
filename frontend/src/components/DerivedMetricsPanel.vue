<template>
  <!-- 派生指標パネル（評価資料向け分析） -->
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1">
      <v-icon icon="mdi-calculator-variant-outline" class="mr-2" />
      派生指標サマリー
    </v-card-title>
    <v-card-text>
      <v-table density="compact">
        <thead>
          <tr>
            <th>ログイン</th>
            <th class="text-right">マージ率</th>
            <th class="text-right">平均PRサイズ</th>
            <th class="text-right">平均レビューコメント</th>
            <th class="text-right">レビュー率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in contributors" :key="row.login">
            <td>
              <v-chip label size="small">{{ row.login }}</v-chip>
            </td>
            <td class="text-right">
              <NullableValue :value="row.mergeRate" />
            </td>
            <td class="text-right">
              <NullableValue :value="row.averagePrSize" suffix=" lines" />
            </td>
            <td class="text-right">
              <NullableValue :value="row.averageReviewComments" />
            </td>
            <td class="text-right">
              <NullableValue :value="row.reviewRate" />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue';

export interface DerivedRow {
  login: string;
  mergeRate: string;
  averagePrSize: number | null;
  averageReviewComments: string;
  reviewRate: string;
}

defineProps<{
  contributors: DerivedRow[];
}>();

/** null / '-' 値を薄く表示するインラインコンポーネント */
const NullableValue = defineComponent({
  props: {
    value: { type: [String, Number, null] as unknown as () => string | number | null },
    suffix: { type: String, default: '' },
  },
  setup(props) {
    return () => {
      const val = props.value;
      if (val === null || val === '-') {
        return h('span', { class: 'text-medium-emphasis' }, '-');
      }
      return h('span', {}, `${String(val)}${props.suffix}`);
    };
  },
});
</script>

<template>
  <div class="pr-details-accordion">
    <details v-for="section in sections" :key="section.key" :open="section.key === initialOpen">
      <summary>
        {{ section.label }} ({{ section.numbers.length }})
      </summary>
      <ul v-if="section.numbers.length > 0" class="mt-2">
        <li v-for="prNumber in section.numbers" :key="`${section.key}-${prNumber}`">
          #{{ prNumber }}
        </li>
      </ul>
      <div v-else class="text-body-2 text-medium-emphasis mt-2">
        対象PRはありません
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  details: {
    createdPrNumbers: number[];
    mergedPrNumbers: number[];
    reviewedPrNumbers: number[];
  };
  initialOpen?: 'created' | 'merged' | 'reviewed';
}>(), {
  initialOpen: 'created',
});

const sections = computed(() => [
  {
    key: 'created',
    label: '作成したPR',
    numbers: props.details.createdPrNumbers,
  },
  {
    key: 'merged',
    label: 'マージしたPR',
    numbers: props.details.mergedPrNumbers,
  },
  {
    key: 'reviewed',
    label: 'レビューしたPR',
    numbers: props.details.reviewedPrNumbers,
  },
]);
</script>

<style scoped>
.pr-details-accordion details {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.pr-details-accordion summary {
  cursor: pointer;
  font-weight: 600;
}
</style>

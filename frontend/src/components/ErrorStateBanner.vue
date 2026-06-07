<template>
  <!-- 復旧可能なエラー表示バナー -->
  <v-alert
    :type="type"
    variant="tonal"
    :title="title"
    :text="message"
    closable
    @click:close="$emit('close')"
  >
    <template #append>
      <v-btn
        v-if="canRetry"
        variant="text"
        :color="type"
        @click="$emit('retry')"
      >
        {{ actionLabel }}
      </v-btn>
    </template>
  </v-alert>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    title?: string;
    canRetry?: boolean;
    type?: 'error' | 'warning' | 'info' | 'success';
    actionLabel?: string;
  }>(),
  {
    title: 'データの読み込みに失敗しました',
    canRetry: true,
    type: 'error',
    actionLabel: '別のファイルを選択',
  }
);

defineEmits<{
  close: [];
  retry: [];
}>();
</script>

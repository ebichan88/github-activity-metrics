<template>
  <!-- 復旧可能なエラー表示バナー -->
  <v-alert
    type="error"
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
        color="error"
        @click="$emit('retry')"
      >
        別のファイルを選択
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
  }>(),
  {
    title: 'データの読み込みに失敗しました',
    canRetry: true,
  }
);

defineEmits<{
  close: [];
  retry: [];
}>();
</script>

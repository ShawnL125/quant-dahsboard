<template>
  <a-drawer
    :open="open"
    :title="strategy?.strategy_id || 'Strategy Details'"
    :width="480"
    @close="emit('close')"
  >
    <template v-if="strategy">
      <a-descriptions bordered :column="1" size="small">
        <a-descriptions-item label="Strategy ID">
          {{ strategy.strategy_id }}
        </a-descriptions-item>
        <a-descriptions-item label="Running">
          <a-badge
            :status="strategy.is_running ? 'success' : 'default'"
            :text="strategy.is_running ? 'Yes' : 'No'"
          />
        </a-descriptions-item>
        <a-descriptions-item label="Symbols">
          <a-tag v-for="sym in strategy.symbols" :key="sym" color="blue">{{ sym }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Exchanges">
          <a-tag v-for="ex in strategy.exchanges" :key="ex">{{ ex }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Timeframes">
          {{ strategy.timeframes.join(', ') }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider>Parameters</a-divider>
      <a-descriptions bordered :column="1" size="small">
        <a-descriptions-item
          v-for="(value, key) in strategy.parameters"
          :key="String(key)"
          :label="String(key)"
        >
          {{ JSON.stringify(value) }}
        </a-descriptions-item>
      </a-descriptions>
      <a-empty v-if="Object.keys(strategy.parameters).length === 0" description="No parameters" />
    </template>
    <a-empty v-else description="No strategy selected" />
  </a-drawer>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types';

defineProps<{
  strategy: Strategy | null;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

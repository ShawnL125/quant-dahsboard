<template>
  <a-card title="Strategies">
    <a-table
      :columns="columns"
      :data-source="strategies"
      :pagination="false"
      size="small"
      row-key="strategy_id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'symbols'">
          <a-tag v-for="sym in record.symbols" :key="sym" color="blue">{{ sym }}</a-tag>
        </template>
        <template v-if="column.key === 'exchanges'">
          <a-tag v-for="ex in record.exchanges" :key="ex">{{ ex }}</a-tag>
        </template>
        <template v-if="column.key === 'is_running'">
          <a-switch
            :checked="record.is_running"
            @change="(checked: boolean) => emit('toggle', record.strategy_id, checked)"
          />
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="emit('view', record.strategy_id)">
            Details
          </a-button>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types';

defineProps<{
  strategies: Strategy[];
}>();

const emit = defineEmits<{
  toggle: [id: string, enabled: boolean];
  view: [id: string];
}>();

const columns = [
  { title: 'Strategy ID', dataIndex: 'strategy_id', key: 'strategy_id' },
  { title: 'Symbols', key: 'symbols' },
  { title: 'Exchanges', key: 'exchanges' },
  { title: 'Timeframes', dataIndex: 'timeframes', key: 'timeframes' },
  { title: 'Running', key: 'is_running' },
  { title: 'Action', key: 'action' },
];
</script>

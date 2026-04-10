<template>
  <div>
    <a-card title="Run Backtest" style="margin-bottom: 16px">
      <a-space>
        <a-button
          type="primary"
          :loading="store.loading"
          @click="store.runBacktest()"
        >
          Run Backtest
        </a-button>
        <a-tag v-if="store.taskStatus" :color="statusColor">
          {{ store.taskStatus }}
        </a-tag>
      </a-space>
      <a-alert
        v-if="store.error"
        :message="store.error"
        type="error"
        show-icon
        style="margin-top: 12px"
      />
    </a-card>

    <BacktestResult :result="store.currentResult" style="margin-bottom: 16px" />

    <a-card title="Backtest History">
      <a-table
        :columns="historyColumns"
        :data-source="store.history"
        :pagination="{ pageSize: 10 }"
        size="small"
        row-key="task_id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'created_at'">
            {{ formatTime(record.created_at) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-button
              type="link"
              size="small"
              :disabled="record.status !== 'COMPLETED' && record.status !== 'DONE'"
              @click="store.fetchResult(record.task_id)"
            >
              View
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useBacktestStore } from '@/stores/backtest';
import BacktestResult from '@/components/backtest/BacktestResult.vue';

const store = useBacktestStore();

const statusColor = computed(() => {
  switch (store.taskStatus) {
    case 'COMPLETED':
    case 'DONE':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'PENDING':
    case 'RUNNING':
      return 'blue';
    default:
      return 'default';
  }
});

const historyColumns = [
  { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', ellipsis: true },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created_at' },
  { title: 'Action', key: 'action' },
];

function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'DONE':
      return 'green';
    case 'FAILED':
      return 'red';
    case 'PENDING':
    case 'RUNNING':
      return 'blue';
    default:
      return 'default';
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  store.fetchHistory();
});
</script>

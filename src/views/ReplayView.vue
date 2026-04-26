<template>
  <div class="replay-page">
    <a-spin :spinning="store.loading">
      <ReplayRunForm @run="onRun" :loading="store.loading" />

      <a-alert v-if="store.error" :message="store.error" type="error" show-icon class="page-section" />

      <ReplaySummary v-if="store.summary" :summary="store.summary" class="page-section" />

      <div class="scenarios-section page-section">
        <div class="section-header">
          <span class="section-title">Scenarios</span>
          <a-button size="small" @click="store.fetchScenarios()">Refresh</a-button>
        </div>
        <ScenarioTable
          :scenarios="store.scenarios"
          @load-steps="onLoadSteps"
          @delete="onDeleteScenario"
        />
      </div>

      <div v-if="store.currentSteps.length > 0" class="steps-section page-section">
        <div class="section-header">
          <span class="section-title">Steps ({{ store.currentSteps.length }})</span>
        </div>
        <StepsTable :steps="store.currentSteps" />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useReplayStore } from '@/stores/replay';
import { message } from 'ant-design-vue';
import ReplayRunForm from '@/components/replay/ReplayRunForm.vue';
import ScenarioTable from '@/components/replay/ScenarioTable.vue';
import StepsTable from '@/components/replay/StepsTable.vue';
import ReplaySummary from '@/components/replay/ReplaySummary.vue';

const store = useReplayStore();

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollTask(taskId: string) {
  stopPolling();
  pollTimer = setInterval(async () => {
    await store.fetchTask(taskId);
    const task = store.currentTask;
    if (!task || task.status === 'COMPLETED' || task.status === 'DONE' || task.status === 'FAILED') {
      stopPolling();
      if (task && (task.status === 'COMPLETED' || task.status === 'DONE')) {
        await store.fetchSummary(taskId);
        message.success('Replay completed');
      } else if (task && task.status === 'FAILED') {
        message.error('Replay failed');
      }
    }
  }, 2000);
}

async function onRun(data: { strategy_id: string; symbol: string; start_time?: string; end_time?: string }) {
  try {
    const result = await store.run(data);
    const taskId = result?.data?.task_id;
    if (taskId) {
      pollTask(taskId);
    }
  } catch {
    message.error('Failed to start replay');
  }
}

async function onLoadSteps(scenarioId: string) {
  await store.fetchSteps(scenarioId);
}

async function onDeleteScenario(scenarioId: string) {
  try {
    await store.deleteScenario(scenarioId);
    message.success('Scenario deleted');
  } catch {
    message.error('Failed to delete scenario');
  }
}

onMounted(() => {
  store.fetchScenarios();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.replay-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section {
  margin-top: var(--q-card-gap);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}
</style>

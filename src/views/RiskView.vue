<template>
  <div class="risk-page">
    <a-spin :spinning="riskStore.loading">
      <KillSwitchBar
        v-if="riskStore.status?.kill_switch"
        :kill-switch="riskStore.status.kill_switch"
        @toggle="onKillSwitchToggle"
      />
      <div v-else class="ks-placeholder">Loading risk status...</div>
    </a-spin>

    <div class="risk-grid">
      <DrawdownChart
        :drawdown="riskStore.status?.drawdown"
        :history="riskStore.drawdownHistory"
        class="risk-cell"
      />
      <ExposureTable
        :exposure="riskStore.exposure"
        :config="riskStore.config"
        class="risk-cell"
      />
      <RiskConfigCards
        :config="riskStore.config"
        class="risk-cell"
      />
      <RiskEventsTable
        :events="riskStore.events"
        :total="riskStore.eventsTotal"
        :current-page="currentEventsPage"
        :page-size="eventsPageSize"
        @refresh="onRefreshEvents"
        @page-change="onPageChange"
        class="risk-cell"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useRiskStore } from '@/stores/risk';
import KillSwitchBar from '@/components/risk/KillSwitchBar.vue';
import DrawdownChart from '@/components/risk/DrawdownChart.vue';
import ExposureTable from '@/components/risk/ExposureTable.vue';
import RiskConfigCards from '@/components/risk/RiskConfigCards.vue';
import RiskEventsTable from '@/components/risk/RiskEventsTable.vue';

const riskStore = useRiskStore();
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));
const eventsPageSize = 20;
const currentEventsPage = ref(1);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function pollRiskData() {
  return Promise.all([riskStore.fetchStatus(), riskStore.fetchExposure()]);
}

function startPolling() {
  if (pollTimer) return;
  void pollRiskData();
  pollTimer = setInterval(() => {
    void pollRiskData();
  }, 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function onKillSwitchToggle(activate: boolean) {
  await riskStore.postKillSwitch({
    level: 'GLOBAL',
    activate,
    reason: activate ? 'Manual activation via dashboard' : 'Manual deactivation via dashboard',
  });
}

async function onRefreshEvents() {
  const offset = (currentEventsPage.value - 1) * eventsPageSize;
  await riskStore.fetchEvents(eventsPageSize, offset);
}

async function onPageChange(page: number) {
  currentEventsPage.value = page;
  const offset = (page - 1) * eventsPageSize;
  await riskStore.fetchEvents(eventsPageSize, offset);
}

watch(wsConnected, () => {
  // Always poll drawdown regardless of WS state
});

onMounted(async () => {
  await riskStore.fetchAll();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.risk-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.ks-placeholder {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 14px 20px;
  color: var(--q-text-muted);
  font-size: 13px;
  margin-bottom: var(--q-card-gap);
}

.risk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--q-card-gap);
}

.risk-cell {
  min-width: 0;
}

@media (max-width: 900px) {
  .risk-grid {
    grid-template-columns: 1fr;
  }
}
</style>

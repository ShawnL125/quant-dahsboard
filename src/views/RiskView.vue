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
        :current-page="riskStore.currentEventsPage"
        :page-size="riskStore.eventsPageSize"
        :total="riskStore.eventsTotal"
        @refresh="onRefreshEvents"
        @page-change="onPageChange"
        class="risk-cell"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRiskStore } from '@/stores/risk';
import KillSwitchBar from '@/components/risk/KillSwitchBar.vue';
import DrawdownChart from '@/components/risk/DrawdownChart.vue';
import ExposureTable from '@/components/risk/ExposureTable.vue';
import RiskConfigCards from '@/components/risk/RiskConfigCards.vue';
import RiskEventsTable from '@/components/risk/RiskEventsTable.vue';

const riskStore = useRiskStore();

let drawdownSampler: ReturnType<typeof setInterval> | null = null;

function startDrawdownSampler() {
  if (drawdownSampler) return;
  void riskStore.sampleDrawdown();
  drawdownSampler = setInterval(() => {
    void riskStore.sampleDrawdown();
  }, 5000);
}

function stopDrawdownSampler() {
  if (drawdownSampler) {
    clearInterval(drawdownSampler);
    drawdownSampler = null;
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
  const offset = (riskStore.currentEventsPage - 1) * riskStore.eventsPageSize;
  await riskStore.fetchEvents(riskStore.eventsPageSize, offset);
}

async function onPageChange(page: number) {
  const offset = (page - 1) * riskStore.eventsPageSize;
  await riskStore.fetchEvents(riskStore.eventsPageSize, offset);
}

onMounted(async () => {
  await riskStore.fetchAll();
  startDrawdownSampler();
});

onUnmounted(() => {
  stopDrawdownSampler();
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
  grid-rows: auto auto;
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

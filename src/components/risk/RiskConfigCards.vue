<template>
  <div class="config-card">
    <div class="config-title">Risk Configuration</div>
    <div class="config-grid">
      <div
        v-for="item in configItems"
        :key="item.label"
        class="config-item"
        :class="{ 'config-warn': item.warn }"
      >
        <span class="config-label">{{ item.label }}</span>
        <span class="config-value">{{ item.display }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RiskConfig } from '@/types';

const props = defineProps<{
  config: RiskConfig | null;
}>();

const configItems = computed(() => {
  const c = props.config;
  if (!c) return [];
  return [
    { label: 'Sizing Model', display: c.sizing_model, warn: false },
    { label: 'Max Positions', display: String(c.max_open_positions), warn: false },
    { label: 'Max Exposure', display: c.max_total_exposure_pct + '%', warn: false },
    { label: 'Per-Trade Risk', display: c.max_risk_per_trade_pct + '%', warn: false },
    { label: 'Max Drawdown', display: c.max_drawdown_pct + '%', warn: true },
    { label: 'Reduce at', display: c.position_reduce_at_pct + '%', warn: true },
    { label: 'Single Asset', display: c.max_single_asset_pct + '%', warn: false },
    { label: 'Correlated', display: c.max_correlated_exposure_pct + '%', warn: false },
    { label: 'Pyramiding', display: c.allow_pyramiding ? 'Enabled' : 'Disabled', warn: false },
    { label: 'Kill Switch', display: c.kill_switch_enabled ? 'Enabled' : 'Disabled', warn: false },
  ];
});
</script>

<style scoped>
.config-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--q-bg);
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.config-item.config-warn {
  border-left-color: var(--q-warning);
}

.config-label {
  font-size: 11px;
  color: var(--q-text-muted);
  font-weight: 500;
}

.config-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.config-warn .config-value {
  color: var(--q-warning);
}
</style>

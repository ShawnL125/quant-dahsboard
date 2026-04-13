<template>
  <div class="quality-alerts">
    <div class="section-header">
      <span class="section-title">Quality Alerts</span>
      <span v-if="alerts.length > 0" class="alert-badge">{{ alerts.length }}</span>
    </div>

    <div v-if="alerts.length === 0" class="empty-state">No quality alerts</div>

    <div v-else class="alert-list">
      <div v-for="(alert, idx) in alerts" :key="idx" class="alert-row" :class="`severity-${alert.severity}`">
        <span class="alert-type-badge" :class="`type-${alert.alert_type}`">
          {{ formatAlertType(alert.alert_type) }}
        </span>
        <div class="alert-body">
          <div class="alert-top">
            <span class="alert-symbol">{{ alert.symbol }}</span>
            <span class="alert-exchange">{{ alert.exchange }}</span>
            <span class="alert-severity" :class="alert.severity">{{ alert.severity }}</span>
          </div>
          <div class="alert-metric">
            {{ alert.metric_value }} vs threshold {{ alert.threshold }}
          </div>
          <div v-if="alert.details && Object.keys(alert.details).length > 0" class="alert-details">
            <span v-for="(val, key) in alert.details" :key="key" class="detail-chip">
              {{ key }}: {{ typeof val === 'number' ? val.toFixed(2) : val }}
            </span>
          </div>
        </div>
        <span class="alert-time">{{ formatTime(alert.detected_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QualityAlert } from '@/types';

defineProps<{
  alerts: QualityAlert[];
}>();

const ALERT_TYPE_LABELS: Record<string, string> = {
  data_gap: 'GAP',
  price_anomaly: 'ANOMALY',
  volume_spike: 'VOL SPIKE',
  high_latency: 'LATENCY',
  validation_failure: 'VALIDATION',
};

function formatAlertType(type: string): string {
  return ALERT_TYPE_LABELS[type] || type.toUpperCase();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.quality-alerts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.alert-badge {
  background: var(--q-warning-light);
  color: var(--q-warning);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
}

.alert-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--q-border);
}

.alert-list .alert-row:last-child { border-bottom: none; }

.alert-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  margin-top: 2px;
}

.type-data_gap { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.type-price_anomaly { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
.type-volume_spike { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.type-high_latency { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.type-validation_failure { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.alert-symbol {
  font-weight: 600;
  font-size: 12px;
  color: var(--q-text);
}

.alert-exchange {
  font-size: 11px;
  color: var(--q-text-muted);
}

.alert-severity {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.alert-severity.warning { background: var(--q-warning-light); color: var(--q-warning); }
.alert-severity.critical { background: var(--q-error-light); color: var(--q-error); }

.alert-metric {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--q-text-secondary);
}

.alert-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.detail-chip {
  font-size: 10px;
  color: var(--q-text-muted);
  background: var(--q-bg);
  padding: 1px 6px;
  border-radius: 4px;
}

.alert-time {
  font-size: 11px;
  color: var(--q-text-muted);
  flex-shrink: 0;
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 16px 0;
  font-size: 13px;
}
</style>

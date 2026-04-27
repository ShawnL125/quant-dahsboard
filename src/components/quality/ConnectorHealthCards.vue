<template>
  <div class="connector-health">
    <div class="section-header">
      <span class="section-title">Connector Health</span>
      <span v-if="offlineCount > 0" class="alert-count">{{ offlineCount }} offline</span>
    </div>

    <div v-if="connectors && Object.keys(connectors).length > 0" class="connector-grid">
      <div
        v-for="(conn, name) in connectors"
        :key="name"
        class="connector-card"
        :class="{ healthy: conn.ws_connected && conn.market_data?.receiving, unhealthy: !conn.ws_connected }"
      >
        <div class="connector-top">
          <span class="connector-dot" :class="conn.ws_connected ? 'dot-green' : 'dot-red'"></span>
          <span class="connector-name">{{ name }}</span>
        </div>
        <div class="connector-details">
          <div class="detail-row">
            <span class="detail-label">WebSocket</span>
            <span class="detail-value" :class="conn.ws_connected ? 'val-ok' : 'val-err'">
              {{ conn.ws_connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Receiving</span>
            <span class="detail-value" :class="conn.market_data?.receiving ? 'val-ok' : 'val-warn'">
              {{ conn.market_data?.receiving ? 'Yes' : 'No' }}
            </span>
          </div>
          <div v-if="conn.market_data?.last_event_age_s != null" class="detail-row">
            <span class="detail-label">Last Event</span>
            <span class="detail-value">{{ formatAge(conn.market_data.last_event_age_s) }}</span>
          </div>
          <div v-if="conn.market_data?.events_received > 0" class="detail-row">
            <span class="detail-label">Events</span>
            <span class="detail-value">{{ conn.market_data.events_received.toLocaleString() }}</span>
          </div>
          <div v-if="conn.reconnect_attempts" class="detail-row">
            <span class="detail-label">Reconnects</span>
            <span class="detail-value val-warn">{{ conn.reconnect_attempts }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">No connector data available</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ConnectorStatus } from '@/types';

const props = defineProps<{
  connectors: Record<string, ConnectorStatus> | null;
}>();

const offlineCount = computed(() => {
  if (!props.connectors) return 0;
  return Object.values(props.connectors).filter((c) => !c.ws_connected).length;
});

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s ago`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(0)}m ago`;
  return `${(seconds / 3600).toFixed(1)}h ago`;
}
</script>

<style scoped>
.connector-health {
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

.alert-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-error);
  background: var(--q-error-light);
  padding: 2px 8px;
  border-radius: 10px;
}

.connector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.connector-card {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connector-card.unhealthy {
  border-color: var(--q-error);
}

.connector-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connector-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background: var(--q-success); }
.dot-red { background: var(--q-error); }

.connector-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.connector-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 11px;
  color: var(--q-text-muted);
}

.detail-value {
  font-size: 11px;
  color: var(--q-text-secondary);
}

.val-ok { color: var(--q-success); }
.val-warn { color: var(--q-warning); }
.val-err { color: var(--q-error); }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 16px 0;
  font-size: 13px;
}
</style>

<template>
  <div class="security-section">
    <a-spin :spinning="store.loading">
      <div class="section-header">
        <span class="section-title">Security Audit</span>
        <a-button size="small" :loading="store.loading" @click="onRefresh">Refresh</a-button>
      </div>

      <div v-if="store.summary" class="summary-row sec-block">
        <div class="summary-card">
          <div class="summary-value text-bold">{{ store.summary.total_findings }}</div>
          <div class="summary-label">Total Findings</div>
        </div>
        <div class="summary-card">
          <div class="summary-value text-bold" :class="store.summary.unresolved_count > 0 ? 'text-error' : ''">{{ store.summary.unresolved_count }}</div>
          <div class="summary-label">Unresolved</div>
        </div>
        <div v-for="(count, severity) in store.summary.by_severity" :key="String(severity)" class="summary-card">
          <div class="summary-value text-bold">
            <span class="severity-pill" :class="severityClass(String(severity))">{{ count }}</span>
          </div>
          <div class="summary-label">{{ String(severity) }}</div>
        </div>
      </div>
      <div v-else class="sec-block">
        <div class="empty-state">No security summary available</div>
      </div>

      <div class="findings-card sec-block">
        <div class="card-title">Findings</div>
        <table v-if="store.entries.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Severity</th>
              <th>Finding</th>
              <th>Recommendation</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in store.entries" :key="entry.audit_id">
              <td>{{ entry.category }}</td>
              <td>
                <span class="severity-pill" :class="severityClass(entry.severity)">{{ entry.severity }}</span>
              </td>
              <td>{{ entry.finding }}</td>
              <td class="text-muted">{{ entry.recommendation }}</td>
              <td class="text-muted">{{ formatTime(entry.detected_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No security findings</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSecurityStore } from '@/stores/security';

const store = useSecurityStore();

function severityClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'severity-critical';
    case 'high': return 'severity-high';
    case 'medium': return 'severity-medium';
    case 'low': return 'severity-low';
    case 'info': return 'severity-info';
    default: return 'severity-info';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function onRefresh() {
  store.fetchSummary();
  store.fetchAudit();
}

onMounted(() => {
  store.fetchSummary();
  store.fetchAudit();
});
</script>

<style scoped>
.security-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.sec-block {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: var(--q-bg);
  border-radius: 8px;
  min-width: 100px;
}

.summary-value {
  font-size: 18px;
  color: var(--q-text);
}

.summary-label {
  font-size: 10px;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--q-hover);
}

.severity-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.severity-critical {
  border: 1px solid var(--q-error);
  color: var(--q-error);
  background: transparent;
}

.severity-high {
  border: 1px solid var(--q-warning);
  color: var(--q-warning);
  background: transparent;
}

.severity-medium {
  border: 1px solid var(--q-warning);
  color: var(--q-warning);
  background: transparent;
}

.severity-low {
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  background: transparent;
}

.severity-info {
  border: 1px solid var(--q-text-muted);
  color: var(--q-text-muted);
  background: transparent;
}

.text-bold {
  font-weight: 600;
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 11px;
}

.text-error {
  color: var(--q-error);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>
